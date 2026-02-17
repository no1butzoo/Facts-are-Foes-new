from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'facts-are-foes-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="Facts Are Foes API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    avatar_url: Optional[str] = None
    created_at: str

class FactCreate(BaseModel):
    title: str
    false_belief: str
    truth: str
    category: str
    source_url: Optional[str] = None
    image_url: Optional[str] = None

class FactUpdate(BaseModel):
    title: Optional[str] = None
    false_belief: Optional[str] = None
    truth: Optional[str] = None
    category: Optional[str] = None
    source_url: Optional[str] = None
    image_url: Optional[str] = None

class FactResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    false_belief: str
    truth: str
    category: str
    ai_explanation: Optional[str] = None
    source_url: Optional[str] = None
    image_url: Optional[str] = None
    author_id: str
    author_username: str
    upvotes: int = 0
    downvotes: int = 0
    created_at: str
    is_featured: bool = False

class VoteCreate(BaseModel):
    vote_type: str  # "up" or "down"

class AIExplainRequest(BaseModel):
    fact_id: str

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    existing = await db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "avatar_url": f"https://api.dicebear.com/7.x/shapes/svg?seed={user.username}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"], user_doc["email"])
    return {"token": token, "user": {"id": user_doc["id"], "username": user_doc["username"], "email": user_doc["email"], "avatar_url": user_doc["avatar_url"]}}

@api_router.post("/auth/login", response_model=dict)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(db_user["id"], db_user["email"])
    return {"token": token, "user": {"id": db_user["id"], "username": db_user["username"], "email": db_user["email"], "avatar_url": db_user.get("avatar_url")}}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        avatar_url=current_user.get("avatar_url"),
        created_at=current_user["created_at"]
    )

# ============== FACTS ROUTES ==============

@api_router.get("/facts", response_model=List[FactResponse])
async def get_facts(category: Optional[str] = None, featured: Optional[bool] = None, search: Optional[str] = None, limit: int = 50):
    query = {}
    if category and category != "all":
        query["category"] = category
    if featured is not None:
        query["is_featured"] = featured
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"false_belief": {"$regex": search, "$options": "i"}},
            {"truth": {"$regex": search, "$options": "i"}}
        ]
    
    facts = await db.facts.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [FactResponse(**f) for f in facts]

@api_router.get("/facts/{fact_id}", response_model=FactResponse)
async def get_fact(fact_id: str):
    fact = await db.facts.find_one({"id": fact_id}, {"_id": 0})
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    return FactResponse(**fact)

@api_router.post("/facts", response_model=FactResponse)
async def create_fact(fact: FactCreate, current_user: dict = Depends(get_current_user)):
    fact_doc = {
        "id": str(uuid.uuid4()),
        "title": fact.title,
        "false_belief": fact.false_belief,
        "truth": fact.truth,
        "category": fact.category,
        "source_url": fact.source_url,
        "image_url": fact.image_url,
        "ai_explanation": None,
        "author_id": current_user["id"],
        "author_username": current_user["username"],
        "upvotes": 0,
        "downvotes": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_featured": False
    }
    await db.facts.insert_one(fact_doc)
    return FactResponse(**fact_doc)

