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
        keys = []
        # Support GEMINI_API_KEY, GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
        for key, value in os.environ.items():
            if key.startswith("GEMINI_API_KEY") and value.strip():
                keys.append(value.strip())
        
        # Fallback if empty (shouldn't happen if env is set)
        if not keys:
            keys = ["dummy_key_to_avoid_crash"]
            
        return list(set(keys)) # Remove duplicates

    def _get_next_healthy_key(self) -> str:
        now = time.time()
        start_index = self.current_index
        
        for _ in range(len(self.keys)):
            key = self.keys[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.keys)
            
            if self.key_status[key] < now:
                return key
                
        # If all keys are in cooldown, we have to wait or just pick a random one and try
        # Let's pick a random one and hope
        return random.choice(self.keys)

    def _mark_key_cooldown(self, key: str):
        self.key_status[key] = time.time() + self.cooldown_seconds
        print(f"Rate limit hit. Marked key ending in ...{key[-4:]} for {self.cooldown_seconds}s cooldown.")

    def generate_content(self, model_name: str, prompt: str, generation_config: genai.GenerationConfig = None, max_retries: int = 3) -> Any:
        # Chat-based generation (if prompt is a string) or start_chat
        for attempt in range(max_retries):
            key = self._get_next_healthy_key()
            genai.configure(api_key=key)
            model = genai.GenerativeModel(model_name)
            
            try:
                if generation_config:
                    return model.generate_content(prompt, generation_config=generation_config)
                return model.generate_content(prompt)
            except Exception as e:
                error_msg = str(e).lower()
                if "429" in error_msg or "quota" in error_msg or "rate limit" in error_msg or "exhausted" in error_msg:
                    self._mark_key_cooldown(key)
                    if attempt == max_retries - 1:
                        raise e
                    # Backoff
                    time.sleep(1 * (attempt + 1) + random.uniform(0, 1))
                elif "notfound" in error_msg or "not found" in error_msg:
                    print(f"Model {model_name} not found, falling back to gemini-1.5-flash")
                    model = genai.GenerativeModel("gemini-1.5-flash")
                    if generation_config:
                        return model.generate_content(prompt, generation_config=generation_config)
                    return model.generate_content(prompt)
                else:
                    raise e
                    
        raise Exception("Max retries exceeded for generate_content")
        
    def start_chat(self, model_name: str, history: List[Dict[str, Any]] = None) -> Any:
        # For start_chat, we just configure with a healthy key and return the chat object.
        # It's less resilient to mid-chat 429s unless we wrap the chat object, but it's acceptable for now.
        key = self._get_next_healthy_key()
        genai.configure(api_key=key)
        model = genai.GenerativeModel(model_name)
        try:
            # Test if model exists by instantiating chat
            chat = model.start_chat(history=history or [])
            # Make a dummy call? No, start_chat doesn't make an API call immediately.
            # But if we want to fallback safely, we can just return it. 
            # If the user wants 2.5-flash everywhere, we'll try it. If start_chat fails later during send_message, that's harder to catch here.
            # But usually it fails on the first generate_content/send_message.
            return chat
        except Exception as e:
            if "notfound" in str(e).lower() or "not found" in str(e).lower():
                print(f"Model {model_name} not found, falling back to gemini-1.5-flash")
                model = genai.GenerativeModel("gemini-1.5-flash")
                return model.start_chat(history=history or [])
            raise e

    def embed_text(self, text: str, model_name: str = 'models/gemini-embedding-001', max_retries: int = 3) -> List[float]:
        for attempt in range(max_retries):
            key = self._get_next_healthy_key()
            genai.configure(api_key=key)
            
            try:
                res = genai.embed_content(model=model_name, content=text)
                return res['embedding']
            except Exception as e:
                error_msg = str(e).lower()
                if "429" in error_msg or "quota" in error_msg or "rate limit" in error_msg or "exhausted" in error_msg:
                    self._mark_key_cooldown(key)
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(0.5 * (attempt + 1) + random.uniform(0, 0.5))
                else:
                    raise e
                    
        raise Exception("Max retries exceeded for embed_text")

gemini_client = GeminiClient()
