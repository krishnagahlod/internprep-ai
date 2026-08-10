import os, sys
sys.path.append('apps/api')
from dotenv import load_dotenv
load_dotenv('apps/api/.env')
import google.generativeai as genai
key = os.environ.get('GEMINI_API_KEY_1', '')
genai.configure(api_key=key)
models = genai.list_models()
for m in models:
    print(m.name)