@api_router.put("/facts/{fact_id}", response_model=FactResponse)
async def update_fact(fact_id: str, fact: FactUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.facts.find_one({"id": fact_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Fact not found")
    if existing["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this fact")
    
    update_data = {k: v for k, v in fact.model_dump().items() if v is not None}
    if update_data:
        await db.facts.update_one({"id": fact_id}, {"$set": update_data})
    
    updated = await db.facts.find_one({"id": fact_id}, {"_id": 0})
    return FactResponse(**updated)

@api_router.delete("/facts/{fact_id}")
async def delete_fact(fact_id: str, current_user: dict = Depends(get_current_user)):
    existing = await db.facts.find_one({"id": fact_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Fact not found")
    if existing["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this fact")
    
    await db.facts.delete_one({"id": fact_id})
    await db.votes.delete_many({"fact_id": fact_id})
    return {"message": "Fact deleted"}

# ============== VOTING ROUTES ==============

@api_router.post("/facts/{fact_id}/vote")
async def vote_fact(fact_id: str, vote: VoteCreate, current_user: dict = Depends(get_current_user)):
    fact = await db.facts.find_one({"id": fact_id})
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    
    existing_vote = await db.votes.find_one({"fact_id": fact_id, "user_id": current_user["id"]})
    
    if existing_vote:
        if existing_vote["vote_type"] == vote.vote_type:
            # Remove vote
            await db.votes.delete_one({"fact_id": fact_id, "user_id": current_user["id"]})
            if vote.vote_type == "up":
                await db.facts.update_one({"id": fact_id}, {"$inc": {"upvotes": -1}})
            else:
                await db.facts.update_one({"id": fact_id}, {"$inc": {"downvotes": -1}})
            return {"message": "Vote removed"}
        else:
            # Change vote
            await db.votes.update_one(
                {"fact_id": fact_id, "user_id": current_user["id"]},
                {"$set": {"vote_type": vote.vote_type}}
            )
            if vote.vote_type == "up":
                await db.facts.update_one({"id": fact_id}, {"$inc": {"upvotes": 1, "downvotes": -1}})
            else:
                await db.facts.update_one({"id": fact_id}, {"$inc": {"upvotes": -1, "downvotes": 1}})
            return {"message": "Vote changed"}
    else:
        # New vote
        await db.votes.insert_one({
            "id": str(uuid.uuid4()),
            "fact_id": fact_id,
            "user_id": current_user["id"],
            "vote_type": vote.vote_type,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        if vote.vote_type == "up":
            await db.facts.update_one({"id": fact_id}, {"$inc": {"upvotes": 1}})
        else:
            await db.facts.update_one({"id": fact_id}, {"$inc": {"downvotes": 1}})
        return {"message": "Vote added"}

@api_router.get("/facts/{fact_id}/vote")
async def get_user_vote(fact_id: str, current_user: dict = Depends(get_current_user)):
    vote = await db.votes.find_one({"fact_id": fact_id, "user_id": current_user["id"]}, {"_id": 0})
    return {"vote_type": vote["vote_type"] if vote else None}

# ============== AI ROUTES ==============

@api_router.post("/facts/{fact_id}/explain")
async def generate_ai_explanation(fact_id: str):
    fact = await db.facts.find_one({"id": fact_id}, {"_id": 0})
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"fact-explain-{fact_id}",
            system_message="You are an expert fact-checker and historian. Provide concise, engaging explanations about why certain beliefs turned out to be wrong. Keep responses under 200 words. Be informative yet entertaining."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Explain why this common belief turned out to be false:

FALSE BELIEF: {fact['false_belief']}

THE TRUTH: {fact['truth']}

Provide a brief, engaging explanation of how this misconception originated and why the truth matters."""
        
        user_message = UserMessage(text=prompt)
        explanation = await chat.send_message(user_message)
        
        await db.facts.update_one({"id": fact_id}, {"$set": {"ai_explanation": explanation}})
        
        return {"explanation": explanation}
    except Exception as e:
        logger.error(f"AI explanation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate explanation")

# ============== USER ROUTES ==============

@api_router.get("/users/{user_id}/facts", response_model=List[FactResponse])
async def get_user_facts(user_id: str):
    facts = await db.facts.find({"author_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [FactResponse(**f) for f in facts]

@api_router.get("/users/{user_id}/stats")
async def get_user_stats(user_id: str):
    total_facts = await db.facts.count_documents({"author_id": user_id})
    user_facts = await db.facts.find({"author_id": user_id}, {"_id": 0, "upvotes": 1, "downvotes": 1}).to_list(1000)
    total_upvotes = sum(f.get("upvotes", 0) for f in user_facts)
    total_downvotes = sum(f.get("downvotes", 0) for f in user_facts)
    return {"total_facts": total_facts, "total_upvotes": total_upvotes, "total_downvotes": total_downvotes}

# ============== CATEGORIES ==============

CATEGORIES = [
    {"id": "science", "name": "Science", "icon": "Atom", "description": "Scientific myths debunked"},
    {"id": "history", "name": "History", "icon": "Landmark", "description": "Historical misconceptions"},
    {"id": "health", "name": "Health", "icon": "Heart", "description": "Health myths exposed"},
    {"id": "nature", "name": "Nature", "icon": "Leaf", "description": "Nature facts revealed"},
    {"id": "space", "name": "Space", "icon": "Rocket", "description": "Cosmic misconceptions"},
    {"id": "food", "name": "Food", "icon": "UtensilsCrossed", "description": "Food myths busted"},
    {"id": "technology", "name": "Technology", "icon": "Cpu", "description": "Tech myths debunked"},
    {"id": "psychology", "name": "Psychology", "icon": "Brain", "description": "Mind myths revealed"}
]

@api_router.get("/categories")
async def get_categories():
    return CATEGORIES

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_data():
    existing = await db.facts.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "count": existing}
    
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
            "truth": "Napoleon was actually 5'7\" (170cm), above average height for his era. The myth came from British propaganda and confusion between French and English inches.",
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
            "truth": "Goldfish can actually remember things for months. Scientists have trained them to navigate mazes and respond to signals.",
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
            "title": "Vikings and Horned Helmets",
            "false_belief": "Vikings wore horned helmets in battle.",
            "truth": "There's no historical evidence Vikings wore horned helmets. This myth was popularized by 19th-century romanticized artwork.",
            "category": "history",
            "image_url": "https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=800",
            "author_id": "system",
            "author_username": "FactsAreFoes",
            "upvotes": 29,
            "downvotes": 1,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_featured": False,
            "ai_explanation": None
        },
        {
            "id": str(uuid.uuid4()),
            "title": "We Only Use 10% of Our Brain",
            "false_belief": "Humans only use 10% of their brain capacity.",
            "truth": "Brain scans show we use virtually every part of our brain. Different regions are active for different tasks, but no area is completely inactive.",
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
            "title": "Sugar Makes Kids Hyper",
            "false_belief": "Sugar causes hyperactivity in children.",
            "truth": "Multiple studies have found no link between sugar and hyperactivity. The excitement of events where sugar is present (parties, holidays) is the real culprit.",
            "category": "health",
            "image_url": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800",
            "author_id": "system",
            "author_username": "FactsAreFoes",
            "upvotes": 45,
            "downvotes": 8,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_featured": False,
            "ai_explanation": None
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Lightning Never Strikes Twice",
            "false_belief": "Lightning never strikes the same place twice.",
            "truth": "Lightning frequently strikes the same location multiple times. The Empire State Building is struck about 20-25 times per year.",
            "category": "nature",
            "image_url": "https://images.unsplash.com/photo-1461511540115-9d391d05e728?w=800",
            "author_id": "system",
            "author_username": "FactsAreFoes",
            "upvotes": 33,
            "downvotes": 2,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_featured": False,
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
    return {"message": "Data seeded successfully", "count": len(sample_facts)}

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Facts Are Foes API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
