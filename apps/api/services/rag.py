import os
from supabase import create_client, Client
from .embeddings import get_query_embedding

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client = create_client(url, key)

def retrieve_context(query: str, company_id: str = None, interview_type: str = None, top_k: int = 5) -> str:
    """
    Retrieves relevant knowledge base chunks using metadata-filtered vector search.
    """
    query_embedding = get_query_embedding(query)
    
    # We use a Supabase RPC function (match_kb_chunks) which we need to define in SQL
    # If it's not defined, we fallback to a simpler approach, but pgvector requires RPC for semantic search with metadata filters
    
    rpc_params = {
        "query_embedding": query_embedding,
        "match_threshold": 0.7,
        "match_count": top_k
    }
    
    if company_id:
        rpc_params["filter_company_id"] = company_id
    if interview_type:
        rpc_params["filter_interview_type"] = interview_type
        
    try:
        # Call the RPC function
        # Note: The user will need to run the SQL to create this RPC function
        response = supabase.rpc("match_kb_chunks", rpc_params).execute()
        
        if not response.data:
            return ""
            
        # Compile the context
        context_parts = []
        for item in response.data:
            context_parts.append(f"[Source: {item.get('source', 'Unknown')}]\n{item.get('content')}")
            
        return "\n\n---\n\n".join(context_parts)
    except Exception as e:
        print(f"Error retrieving context: {e}")
        return ""
