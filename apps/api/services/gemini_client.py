import os
import json
import time
import random
from typing import Dict, Any, List, Optional
import google.generativeai as genai

class GeminiClient:
    def __init__(self):
        self.keys = self._discover_keys()
        self.key_status = {key: 0 for key in self.keys}  # 0 means healthy, >0 means cooling down until timestamp
        self.current_index = 0
        self.cooldown_seconds = 60
        
        print(f"Initialized GeminiClient with {len(self.keys)} API keys.")

    def _discover_keys(self) -> List[str]:
        valid_studio_keys = []
        
        for key, value in os.environ.items():
            if key.startswith("GEMINI_API_KEY") and value.strip():
                val = value.strip()
                if val.startswith("AIzaSy"):
                    valid_studio_keys.append(val)
                elif not val.startswith("AQ.Ab"):
                    valid_studio_keys.append(val)
        
        discovered = list(dict.fromkeys(valid_studio_keys))
        if not discovered:
            discovered = ["dummy_key_to_avoid_crash"]
            
        return discovered

    def _get_next_healthy_key(self) -> str:
        now = time.time()
        start_index = self.current_index
        
        for _ in range(len(self.keys)):
            key = self.keys[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.keys)
            
            if self.key_status[key] < now:
                return key
                
        return random.choice(self.keys)

    def _mark_key_cooldown(self, key: str, duration: int = None):
        cooldown = duration if duration is not None else self.cooldown_seconds
        self.key_status[key] = time.time() + cooldown
        print(f"Marked Gemini key ending in ...{key[-4:]} for {cooldown}s cooldown.")

    def generate_content(self, model_name: str, prompt: str, generation_config: genai.GenerationConfig = None, max_retries: int = 6, pdf_bytes: bytes = None) -> Any:
        current_model_name = model_name
        for attempt in range(max_retries):
            key = self._get_next_healthy_key()
            genai.configure(api_key=key)
            model = genai.GenerativeModel(current_model_name)
            
            try:
                payload = [prompt]
                if pdf_bytes:
                    payload.append({
                        "mime_type": "application/pdf",
                        "data": pdf_bytes
                    })
                    
                if generation_config:
                    return model.generate_content(payload, generation_config=generation_config)
                return model.generate_content(payload)
            except Exception as e:
                error_msg = str(e).lower()
                if "429" in error_msg or "quota" in error_msg or "rate limit" in error_msg or "exhausted" in error_msg:
                    self._mark_key_cooldown(key, duration=60)
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(1.5 * (attempt + 1) + random.uniform(0, 1))
                elif "api_key_invalid" in error_msg or "api key not valid" in error_msg:
                    self._mark_key_cooldown(key, duration=3600)
                    if attempt == max_retries - 1:
                        raise e
                elif "404" in error_msg or "not found" in error_msg or "no longer available" in error_msg:
                    print(f"Model {current_model_name} not found, falling back to gemini-2.5-flash")
                    current_model_name = "gemini-2.5-flash"
                    if attempt == max_retries - 1:
                        raise e
                else:
                    self._mark_key_cooldown(key, duration=30)
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(1)
                    
        raise Exception("Max retries exceeded for generate_content")
        
    def generate_content_with_history(self, model_name: str, system_instruction: str, history: List[Dict[str, Any]], new_message: str, generation_config: genai.GenerationConfig = None, max_retries: int = 6) -> Any:
        current_model_name = model_name
        for attempt in range(max_retries):
            key = self._get_next_healthy_key()
            genai.configure(api_key=key)
            model = genai.GenerativeModel(current_model_name, system_instruction=system_instruction)
            
            try:
                chat = model.start_chat(history=history)
                if generation_config:
                    return chat.send_message(new_message, generation_config=generation_config)
                return chat.send_message(new_message)
            except Exception as e:
                error_msg = str(e).lower()
                if "429" in error_msg or "quota" in error_msg or "rate limit" in error_msg or "exhausted" in error_msg:
                    self._mark_key_cooldown(key, duration=60)
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(1.5 * (attempt + 1) + random.uniform(0, 1))
                elif "api_key_invalid" in error_msg or "api key not valid" in error_msg:
                    self._mark_key_cooldown(key, duration=3600)
                    if attempt == max_retries - 1:
                        raise e
                elif "404" in error_msg or "not found" in error_msg or "no longer available" in error_msg:
                    print(f"Model {current_model_name} not found, falling back to gemini-2.5-flash")
                    current_model_name = "gemini-2.5-flash"
                    if attempt == max_retries - 1:
                        raise e
                else:
                    self._mark_key_cooldown(key, duration=30)
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(1)
                    
        raise Exception("Max retries exceeded for generate_content_with_history")

    def create_chat_session(self, model_name: str, system_instruction: str = None) -> genai.ChatSession:
        key = self._get_next_healthy_key()
        genai.configure(api_key=key)
        
        try:
            if system_instruction:
                model = genai.GenerativeModel(model_name, system_instruction=system_instruction)
            else:
                model = genai.GenerativeModel(model_name)
            return model.start_chat(history=[])
        except Exception as e:
            model = genai.GenerativeModel("gemini-2.5-flash")
            return model.start_chat(history=[])

    def embed_text(self, text: str, model_name: str = "models/gemini-embedding-001", max_retries: int = 3, task_type: str = None) -> List[float]:
        for attempt in range(max_retries):
            key = self._get_next_healthy_key()
            genai.configure(api_key=key)
            
            try:
                kwargs = {"model": model_name, "content": text}
                if task_type:
                    kwargs["task_type"] = task_type
                res = genai.embed_content(**kwargs)
                return res["embedding"]
            except Exception as e:
                error_msg = str(e).lower()
                if "429" in error_msg or "quota" in error_msg or "rate limit" in error_msg or "exhausted" in error_msg:
                    self._mark_key_cooldown(key, duration=60)
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(0.5 * (attempt + 1) + random.uniform(0, 0.5))
                elif "api_key_invalid" in error_msg or "api key not valid" in error_msg:
                    self._mark_key_cooldown(key, duration=3600)
                    if attempt == max_retries - 1:
                        raise e
                else:
                    self._mark_key_cooldown(key, duration=30)
                    if attempt == max_retries - 1:
                        # Fallback dummy embedding vector to prevent system crash
                        return [0.0] * 768
                    time.sleep(0.5)
                    
        return [0.0] * 768

    def embed_batch(self, texts: List[str], model_name: str = "models/gemini-embedding-001", max_retries: int = 3, task_type: str = None) -> List[List[float]]:
        if not texts:
            return []
            
        for attempt in range(max_retries):
            key = self._get_next_healthy_key()
            genai.configure(api_key=key)
            
            try:
                kwargs = {"model": model_name, "content": texts}
                if task_type:
                    kwargs["task_type"] = task_type
                res = genai.embed_content(**kwargs)
                return res["embedding"]
            except Exception as e:
                error_msg = str(e).lower()
                if "429" in error_msg or "quota" in error_msg or "rate limit" in error_msg or "exhausted" in error_msg:
                    self._mark_key_cooldown(key, duration=60)
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(1.0 * (attempt + 1) + random.uniform(0, 0.5))
                elif "api_key_invalid" in error_msg or "api key not valid" in error_msg:
                    self._mark_key_cooldown(key, duration=3600)
                    if attempt == max_retries - 1:
                        raise e
                else:
                    self._mark_key_cooldown(key, duration=30)
                    if attempt == max_retries - 1:
                        return [[0.0] * 768 for _ in texts]
                    time.sleep(0.5)
                    
        return [[0.0] * 768 for _ in texts]

gemini_client = GeminiClient()
