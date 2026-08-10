import os
import json
import time
import random
from typing import Dict, Any, List, Optional
import httpx

class CerebrasClient:
    def __init__(self):
        self.keys = self._discover_keys()
        self.key_status = {key: 0 for key in self.keys}  # 0 means healthy, >0 means cooling down until timestamp
        self.current_index = 0
        self.cooldown_seconds = 60
        self.url = "https://api.cerebras.ai/v1/chat/completions"
        
        print(f"Initialized CerebrasClient with {len(self.keys)} API keys.")

    def _discover_keys(self) -> List[str]:
        keys = []
        for key, value in os.environ.items():
            if key.startswith("CEREBRAS_API_KEY") and value.strip():
                keys.append(value.strip())
        
        if not keys:
            keys = ["dummy_key_to_avoid_crash"]
            
        return list(set(keys))

    def _get_next_healthy_key(self) -> str:
        now = time.time()
        start_index = self.current_index
        
        for _ in range(len(self.keys)):
            key = self.keys[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.keys)
            
            if self.key_status[key] < now:
                return key
                
        return random.choice(self.keys)

    def _mark_key_cooldown(self, key: str):
        self.key_status[key] = time.time() + self.cooldown_seconds
        print(f"Rate limit hit. Marked Cerebras key ending in ...{key[-4:]} for {self.cooldown_seconds}s cooldown.")

    def generate_chat_completion(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.6, 
        max_tokens: int = 256,
        response_format: Optional[Dict[str, str]] = None,
        max_retries: int = 3
    ) -> str:
        for attempt in range(max_retries):
            key = self._get_next_healthy_key()
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            if response_format:
                payload["response_format"] = response_format

            try:
                with httpx.Client(timeout=30.0) as client:
                    response = client.post(self.url, headers=headers, json=payload)
                    
                    if response.status_code == 429:
                        self._mark_key_cooldown(key)
                        if attempt == max_retries - 1:
                            response.raise_for_status()
                        time.sleep(1 * (attempt + 1) + random.uniform(0, 1))
                        continue
                        
                    response.raise_for_status()
                    return response.json()["choices"][0]["message"].get("content", "")
                    
            except httpx.HTTPStatusError as e:
                error_msg = str(e).lower()
                if "429" in error_msg or "rate limit" in error_msg:
                    self._mark_key_cooldown(key)
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(1 * (attempt + 1) + random.uniform(0, 1))
                else:
                    raise e
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                time.sleep(1 * (attempt + 1) + random.uniform(0, 1))
                
        raise Exception("Max retries exceeded for Cerebras generate_chat_completion")

cerebras_client = CerebrasClient()
