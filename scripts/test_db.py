import asyncio
import sys
import os

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.db.mongo import db
from backend.db.repositories import UserRepository

async def main():
    db.connect()
    repo = UserRepository(db.get_db())
    
    # Test Create
    user_id = await repo.create({"email": "test@example.com", "profile": {"name": "Test User"}})
    print(f"Created user with ID: {user_id}")
    
    # Test Read
    user = await repo.get_by_email("test@example.com")
    if user:
        print(f"Found user: {user.email}, Name: {user.profile.name}")
    else:
        print("User not found")
        
    # Test Delete
    await repo.delete(user_id)
    print("Deleted user")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
