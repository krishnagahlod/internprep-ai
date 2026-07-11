import os
from typing import List
from .gemini_client import gemini_client

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")
if not EMBEDDING_MODEL.startswith("models/") and not EMBEDDING_MODEL.startswith("tunedModels/"):
    EMBEDDING_MODEL = f"models/{EMBEDDING_MODEL}"

def get_embedding(text: str) -> List[float]:
    """
    Generates a vector embedding for the given text using Gemini.
    """
    return gemini_client.embed_text(text=text, model_name=EMBEDDING_MODEL, task_type="retrieval_document")

def get_query_embedding(text: str) -> List[float]:
    """
    Generates a vector embedding for a search query using Gemini.
    """
    return gemini_client.embed_text(text=text, model_name=EMBEDDING_MODEL, task_type="retrieval_query")
