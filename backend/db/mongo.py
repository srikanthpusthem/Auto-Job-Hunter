from motor.motor_asyncio import AsyncIOMotorClient
from backend.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None

    def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        print(f"Connected to MongoDB at {settings.MONGODB_URL}")

    def close(self):
        if self.client:
            self.client.close()
            print("Closed MongoDB connection")

    def get_db(self):
        return self.client[settings.DATABASE_NAME]

db = MongoDB()

async def get_database():
    return db.get_db()
