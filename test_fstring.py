import json
achievements = [{'id': 1, 'title': 'test', 'section_type': 'test', 'parent_experience': 'test', 'competency_tags': []}]
saved_bullets = [{'id': 1, 'bullet_text': 'test', 'section_type': 'test'}]
rag_context = []
playbook_data = {}
target_source = 'test'
target_context = 'test'
target_role = 'consulting'

try:
    system_prompt = f"""
    User Achievements (Vault):
    {json.dumps([{ 'id': a.get('id'), 'title': a.get('title'), 'section': a.get('section_type'), 'parent': a.get('parent_experience'), 'tags': a.get('competency_tags', []) } for a in achievements])}
    
    User Saved Bullets (Point Bank):
    {json.dumps([{'id': b.get('id'), 'bullet_text': b.get('bullet_text'), 'section': b.get('section_type')} for b in saved_bullets])}
    """
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
