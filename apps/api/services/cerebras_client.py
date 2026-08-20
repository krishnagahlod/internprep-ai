import os
import json
import time
import random
from typing import Dict, Any, List, Optional
import httpx
from services.gemini_client import gemini_client

class CerebrasClient:
    """
    High-availability, ultra-low-latency LLM gateway with automatic failover across:
    1. Groq API (openai/gpt-oss-20b, groq/compound, groq/compound-mini)
    2. Cerebras API (gpt-oss-120b, gemma-4-31b)
    3. Gemini API (gemini-2.5-flash)
    """
    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        self.groq_cooldown_until = 0
        
        self.cerebras_keys = self._discover_cerebras_keys()
        self.cerebras_key_status = {key: 0 for key in self.cerebras_keys}
        self.cerebras_current_index = 0
        self.cerebras_url = "https://api.cerebras.ai/v1/chat/completions"
        
        print(f"Initialized Fast-LLM Gateway: Groq ({'Active' if self.groq_key else 'None'}), Cerebras ({len(self.cerebras_keys)} keys), Gemini Fallback (Active).")

    def _discover_cerebras_keys(self) -> List[str]:
        keys = []
        for key, value in os.environ.items():
            if key.startswith("CEREBRAS_API_KEY") and value.strip():
                keys.append(value.strip())
        
        if not keys:
            keys = ["dummy_key_to_avoid_crash"]
            
        return list(set(keys))

    def _get_next_healthy_cerebras_key(self) -> Optional[str]:
        now = time.time()
        for _ in range(len(self.cerebras_keys)):
            key = self.cerebras_keys[self.cerebras_current_index]
            self.cerebras_current_index = (self.cerebras_current_index + 1) % len(self.cerebras_keys)
            
            if self.cerebras_key_status[key] < now:
                return key
        return None

    def _mark_cerebras_key_cooldown(self, key: str, duration: int = 60):
        self.cerebras_key_status[key] = time.time() + duration
        print(f"Marked Cerebras key ending in ...{key[-4:]} for {duration}s cooldown.")

    def _call_groq(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        max_tokens: int = 500,
        response_format: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        if not self.groq_key or time.time() < self.groq_cooldown_until:
            return None
            
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json"
        }
        
        # Priority models on Groq
        models_to_try = ["openai/gpt-oss-20b", "groq/compound", "groq/compound-mini"]
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
                with httpx.Client(timeout=15.0) as client:
                    response = client.post(self.groq_url, headers=headers, json=payload)
                    if response.status_code == 200:
                        content = response.json()["choices"][0]["message"].get("content", "")
                        if content:
                            return content.strip()
                    elif response.status_code == 429:
                        self.groq_cooldown_until = time.time() + 60
                        break
                    elif response.status_code == 413:
                        # Payload too large for Groq; failover to Gemini
                        break
                    elif response.status_code == 404:
                        continue
                    else:
                        print(f"Groq status {response.status_code}: {response.text[:100]}")
            except Exception as e:
                print(f"Groq request exception: {e}")
                
        return None

    def _call_cerebras(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        max_tokens: int = 500,
        response_format: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        key = self._get_next_healthy_cerebras_key()
        if not key or key == "dummy_key_to_avoid_crash":
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
            with httpx.Client(timeout=15.0) as client:
                response = client.post(self.cerebras_url, headers=headers, json=payload)
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"].get("content", "")
                    if content:
                        return content.strip()
                elif response.status_code == 402:
                    for k in self.cerebras_keys:
                        self._mark_cerebras_key_cooldown(k, duration=3600)
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

    def generate_chat_completion(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.6, 
        max_tokens: int = 500,
        response_format: Optional[Dict[str, str]] = None,
        max_retries: int = 2
    ) -> str:
        # 1. Try Groq (ultra fast, highly available)
        groq_res = self._call_groq(messages, temperature, max_tokens, response_format)
        if groq_res:
            return groq_res

        # 2. Try Cerebras
        cerebras_res = self._call_cerebras(model, messages, temperature, max_tokens, response_format)
        if cerebras_res:
            return cerebras_res

        # 3. Fallback to Gemini 2.5 Flash
        return self._call_gemini_fallback(messages, temperature, max_tokens)

cerebras_client = CerebrasClient()
