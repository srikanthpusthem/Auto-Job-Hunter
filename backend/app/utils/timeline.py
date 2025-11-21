from typing import Optional, Dict, Any
from backend.app.db.mongo import get_database
from backend.app.db.repositories.timeline_repository import TimelineRepository

async def log_step(user_id: str, step: str, run_id: Optional[str] = None, metadata: Dict[str, Any] = None):
    """
    Log a step to the timeline.
    This helper gets the database connection and uses the TimelineRepository.
    """
    db = await get_database()
    repo = TimelineRepository(db)
    await repo.add_step(user_id, step, run_id, metadata)
