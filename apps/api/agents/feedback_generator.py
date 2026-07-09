import os
import json
from typing import List, Dict, Any
from services.gemini_client import gemini_client
import google.generativeai as genai

def clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def generate_interview_feedback(history: List[Dict[str, Any]], scratchpad: str, interview_type: str) -> str:
    """
    Evaluates the entire interview session and generates a structured feedback report.
    history should contain: {"role": "...", "content": "...", "phase": "..."}
    """
    
    # Format the transcript for the LLM
    transcript_lines = []
    for idx, msg in enumerate(history):
        if msg['role'] != 'system':
            phase_tag = f"[{msg.get('phase', 'unknown').upper()}]"
            transcript_lines.append(f"Turn {idx} {phase_tag} {msg['role'].upper()}: {msg['content']}")
            
    transcript = "\n".join(transcript_lines)
    
    prompt = f"""
    You are an expert MBB interviewer evaluating a candidate's performance in a {interview_type} case interview.
    
    Review the following interview transcript (annotated by Turn ID and Phase) and the candidate's scratchpad notes.
    
    TRANSCRIPT:
    {transcript}
    
    CANDIDATE SCRATCHPAD:
    {scratchpad}
    
    Evaluate the candidate on a timeline and across 7 dimensions:
    1. Structuring & Problem Solving (Did they use a MECE, tailored framework?)
    2. Analytical Rigor (Math) (Did they calculate correctly? Did they ask for data logically?)
    3. Business Acumen & Creativity (Did they understand the industry context? Did they offer 2nd-level insights?)
    4. Communication & Presence (Were they concise, clear, and professional?)
    5. Coachability (How well did they incorporate your hints and feedback?)
    6. Synthesis & Conclusion (Did they provide a strong, actionable final recommendation?)
    7. Overall Confidence (Did they lead the case or wait to be led?)
    
    CRITICAL GRADING RULES:
    1. For `strengths` and `improvements`, you MUST cite specific Turn IDs (e.g., "In Turn 3, the candidate correctly identified..."). 
    2. Make `improvements` highly actionable and constructive (e.g., "Instead of using a generic value-chain framework, tailor it to a retail context by focusing on foot-traffic and basket size").
    3. Ensure `comment` under `dimensions` uses MBB-style feedback language (e.g., "Day 1 Readiness", "MECE", "Top-down communication").
    
    You MUST return ONLY valid JSON adhering exactly to this schema:
    {{
      "overall_score": 0.0, // average of all dimensions (1-5)
      "final_verdict": "string (e.g., Strong Hire, Hire, Weak No Hire, No Hire)",
      "strengths": ["string", "string"], // Exactly 2, citing Turn IDs
      "improvements": ["string", "string"], // Exactly 2, highly actionable, citing Turn IDs
      "dimensions": [
        {{
          "name": "string", // Match the 7 exactly: "Structuring & Problem Solving", "Analytical Rigor (Math)", "Business Acumen & Creativity", "Communication & Presence", "Coachability (How they handled hints)", "Synthesis & Conclusion", "Overall Confidence"
          "score": 0, // 1 to 5
          "comment": "string" // specific evidence from transcript, using MBB language
        }}
      ],
      "timeline_data": [ // Evaluate key candidate turns
        {{
          "turn_id": 0,
          "phase": "string",
          "strength": "strong" | "neutral" | "weak",
          "annotation": "string (e.g., Excellent clarifying question, Missed fixed costs here)"
        }}
      ],
      "strategic_advice": {{
        "day1_readiness_score": 0, // 0 to 100
        "recommended_next_case_type": "string (e.g., Profitability, Market Entry)",
        "estimated_hours_remaining": 0
      }}
    }}
    """
    
    try:
        config = genai.GenerationConfig(response_mime_type="application/json", temperature=0.3)
        response = gemini_client.generate_content(
            model_name=os.getenv("ANALYSIS_MODEL", "gemini-3.5-flash"), 
            prompt=prompt, 
            generation_config=config
        )
        return clean_json(response.text)
    except Exception as e:
        print(f"Error generating feedback: {e}")
        # Return empty structured fallback
        return json.dumps({
            "overall_score": 0.0,
            "final_verdict": "Error",
            "strengths": ["Data unavailable", "Data unavailable"],
            "improvements": ["Data unavailable", "Data unavailable"],
            "dimensions": [],
            "timeline_data": [],
            "strategic_advice": {
                "day1_readiness_score": 0,
                "recommended_next_case_type": "Profitability",
                "estimated_hours_remaining": 0
            }
        })
