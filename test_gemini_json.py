import os, sys, json
sys.path.append('apps/api')
from dotenv import load_dotenv
load_dotenv('apps/api/.env')
import google.generativeai as genai
key = os.environ.get('GEMINI_API_KEY_1', '')
genai.configure(api_key=key)
model = genai.GenerativeModel('gemini-flash-latest')
prompt = 'Return {"test": "success"}'
try:
    config = genai.GenerationConfig(response_mime_type="application/json", temperature=0.1)
    res = model.generate_content(prompt, generation_config=config)
    print('SUCCESS JSON:', res.text)
except Exception as e:
    print('ERROR JSON:', str(e))
