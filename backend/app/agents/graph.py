from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from backend.app.db.models import UserProfile, Job

class AgentState(TypedDict):
    user_profile: Dict[str, Any]
    search_query: Dict[str, Any]
    raw_jobs: List[Dict[str, Any]]
    normalized_jobs: List[Job]
    matched_jobs: List[Job]
    outreach_payloads: List[Dict[str, Any]]
    errors: List[str]
    run_meta: Dict[str, Any]
    user_id: str
    run_id: Optional[str]

workflow = StateGraph(AgentState)
