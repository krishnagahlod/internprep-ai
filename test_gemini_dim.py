import sys
import os
sys.path.append('apps/api')
from dotenv import load_dotenv
load_dotenv('apps/api/.env')
from services.gemini_client import gemini_client

try:
    kwargs = {"model": "models/gemini-embedding-001", "content": "test", "output_dimensionality": 768}
    import google.generativeai as genai
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY_1"))
    res = genai.embed_content(**kwargs)
    print(f"Dimension with output_dimensionality: {len(res['embedding'])}")
except Exception as e:
    print(f"Error: {e}")
