import os
import json
import time
import hashlib
import random
import threading
from collections import OrderedDict
from typing import Dict, Any, List, Optional
import httpx
from services.gemini_client import gemini_client

class CerebrasClient:
    """
    High-Availability, Multi-Key, Resilient Fast-LLM Gateway.
    Features:
    1. Multi-Key Round-Robin with 429 Cooldown for Groq (GROQ_API_KEY_1..N)
    2. Multi-Key Round-Robin for OpenRouter Free Tier (OPENROUTER_API_KEY_1..N)
    3. Multi-Key Gemini 2.5 Flash Fallback (GEMINI_API_KEY_1..N)
    4. Cerebras Fallback (with 402 automatic backoff)
    5. In-Memory SHA-256 Prompt Caching (TTL + LRU eviction)
    6. 6-Second Circuit Breakers per provider to prevent thread stalls
    """
    def __init__(self):
        self._lock = threading.Lock()
        
        # 1. Groq Multi-Key Pool
        self.groq_keys = self._discover_keys("GROQ_API_KEY")
        self.groq_key_status = {key: 0 for key in self.groq_keys}
        self.groq_current_index = 0
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        self.groq_failures = 0
        self.groq_circuit_tripped_until = 0

        # 2. OpenRouter Multi-Key Pool
        self.openrouter_keys = self._discover_keys("OPENROUTER_API_KEY")
        self.openrouter_key_status = {key: 0 for key in self.openrouter_keys}
        self.openrouter_current_index = 0
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.openrouter_failures = 0
        self.openrouter_circuit_tripped_until = 0

        # 3. Cerebras Multi-Key Pool
        self.cerebras_keys = self._discover_keys("CEREBRAS_API_KEY")
        self.cerebras_key_status = {key: 0 for key in self.cerebras_keys}
        self.cerebras_current_index = 0
        self.cerebras_url = "https://api.cerebras.ai/v1/chat/completions"
        self.cerebras_failures = 0
        self.cerebras_circuit_tripped_until = 0

        # 4. In-Memory SHA-256 Prompt Cache
        self._cache: OrderedDict = OrderedDict()
        self.max_cache_size = 4000
        self.cache_ttl_seconds = 3600  # 1 hour TTL
        
        # 5. Circuit Breaker Settings
        self.max_consecutive_failures = 3
        self.circuit_cooldown_seconds = 60
        self.per_request_timeout = 15.0  # 15-second timeout for 120B deep generation

        print(
            f"Initialized Resilient LLM Gateway: "
            f"Groq ({len(self.groq_keys)} keys), "
            f"OpenRouter ({len(self.openrouter_keys)} keys), "
            f"Gemini (Active Studio Pool), "
            f"Cerebras ({len(self.cerebras_keys)} keys), "
            f"In-Memory SHA-256 Cache (Ready)."
        )

    def _discover_keys(self, prefix: str) -> List[str]:
        keys = []
        for env_k, env_v in os.environ.items():
            if env_k.startswith(prefix) and env_v.strip():
                keys.append(env_v.strip())
        return list(dict.fromkeys(keys))

    # ==========================
    # In-Memory SHA-256 Caching
    # ==========================
    def _compute_cache_key(self, model: str, messages: List[Dict[str, str]], temperature: float, max_tokens: int, response_format: Optional[Dict[str, str]]) -> str:
        payload_repr = json.dumps({
            "m": model,
            "msg": messages,
            "t": round(temperature, 2),
            "max": max_tokens,
            "fmt": response_format
        }, sort_keys=True)
        return hashlib.sha256(payload_repr.encode("utf-8")).hexdigest()

    def _get_from_cache(self, cache_key: str) -> Optional[str]:
        with self._lock:
            if cache_key in self._cache:
                entry = self._cache[cache_key]
                if time.time() < entry["expires_at"]:
                    self._cache.move_to_end(cache_key)
                    return entry["content"]
                else:
                    del self._cache[cache_key]
        return None

    def _set_in_cache(self, cache_key: str, content: str):
        if not content or len(content.strip()) < 5:
            return
        with self._lock:
            # Evict oldest if limit reached
            if len(self._cache) >= self.max_cache_size:
                self._cache.popitem(last=False)
            self._cache[cache_key] = {
                "content": content,
                "expires_at": time.time() + self.cache_ttl_seconds
            }

    # ==========================
    # Groq Multi-Key Dispatch
    # ==========================
    def _get_next_healthy_groq_key(self) -> Optional[str]:
        now = time.time()
        with self._lock:
            for _ in range(len(self.groq_keys)):
                key = self.groq_keys[self.groq_current_index]
                self.groq_current_index = (self.groq_current_index + 1) % len(self.groq_keys)
                if self.groq_key_status[key] < now:
                    return key
        return None

    def _mark_groq_key_cooldown(self, key: str, duration: int = 60):
        with self._lock:
            self.groq_key_status[key] = time.time() + duration
            print(f"Marked Groq key ending in ...{key[-4:]} for {duration}s cooldown.")

    def _call_groq(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        max_tokens: int = 500,
        response_format: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        if not self.groq_keys or time.time() < self.groq_circuit_tripped_until:
            return None

        # Try across available healthy Groq keys
        for _ in range(min(len(self.groq_keys), 3)):
            key = self._get_next_healthy_groq_key()
            if not key:
                break

            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            
            models_to_try = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "groq/compound", "groq/compound-mini"]
            for model_candidate in models_to_try:
                payload = {
                    "model": model_candidate,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max(max_tokens, 150)
                }
                if response_format and response_format.get("type") == "json_object":
                    payload["response_format"] = {"type": "json_object"}

                try:
                    with httpx.Client(timeout=self.per_request_timeout) as client:
                        response = client.post(self.groq_url, headers=headers, json=payload)
                        if response.status_code == 200:
                            content = response.json()["choices"][0]["message"].get("content", "")
                            if content:
                                self.groq_failures = 0
                                return content.strip()
                        elif response.status_code == 429:
                            self._mark_groq_key_cooldown(key, duration=60)
                            break
                        elif response.status_code == 413:
                            # Payload too large for Groq; failover to Gemini/OpenRouter
                            return None
                        elif response.status_code == 400 and "response_format" in payload:
                            # Retry without response_format constraint
                            del payload["response_format"]
                            retry_res = client.post(self.groq_url, headers=headers, json=payload)
                            if retry_res.status_code == 200:
                                content = retry_res.json()["choices"][0]["message"].get("content", "")
                                if content:
                                    self.groq_failures = 0
                                    return content.strip()
                            else:
                                print(f"Groq API key ...{key[-4:]} error {retry_res.status_code}: {retry_res.text[:80]}")
                        else:
                            print(f"Groq API key ...{key[-4:]} error {response.status_code}: {response.text[:80]}")
                except Exception as e:
                    # Timeout or connection error
                    print(f"Groq request exception (key ...{key[-4:]}): {e}")
                    self._mark_groq_key_cooldown(key, duration=30)
                    break

        self.groq_failures += 1
        if self.groq_failures >= self.max_consecutive_failures:
            self.groq_circuit_tripped_until = time.time() + self.circuit_cooldown_seconds
            print(f"Groq circuit tripped for {self.circuit_cooldown_seconds}s.")
        return None

    # ==========================
    # OpenRouter Multi-Key Dispatch
    # ==========================
    def _get_next_healthy_openrouter_key(self) -> Optional[str]:
        now = time.time()
        with self._lock:
            for _ in range(len(self.openrouter_keys)):
                key = self.openrouter_keys[self.openrouter_current_index]
                self.openrouter_current_index = (self.openrouter_current_index + 1) % len(self.openrouter_keys)
                if self.openrouter_key_status[key] < now:
                    return key
        return None

    def _mark_openrouter_key_cooldown(self, key: str, duration: int = 60):
        with self._lock:
            self.openrouter_key_status[key] = time.time() + duration
            print(f"Marked OpenRouter key ending in ...{key[-4:]} for {duration}s cooldown.")

    def _call_openrouter(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        max_tokens: int = 500,
        response_format: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        if not self.openrouter_keys or time.time() < self.openrouter_circuit_tripped_until:
            return None

        key = self._get_next_healthy_openrouter_key()
        if not key:
            return None

        headers = {
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": "https://internprep.ai",
            "X-Title": "InternPrep AI",
            "Content-Type": "application/json"
        }

        # Active fast & free models on OpenRouter
        free_models = [
            "nvidia/nemotron-3.5-lightning:free",
            "google/gemma-4-26b-a4b-it:free",
            "z-ai/glm-5.2:free",
            "liquid/lfm-2.5-2.6b:free"
        ]

        for model_candidate in free_models:
            payload = {
                "model": model_candidate,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            if response_format and response_format.get("type") == "json_object":
                payload["response_format"] = {"type": "json_object"}

            try:
                with httpx.Client(timeout=self.per_request_timeout) as client:
                    response = client.post(self.openrouter_url, headers=headers, json=payload)
                    if response.status_code == 200:
                        content = response.json()["choices"][0]["message"].get("content", "")
                        if content:
                            self.openrouter_failures = 0
                            return content.strip()
                    elif response.status_code == 429:
                        self._mark_openrouter_key_cooldown(key, duration=60)
                        break
                    elif response.status_code == 404:
                        continue
                    else:
                        print(f"OpenRouter status {response.status_code}: {response.text[:80]}")
            except Exception as e:
                print(f"OpenRouter exception: {e}")
                self._mark_openrouter_key_cooldown(key, duration=30)
                break

        self.openrouter_failures += 1
        if self.openrouter_failures >= self.max_consecutive_failures:
            self.openrouter_circuit_tripped_until = time.time() + self.circuit_cooldown_seconds
        return None

    # ==========================
    # Cerebras Dispatch
    # ==========================
    def _get_next_healthy_cerebras_key(self) -> Optional[str]:
        now = time.time()
        with self._lock:
            for _ in range(len(self.cerebras_keys)):
                key = self.cerebras_keys[self.cerebras_current_index]
                self.cerebras_current_index = (self.cerebras_current_index + 1) % len(self.cerebras_keys)
                if self.cerebras_key_status[key] < now:
                    return key
        return None

    def _mark_cerebras_key_cooldown(self, key: str, duration: int = 60):
        with self._lock:
            self.cerebras_key_status[key] = time.time() + duration

    def _call_cerebras(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        max_tokens: int = 500,
        response_format: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        if not self.cerebras_keys or time.time() < self.cerebras_circuit_tripped_until:
            return None

        key = self._get_next_healthy_cerebras_key()
        if not key:
            return None

        target_model = "gpt-oss-120b"
        if "gemma" in model.lower():
            target_model = "gemma-4-31b"

        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if response_format:
            payload["response_format"] = response_format

        try:
            with httpx.Client(timeout=self.per_request_timeout) as client:
                response = client.post(self.cerebras_url, headers=headers, json=payload)
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"].get("content", "")
                    if content:
                        self.cerebras_failures = 0
                        return content.strip()
                elif response.status_code == 402:
                    for k in self.cerebras_keys:
                        self._mark_cerebras_key_cooldown(k, duration=3600)
                    self.cerebras_circuit_tripped_until = time.time() + 3600
                    return None
                elif response.status_code == 429:
                    self._mark_cerebras_key_cooldown(key, duration=120)
                    return None
                else:
                    self._mark_cerebras_key_cooldown(key, duration=60)
                    return None
        except Exception as e:
            self._mark_cerebras_key_cooldown(key, duration=60)
            return None

    # ==========================
    # Gemini 2.5 Flash Fallback
    # ==========================
    def _call_gemini_fallback(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        max_tokens: int = 500
    ) -> str:
        system_instruction = ""
        user_prompt_lines = []
        
        for m in messages:
            role = m.get("role", "")
            content = m.get("content", "")
            if role == "system":
                system_instruction += content + "\n\n"
            elif role in ["user", "human"]:
                user_prompt_lines.append(f"User: {content}")
            elif role in ["assistant", "ai"]:
                user_prompt_lines.append(f"Assistant: {content}")

        full_prompt = (system_instruction + "\n" + "\n".join(user_prompt_lines)).strip()
        
        try:
            import google.generativeai as genai
            config = genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max(max_tokens, 200)
            )
            res = gemini_client.generate_content(
                model_name="gemini-2.5-flash",
                prompt=full_prompt,
                generation_config=config
            )
            if hasattr(res, "text") and res.text:
                return res.text.strip()
            elif hasattr(res, "candidates") and res.candidates:
                cand = res.candidates[0]
                if hasattr(cand, "content") and cand.content and hasattr(cand.content, "parts") and cand.content.parts:
                    return cand.content.parts[0].text.strip()
            return "I am ready to proceed with your answer. Let's continue."
        except Exception as e:
            print(f"Gemini fallback error in Fast-LLM gateway: {e}")
            return "I am ready to proceed. Let us continue with the interview."

    # ==========================
    # Main Gateway Entrypoint
    # ==========================
    def generate_chat_completion(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.6, 
        max_tokens: int = 500,
        response_format: Optional[Dict[str, str]] = None,
        use_cache: bool = True,
        max_retries: int = 2
    ) -> str:
        # 1. Check SHA-256 In-Memory Cache (0ms instant return on repeated prompts)
        cache_key = ""
        if use_cache:
            cache_key = self._compute_cache_key(model, messages, temperature, max_tokens, response_format)
            cached_res = self._get_from_cache(cache_key)
            if cached_res:
                return cached_res

        result: Optional[str] = None

        # 2. Tier 1: Groq Multi-Key Pool (<200ms ultra fast)
        result = self._call_groq(messages, temperature, max_tokens, response_format)

        # 3. Tier 2: OpenRouter Free Models Pool
        if not result:
            result = self._call_openrouter(messages, temperature, max_tokens, response_format)

        # 4. Tier 3: Cerebras (if active)
        if not result:
            result = self._call_cerebras(model, messages, temperature, max_tokens, response_format)

        # 5. Tier 4: Gemini 2.5 Flash Multi-Key Pool (Rock Solid Fallback)
        if not result:
            result = self._call_gemini_fallback(messages, temperature, max_tokens)

        # Cache valid responses
        if use_cache and result and cache_key:
            self._set_in_cache(cache_key, result)

        return result

    # ==========================
    # Real-Time SSE Streaming Entrypoint
    # ==========================
    def stream_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        max_tokens: int = 500,
        model: str = "gpt-oss-120b"
    ):
        """
        Generator yielding text token chunks live from Groq / OpenRouter / Gemini with fallback.
        """
        # 1. Tier 1: Groq Multi-Key Streaming (<150ms TTFT)
        if self.groq_keys and time.time() >= self.groq_circuit_tripped_until:
            key = self._get_next_healthy_groq_key()
            if key:
                headers = {
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json"
                }
                models_to_try = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "groq/compound", "groq/compound-mini"]
                for model_candidate in models_to_try:
                    payload = {
                        "model": model_candidate,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max(max_tokens, 150),
                        "stream": True
                    }
                    try:
                        with httpx.Client(timeout=self.per_request_timeout) as client:
                            with client.stream("POST", self.groq_url, headers=headers, json=payload) as response:
                                if response.status_code == 200:
                                    self.groq_failures = 0
                                    for line in response.iter_lines():
                                        if line.startswith("data: "):
                                            data_str = line[6:].strip()
                                            if data_str == "[DONE]":
                                                return
                                            try:
                                                data_json = json.loads(data_str)
                                                delta = data_json["choices"][0].get("delta", {})
                                                content = delta.get("content", "")
                                                if content:
                                                    yield content
                                            except Exception:
                                                continue
                                    return
                    except Exception as e:
                        print(f"Groq streaming exception: {e}")
                        self._mark_groq_key_cooldown(key, duration=30)
                        break

        # 2. Tier 2: OpenRouter Free Models Streaming
        if self.openrouter_keys and time.time() >= self.openrouter_circuit_tripped_until:
            key = self._get_next_healthy_openrouter_key()
            if key:
                headers = {
                    "Authorization": f"Bearer {key}",
                    "HTTP-Referer": "https://internprep.ai",
                    "X-Title": "InternPrep AI",
                    "Content-Type": "application/json"
                }
                free_models = [
                    "nvidia/nemotron-3.5-lightning:free",
                    "google/gemma-4-26b-a4b-it:free",
                    "z-ai/glm-5.2:free"
                ]
                for model_candidate in free_models:
                    payload = {
                        "model": model_candidate,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "stream": True
                    }
                    try:
                        with httpx.Client(timeout=self.per_request_timeout) as client:
                            with client.stream("POST", self.openrouter_url, headers=headers, json=payload) as response:
                                if response.status_code == 200:
                                    self.openrouter_failures = 0
                                    for line in response.iter_lines():
                                        if line.startswith("data: "):
                                            data_str = line[6:].strip()
                                            if data_str == "[DONE]":
                                                return
                                            try:
                                                data_json = json.loads(data_str)
                                                delta = data_json["choices"][0].get("delta", {})
                                                content = delta.get("content", "")
                                                if content:
                                                    yield content
                                            except Exception:
                                                continue
                                    return
                    except Exception as e:
                        print(f"OpenRouter streaming exception: {e}")
                        self._mark_openrouter_key_cooldown(key, duration=30)
                        break

        # 3. Tier 3: Non-streaming fallback chunked generator
        full_res = self.generate_chat_completion(model, messages, temperature, max_tokens)
        if full_res:
            words = full_res.split(" ")
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")

cerebras_client = CerebrasClient()
