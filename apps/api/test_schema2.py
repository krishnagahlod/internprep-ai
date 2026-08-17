import os
from dotenv import load_dotenv
import google.generativeai as genai
import typing_extensions as typing

load_dotenv()
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

class RadarScores(typing.TypedDict):
    quantification: int
    action_verbs: int

class BulletFeedback(typing.TypedDict, total=False):
    original_bullet: str
    section_type: str
    severity: str
    confidence: float

class SectionSummary(typing.TypedDict):
    score: int
    summary: str
    bullet_count: int

class SectionSummaries(typing.TypedDict, total=False):
    experience: SectionSummary

class ResumeAnalysisResponse(typing.TypedDict):
    overall_feedback: str
    radar_scores_reasoning: list[str]
    radar_scores: RadarScores
    section_summaries: SectionSummaries
    bullets: list[BulletFeedback]

model = genai.GenerativeModel('gemini-1.5-flash')
config = genai.GenerationConfig(
    response_mime_type='application/json',
    temperature=0.0,
    response_schema=ResumeAnalysisResponse
)

prompt = """
Return ONLY valid JSON exactly matching this schema. Evaluate the resume bullet.
Bullets:
- I did some work.
"""
try:
    res = model.generate_content(prompt, generation_config=config)
    print('SUCCESS')
    print(res.text)
except Exception as e:
    print('ERROR:', e)
