import json
def test():
    target_role = 'consulting'
    target_company = None
    job_description = None
    data_source = 'point_bank'
    achievements = []
    saved_bullets = []
    rag_context = []
    playbook_data = {}
    
    target_context = f"Target Role: {target_role}"
    system_prompt = f"""
    You are a placement strategy engine for an IIT Bombay student.
    Analyze the user's achievements and saved bullets against the domain playbook and provide a highly detailed resume strategy report.
    
    Data Source Analyzed: {data_source}
    - Number of Achievements: {len(achievements)}
    - Number of Saved Bullets: {len(saved_bullets)}
    
    Target Context:
    {target_context}
    
    Domain Playbook Context:
    {json.dumps(playbook_data, indent=2)}
    
    User Achievements (Vault):
    {json.dumps([{ 'id': a.get('id'), 'title': a.get('title'), 'section': a.get('section_type'), 'parent': a.get('parent_experience'), 'tags': a.get('competency_tags', []) } for a in achievements])}
    
    User Saved Bullets (Point Bank):
    {json.dumps([{'id': b.get('id'), 'bullet_text': b.get('bullet_text'), 'section': b.get('section_type')} for b in saved_bullets])}
    
    RAG Context (Comparison to successful senior bullets):
    {json.dumps(rag_context, indent=2)}
    
    INSTRUCTIONS:
    Output MUST be a JSON object strictly matching this schema:
    {{
      "domain": "the target role",
      "overall_readiness_score": 0-100,
      "overall_guidance": "High-level guidance on what to prioritize",
      "section_analysis": [
        {{
          "section": "experience|projects|por|scholastic|extracurricular",
          "priority_level": "critical|high|medium|low",
          "domain_guidance": "What the playbook says about this section",
          "user_points": [
            {{
              "point_id": "uuid of the bullet or achievement",
              "bullet_text": "The text being evaluated",
              "verdict": "keep|needs_rework|cut",
              "reasoning": "Why this verdict",
              "refine_instruction": "Instruction to pass to the AI Refine tool to fix it (if needs_rework), else null"
            }}
          ]
        }}
      ],
      "competency_coverage": [
        {{
          "theme": "name of competency theme from playbook",
          "domain_weight": 0.0-1.0,
          "user_coverage": 0.0-1.0,
          "gap_assessment": "Assessment of user coverage vs domain ideal",
          "suggested_action": "Actionable advice"
        }}
      ],
      "phrasing_alerts": [
        {{
          "point_id": "uuid",
          "issue": "weak_verb|missing_metric|structure",
          "detail": "What is wrong",
          "refine_instruction": "Instruction to fix"
        }}
      ]
    }}
    """
    return system_prompt

try:
    test()
    print('SUCCESS')
except Exception as e:
    import traceback
    traceback.print_exc()
