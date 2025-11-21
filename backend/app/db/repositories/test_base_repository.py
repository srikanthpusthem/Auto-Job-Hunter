from pathlib import Path
import sys
from typing import Dict, List, Optional
from unittest import IsolatedAsyncioTestCase

sys.path.append(str(Path(__file__).resolve().parents[4]))

from backend.app.db.repositories.base_repository import BaseRepository
from backend.app.db.repositories.scan_history_repository import ScanHistoryRepository


class FakeCursor:
    def __init__(self, items: List[Dict]):
        self.items = list(items)

    def sort(self, key_or_list, direction: Optional[int] = None):
        if direction is None and isinstance(key_or_list, list):
            for key, sort_direction in reversed(key_or_list):
                self.items = sorted(
                    self.items,
                    key=lambda x: x.get(key),
                    reverse=sort_direction == -1,
                )
        else:
            self.items = sorted(
                self.items,
                key=lambda x: x.get(key_or_list),
                reverse=direction == -1,
            )
        return self

    def limit(self, limit: int):
        self.items = self.items[:limit]
        return self

    async def to_list(self, length: int):
        return self.items[:length]


class FakeCollection:
    def __init__(self, documents: List[Dict]):
        self.documents = list(documents)
        self.find_one_calls = []
        self.find_calls = []

    def _apply_projection(self, docs: List[Dict], projection: Optional[Dict]):
        if not projection:
            return docs
        projected = []
        for doc in docs:
            projected.append({key: value for key, value in doc.items() if projection.get(key)})
        return projected

    def find(self, query: Optional[Dict] = None, projection: Optional[Dict] = None):
        query = query or {}
        self.find_calls.append({"query": query, "projection": projection})
        filtered = [
            doc for doc in self.documents if all(doc.get(key) == value for key, value in query.items())
        ]
        filtered = self._apply_projection(filtered, projection)
        return FakeCursor(filtered)

    async def find_one(
        self, query: Optional[Dict] = None, sort: Optional[List[tuple]] = None, projection: Optional[Dict] = None
    ):
        query = query or {}
        self.find_one_calls.append({"query": query, "sort": sort, "projection": projection})
        filtered = [
            doc for doc in self.documents if all(doc.get(key) == value for key, value in query.items())
        ]
        if sort:
            for key, direction in reversed(sort):
                filtered = sorted(filtered, key=lambda x: x.get(key), reverse=direction == -1)
        filtered = self._apply_projection(filtered, projection)
        return filtered[0] if filtered else None

    async def insert_one(self, data: Dict):
        self.documents.append(data)

    async def update_one(self, filter: Dict, update: Dict):
        for document in self.documents:
            if all(document.get(k) == v for k, v in filter.items()):
                document.update(update.get("$set", {}))
                break

    async def delete_one(self, filter: Dict):
        for idx, document in enumerate(self.documents):
            if all(document.get(k) == v for k, v in filter.items()):
                del self.documents[idx]
                break


class FakeDatabase:
    def __init__(self, collections: Dict[str, List[Dict]]):
        self.collections = {name: FakeCollection(docs) for name, docs in collections.items()}

    def __getitem__(self, collection_name: str):
        return self.collections.setdefault(collection_name, FakeCollection([]))


class BaseRepositoryTest(IsolatedAsyncioTestCase):
    def setUp(self):
        self.documents = [
            {"_id": "1", "status": "completed", "started_at": 1, "value": "first", "user_id": "user-1"},
            {"_id": "2", "status": "completed", "started_at": 3, "value": "latest", "user_id": "user-1"},
            {"_id": "3", "status": "running", "started_at": 2, "value": "running", "user_id": "user-1"},
        ]
        db = FakeDatabase({"test": self.documents, "scan_history": self.documents})
        self.repo = BaseRepository(db, "test")
        self.scan_repo = ScanHistoryRepository(db)

    async def test_find_one_with_sort_returns_latest_completed(self):
        result = await self.repo.find_one({"status": "completed"}, sort=[("started_at", -1)])
        self.assertEqual(result["_id"], "2")
        self.assertEqual(result["value"], "latest")

    async def test_find_all_respects_sort_and_projection(self):
        results = await self.repo.find_all({}, sort=[("started_at", 1)], projection={"_id": 1, "started_at": 1})
        self.assertEqual([doc["_id"] for doc in results], ["1", "3", "2"])
        self.assertTrue(all(set(doc.keys()) == {"_id", "started_at"} for doc in results))

    async def test_scan_history_uses_repository_sorting(self):
        scans = await self.scan_repo.list_scans(user_id="user-1", limit=5)
        self.assertEqual([scan["_id"] for scan in scans], ["2", "3", "1"])

