import os, sys
sys.path.append('apps/api')
from dotenv import load_dotenv
load_dotenv('apps/api/.env')
import google.generativeai as genai
key = os.environ.get('GEMINI_API_KEY_1', '')
genai.configure(api_key=key)
model = genai.GenerativeModel('gemini-flash-latest')
try:
    res = model.generate_content('test')
    print('SUCCESS flash-latest:', res.text)
except Exception as e:
    print('ERROR flash-latest:', str(e))
