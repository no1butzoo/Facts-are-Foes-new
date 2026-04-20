import logging
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URL, DB_NAME

logger = logging.getLogger(__name__)

client = None
db = None

def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    logger.info(f"Connected to MongoDB at {MONGO_URL} using DB {DB_NAME}")

def close_db():
    if client:
        client.close()
        logger.info("MongoDB connection closed")

def get_db():
    return db
