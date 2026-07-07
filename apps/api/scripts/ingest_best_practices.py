import os
import json
import fitz  # PyMuPDF
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai_client = genai.Client(api_key=GEMINI_API_KEY)

PDF_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/resumes/Resume Making Session.pdf"))
OUTPUT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/resumes/best_practices_rules.json"))

def ingest_best_practices():
    print(f"Reading {PDF_PATH}...")
    try:
        doc = fitz.open(PDF_PATH)
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
            
        print("Sending to Gemini for rule extraction...")
        prompt = f"""
        You are an expert parsing a Resume Best Practices guide from a top-tier university (IIT Bombay).
        Extract all explicit, structural, and stylistic rules for writing resume bullet points.
        
        Focus on:
        - The structural formula of a bullet (e.g., Action Verb + Context + Metric).
        - Explicit Do's and Don'ts (e.g., "no 2-line points", "no full stops").
        - Frameworks mentioned (e.g., STAR).
        - Section-specific rules (e.g., how to write PORs vs Projects).
        
        Return a JSON object containing an array of strings, where each string is a clear, actionable rule.
        
        {{
            "rules": [
                "Rule 1",
                "Rule 2"
            ]
        }}
        
        Guide Text:
        {text}
        """
        
        response = genai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        data = json.loads(response.text)
        rules = data.get("rules", [])
        
        with open(OUTPUT_PATH, 'w') as f:
            json.dump(data, f, indent=4)
            
        print(f"Successfully extracted {len(rules)} rules and saved to {OUTPUT_PATH}")
        
    except Exception as e:
        print(f"Extraction Error: {e}")

if __name__ == "__main__":
    ingest_best_practices()
