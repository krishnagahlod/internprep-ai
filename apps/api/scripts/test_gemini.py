import os
import fitz
import requests
import json
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

pdf_path = r'C:\Interview Preparation Platform\data\casebooks\1. Case-Interviews-Cracked.pdf'
doc = fitz.open(pdf_path)
text = ''
for i in range(min(25, len(doc))):
    text += doc[i].get_text('text') + f'\n\n--- PAGE {i} ---\n\n'

prompt = f"""
You are an expert parsing a consulting casebook. 
Analyze the following text (the first 25 pages) and find the Table of Contents.
Extract ONLY the actual practice cases and guesstimates. 
IGNORE strategy chapters, preparation tips, frameworks, and author bios.

Return ONLY a JSON object in this exact format:
{{
    "cases": [
        {{
            "title": "Case Name",
            "printed_page_num": 12,
            "case_type": "Profitability"
        }}
    ]
}}

Raw Text:
{text[:12000]}
"""

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {
        "temperature": 0.1,
        "responseMimeType": "application/json"
    }
}

r = requests.post(url, json=payload).json()
print(json.dumps(r, indent=2))
