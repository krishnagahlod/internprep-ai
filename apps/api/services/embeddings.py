import os
import google.generativeai as genai
from typing import List

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")
if not EMBEDDING_MODEL.startswith("models/") and not EMBEDDING_MODEL.startswith("tunedModels/"):
    EMBEDDING_MODEL = f"models/{EMBEDDING_MODEL}"

def get_embedding(text: str) -> List[float]:
    """
    Generates a vector embedding for the given text using Gemini.
    """
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document"
    )
    return result['embedding']

def get_query_embedding(text: str) -> List[float]:
    """
    Generates a vector embedding for a search query using Gemini.
    """
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_query"
    )
    return result['embedding']
