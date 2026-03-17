import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import bcrypt

async def setup_db():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = "JoshuaJohnson" # Hardcoded as per user request
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # 1. Seed Facts
    existing_facts = await db.facts.count_documents({})
    if existing_facts == 0:
        sample_facts = [
            {
                "id": str(uuid.uuid4()),
                "title": "The Great Wall Myth",
                "false_belief": "The Great Wall of China is visible from space with the naked eye.",
                "truth": "The Great Wall is too narrow to be seen from space without aid. Astronauts confirm it's virtually impossible to spot.",
                "category": "space",
                "image_url": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800",
                "author_id": "system",
                "author_username": "FactsAreFoes",
                "upvotes": 42,
                "downvotes": 3,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_featured": True,
                "ai_explanation": None
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Napoleon's Height",
                "false_belief": "Napoleon Bonaparte was extremely short.",
                "truth": "Napoleon was actually 5'7\" (170cm), above average height for his era. The myth came from British propaganda.",
                "category": "history",
                "image_url": "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800",
                "author_id": "system",
                "author_username": "FactsAreFoes",
                "upvotes": 38,
                "downvotes": 2,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_featured": True,
                "ai_explanation": None
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Goldfish Memory",
                "false_belief": "Goldfish have a 3-second memory.",
                "truth": "Goldfish can actually remember things for months. Scientists have trained them to navigate mazes.",
                "category": "nature",
                "image_url": "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=800",
                "author_id": "system",
                "author_username": "FactsAreFoes",
                "upvotes": 56,
                "downvotes": 4,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_featured": True,
                "ai_explanation": None
            },
            {
                "id": str(uuid.uuid4()),
                "title": "We Only Use 10% of Our Brain",
                "false_belief": "Humans only use 10% of their brain capacity.",
                "truth": "Brain scans show we use virtually every part of our brain. Different regions are active for different tasks.",
                "category": "science",
                "image_url": "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800",
                "author_id": "system",
                "author_username": "FactsAreFoes",
                "upvotes": 67,
                "downvotes": 5,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_featured": True,
                "ai_explanation": None
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Carrots Improve Night Vision",
                "false_belief": "Eating carrots dramatically improves your night vision.",
                "truth": "This myth was British WWII propaganda to hide their radar technology. Carrots contain vitamin A but won't give you superhuman sight.",
                "category": "food",
                "image_url": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800",
                "author_id": "system",
                "author_username": "FactsAreFoes",
                "upvotes": 51,
                "downvotes": 3,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_featured": True,
                "ai_explanation": None
            }
        ]
        await db.facts.insert_many(sample_facts)
        print(f"Seeded {len(sample_facts)} facts.")
    else:
        print("Facts already exist.")

    # 2. Create Admin User
    admin_email = "theeonlyzoo1987@gmail.com"
    existing_user = await db.users.find_one({"email": admin_email})
    
    if not existing_user:
        hashed_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_doc = {
            "id": str(uuid.uuid4()),
            "username": "JoshuaJohnson",
            "email": admin_email,
            "password_hash": hashed_password,
            "avatar_url": f"https://api.dicebear.com/7.x/shapes/svg?seed=JoshuaJohnson",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "email_verified": True,
            "verification_token": None,
            "is_premium": True,
            "tier": "sovereign", # Grant full access
            "subscription_id": "system_granted"
        }
        await db.users.insert_one(user_doc)
        print(f"Created admin user: {admin_email} with password 'admin123'")
    else:
        # Update existing user to have sovereign access just in case
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"is_premium": True, "tier": "sovereign", "email_verified": True}}
        )
        print(f"Updated existing user {admin_email} to Sovereign tier.")

    client.close()

if __name__ == "__main__":
    asyncio.run(setup_db())
