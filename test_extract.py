import os, sys, json
sys.path.append('apps/api')
from dotenv import load_dotenv
load_dotenv('apps/api/.env')
import google.generativeai as genai
from services.gemini_client import gemini_client

prompt = '''
Extract every single achievement bullet point from the following resume text.
Return ONLY a JSON list of objects containing 'bullet_text', 'section_type', and 'strength'.
Section type must be one of: experience, project, por, scholastic, extracurricular.
Strength must be either "strong" (has numbers/metrics) or "weak" (vague, no metrics).

Resume Text:
Developed a web application.
Increased sales by 20%.
'''
try:
    config = genai.GenerationConfig(response_mime_type="application/json", temperature=0.1)
    res = gemini_client.generate_content("gemini-flash-latest", prompt, generation_config=config)
    print('SUCCESS:', res.text)
except Exception as e:
    print('ERROR:', str(e))
