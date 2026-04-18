from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
import secrets
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import feedparser
from bs4 import BeautifulSoup
import random

# Optional imports with fallbacks
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    resend = None

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging FIRST before any logging calls
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection - use environment variables with proper fallbacks for production
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    mongo_url = 'mongodb://localhost:27017'
    logger.warning("MONGO_URL not set, using localhost (development mode)")

db_name = os.environ.get('DB_NAME')
if not db_name:
    db_name = 'test_database'
    logger.warning("DB_NAME not set, using test_database")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    JWT_SECRET = 'facts-are-foes-secret-key-prod-2024-xyz123-fallback'
    logger.warning("JWT_SECRET not set, using fallback (not recommended for production)")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# Resend Email Config
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_AVAILABLE and RESEND_API_KEY and RESEND_API_KEY != 're_your_api_key_here':
    resend.api_key = RESEND_API_KEY

# Subscription Plans
SUBSCRIPTION_PLANS = {
    "premium_monthly": {
        "name": "Premium Monthly",
        "price": 9.00,
        "currency": "usd",
        "features": ["Unlimited AI explanations", "Ad-free experience", "Premium badge"],
        "tier": "standard"
    },
    "sovereign_monthly": {
        "name": "Sovereign Access",
        "price": 18.00,
        "currency": "usd",
        "features": ["Intel Portal Access", "Predictive Analytics", "Project: Thyself", "Frequency Cipher History"],
        "tier": "sovereign"
    }
}

app = FastAPI(title="Facts Are Foes API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

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
    tier: Optional[str] = "free"

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
    vote_type: str

class EngagementEvent(BaseModel):
    fact_id: str
    event_type: str
    value: Optional[str] = None

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class EmailVerificationRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class FoeResponseRequest(BaseModel):
    headline: str
    description: str
    source: str

class CipherSubmission(BaseModel):
    answers: List[str]
    fear_percentage: float
    intuition_percentage: float
    result_type: str

class LinkCreate(BaseModel):
    short_code: str
    target_url: str

class LinkResponse(BaseModel):
    id: str
    user_id: str
    short_code: str
    target_url: str
    clicks: int
    created_at: str

class NetworkEvent(BaseModel):
    id: str
    event_type: str
    message: str
    created_at: str

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

def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)

async def send_verification_email(email: str, token: str, origin_url: str):
    if not RESEND_AVAILABLE:
        logger.warning("Resend library not available, skipping email verification")
        return False
    
    if not RESEND_API_KEY or RESEND_API_KEY == 're_your_api_key_here':
        logger.warning("Resend API key not configured, skipping email verification")
        return False
    
    verification_url = f"{origin_url}/verify-email?token={token}"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #020204; color: #E2E8F0; padding: 40px;">
        <h1 style="color: #FFD700;">FACTS ARE FOES</h1>
        <h2 style="color: #FFFFFF;">Verify Your Email</h2>
        <p>Click the button below to verify your email.</p>
        <a href="{verification_url}" style="display: inline-block; background: #FFD700; color: #000000; padding: 15px 40px; text-decoration: none; font-weight: bold;">Verify Email</a>
    </div>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [email],
        "subject": "Verify Your Email - Facts Are Foes",
        "html": html_content
    }
    
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Verification email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        return False

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
async def register(user: UserCreate, request: Request):
    existing = await db.users.find_one({"$or": [{"email": user.email}, {"username": user.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already exists")
    
    verification_token = generate_verification_token()
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "avatar_url": f"https://api.dicebear.com/7.x/shapes/svg?seed={user.username}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "email_verified": False,
        "verification_token": verification_token,
        "is_premium": False,
        "tier": "free",
        "subscription_id": None
    }
    await db.users.insert_one(user_doc)
    
    origin = request.headers.get("origin", str(request.base_url).rstrip('/'))
    await send_verification_email(user.email, verification_token, origin)
    
    token = create_token(user_doc["id"], user_doc["email"])
    return {
        "token": token,
        "user": {
            "id": user_doc["id"],
            "username": user_doc["username"],
            "email": user_doc["email"],
            "avatar_url": user_doc["avatar_url"],
            "email_verified": user_doc["email_verified"],
            "is_premium": user_doc["is_premium"],
            "tier": user_doc["tier"]
        },
        "message": "Registration successful! Please check your email to verify your account."
    }

@api_router.post("/auth/verify-email")
async def verify_email(req: EmailVerificationRequest):
    user = await db.users.find_one({"verification_token": req.token}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    if user.get("email_verified"):
        return {"message": "Email already verified"}
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"email_verified": True, "verification_token": None}}
    )
    return {"message": "Email verified successfully!", "email": user["email"]}

@api_router.post("/auth/resend-verification")
async def resend_verification(req: ResendVerificationRequest, request: Request):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("email_verified"):
        return {"message": "Email already verified"}
    
    new_token = generate_verification_token()
    await db.users.update_one({"id": user["id"]}, {"$set": {"verification_token": new_token}})
    
    origin = request.headers.get("origin", str(request.base_url).rstrip('/'))
    sent = await send_verification_email(req.email, new_token, origin)
    
    if sent:
        return {"message": "Verification email sent!"}
    return {"message": "Email service not configured. Your account is active."}

@api_router.post("/auth/login", response_model=dict)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(db_user["id"], db_user["email"])
    return {
        "token": token,
        "user": {
            "id": db_user["id"],
            "username": db_user["username"],
            "email": db_user["email"],
            "avatar_url": db_user.get("avatar_url"),
            "email_verified": db_user.get("email_verified", False),
            "is_premium": db_user.get("is_premium", False),
            "tier": db_user.get("tier", "free")
        }
    }

@api_router.get("/auth/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "avatar_url": current_user.get("avatar_url"),
        "created_at": current_user["created_at"],
        "email_verified": current_user.get("email_verified", False),
        "is_premium": current_user.get("is_premium", False),
        "tier": current_user.get("tier", "free")
    }

# ============== INTEL ROUTES (NEW) ==============

@api_router.get("/intel/news")
async def get_intel_news():
    # Fetch real news from RSS feeds
    rss_feeds = [
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "http://rss.cnn.com/rss/edition.rss",
        "https://www.aljazeera.com/xml/rss/all.xml"
    ]
    
    articles = []
    
    try:
        # Pick a random feed to avoid overwhelming or getting duplicates
        feed_url = random.choice(rss_feeds)
        feed = await asyncio.to_thread(feedparser.parse, feed_url)
        
        for entry in feed.entries[:10]:
            # Clean up HTML description
            description = ""
            if 'summary' in entry:
                soup = BeautifulSoup(entry.summary, 'html.parser')
                description = soup.get_text()[:150] + "..."
            elif 'description' in entry:
                soup = BeautifulSoup(entry.description, 'html.parser')
                description = soup.get_text()[:150] + "..."
                
            articles.append({
                "title": entry.title,
                "description": description,
                "source": feed.feed.title if 'title' in feed.feed else "Mainstream Media",
                "url": entry.link,
                "publishedAt": entry.published if 'published' in entry else datetime.now().isoformat(),
                "category": "politics" # Defaulting for now
            })
            
    except Exception as e:
        logger.error(f"Failed to fetch RSS: {e}")
        # Fallback to mock data if RSS fails
        articles = [
            {
                "title": "Global Markets Rally Despite Economic Indicators",
                "description": "Stocks hit record highs as investors ignore warning signs from the bond market.",
                "source": "Financial Times",
                "url": "#",
                "category": "business"
            },
            {
                "title": "New AI Regulations Proposed by EU Commission",
                "description": "Lawmakers seek to curb the influence of generative algorithms on public opinion.",
                "source": "TechCrunch",
                "url": "#",
                "category": "technology"
            }
        ]

    return {"articles": articles}

@api_router.post("/intel/generate-foe-response")
async def generate_foe_response(req: FoeResponseRequest, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_premium") and current_user.get("tier") != "sovereign":
        # Free users get canned responses
        canned = [
            "Observe the emotional charge in this headline. Who benefits from your fear?",
            "Notice the binary choice presented here. Reality is rarely this black and white.",
            "This narrative is designed to bypass your logic and trigger your tribal instincts.",
            "Ask yourself: What is NOT being said in this report?"
        ]
        return {"foe_response": random.choice(canned)}

    if not EMERGENT_LLM_KEY:
        return {"foe_response": "System offline. Trust your intuition."}

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"foe-resp-{current_user['id']}-{uuid.uuid4()}",
            system_message="You are a narrative intelligence analyst. Your job is to decode mainstream news headlines and expose the underlying psychological manipulation or 'Backfire Effect'. Keep responses under 50 words. Be cryptic, insightful, and provocative."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""
        Analyze this mainstream headline:
        HEADLINE: {req.headline}
        DESCRIPTION: {req.description}
        SOURCE: {req.source}
        
        Generate a 'Counter-Narrative' or 'Foe Response'.
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {"foe_response": response}
    except Exception as e:
        logger.error(f"LLM Error: {e}")
        return {"foe_response": "Signal jammed. The narrative is too strong right now."}

@api_router.post("/intel/cipher-submit")
async def submit_cipher_result(submission: CipherSubmission, current_user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "answers": submission.answers,
        "fear_percentage": submission.fear_percentage,
        "intuition_percentage": submission.intuition_percentage,
        "result_type": submission.result_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cipher_results.insert_one(doc)
    return {"message": "Cipher result archived"}

@api_router.get("/intel/access")
async def check_intel_access(current_user: dict = Depends(get_current_user)):
    has_access = current_user.get("tier") == "sovereign" or current_user.get("is_admin", False)
    return {"has_access": has_access}

@api_router.get("/intel/anarchy-arithmetic")
async def get_anarchy_arithmetic():
    """
    Proprietary Anarchy Arithmetic Root Code algorithm.
    Simulates narrative destabilization vs. cognitive dissonance over a 24-hour period.
    """
    base_time = datetime.now() - timedelta(hours=24)
    data = []
    stability = 80
    dissonance = 20
    
    for i in range(24):
        # Introduce chaotic mathematical variance (Anarchy Arithmetic)
        chaos_factor = random.uniform(-15.0, 15.0)
        stability = max(10, min(95, stability + chaos_factor * 0.8))
        dissonance = max(5, min(90, dissonance - chaos_factor + random.uniform(0, 10)))
        
        data.append({
            "time": (base_time + timedelta(hours=i)).strftime("%H:00"),
            "narrative_stability": round(stability, 1),
            "cognitive_dissonance": round(dissonance, 1),
            "anarchy_index": round(abs(stability - dissonance) * random.uniform(0.8, 1.2), 1)
        })
@api_router.get("/intel/frequency-cipher")
async def get_frequency_cipher():
    """
    Simulates the collective 'Fear vs Intuition' resonance.
    """
    base_time = datetime.now() - timedelta(days=7)
    data = []
    fear = 50
    intuition = 50
    
    for i in range(7):
        fear = max(20, min(90, fear + random.uniform(-10.0, 15.0)))
        intuition = max(20, min(90, intuition + random.uniform(-5.0, 10.0)))
        
        data.append({
            "day": (base_time + timedelta(days=i)).strftime("%a"),
            "fear_hz": round(fear, 1),
            "intuition_hz": round(intuition, 1)
        })
        
    return {"data": data}

@api_router.get("/intel/invisible-hand")
async def get_invisible_hand():
    """
    Simulates the flow of hidden influence (Narrative Control, Truth Signal, Fear Index)
    over the last 12 months.
    """
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    data = []
    
    for month in months:
        # Simulate a major event in Aug/Oct
        if month in ['Aug', 'Oct', 'Nov']:
            narrative = random.randint(60, 90)
            fear = random.randint(60, 85)
            truth = random.randint(10, 30)
        else:
            narrative = random.randint(20, 50)
            fear = random.randint(20, 45)
            truth = random.randint(30, 60)
            
        data.append({
            "name": month,
            "narrative": narrative,
            "truth": truth,
            "fear": fear
        })
        
    return {"data": data}

@api_router.get("/intel/project-thyself")
async def get_project_thyself(current_user: dict = Depends(get_current_user)):
    """
    Returns the user's Cognitive Alchemy stats for a Radar Chart.
    """
    # If free tier, return low stats to show they need to upgrade
    if not current_user.get("is_premium") and current_user.get("tier") != "sovereign":
        data = [
            {"subject": "Awareness", "A": 30, "fullMark": 100},
            {"subject": "Detachment", "A": 20, "fullMark": 100},
            {"subject": "Synthesis", "A": 15, "fullMark": 100},
            {"subject": "Projection", "A": 10, "fullMark": 100},
            {"subject": "Sovereignty", "A": 5, "fullMark": 100}
        ]
    else:
        # If sovereign, return higher (or dynamically generated) stats
        data = [
            {"subject": "Awareness", "A": random.randint(70, 95), "fullMark": 100},
            {"subject": "Detachment", "A": random.randint(65, 90), "fullMark": 100},
            {"subject": "Synthesis", "A": random.randint(60, 85), "fullMark": 100},
            {"subject": "Projection", "A": random.randint(50, 80), "fullMark": 100},
            {"subject": "Sovereignty", "A": random.randint(45, 75), "fullMark": 100}
        ]
        
    return {"data": data}

        
    return {"data": data}

@api_router.get("/intel/content")
async def get_intel_content(current_user: dict = Depends(get_current_user)):
    # Gated content endpoint
    has_access = current_user.get("tier") == "sovereign" or current_user.get("is_admin", False)
    
    if not has_access:
        return {"content": []}
        
    content = [
        {"id": "1", "title": "The 5th Dimension Strategy", "type": "Video", "description": "Transcending the left-right paradigm."},
        {"id": "2", "title": "Narrative Kill-Switch", "type": "PDF", "description": "How to stop a viral lie in its tracks."},
        {"id": "3", "title": "Project: Thyself - Full Archive", "type": "Course", "description": "All 5 Alchemical Formulas unlocked."}
    ]
    return {"content": content}

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
    
    # Broadcast to Network
    await db.network_events.insert_one({
        "id": str(uuid.uuid4()),
        "event_type": "fact_submitted",
        "message": f"Akashic Update: New Truth archived in {fact.category}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
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
            await db.votes.delete_one({"fact_id": fact_id, "user_id": current_user["id"]})
            if vote.vote_type == "up":
                await db.facts.update_one({"id": fact_id}, {"$inc": {"upvotes": -1}})
            else:
                await db.facts.update_one({"id": fact_id}, {"$inc": {"downvotes": -1}})
            return {"message": "Vote removed"}
        else:
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
            system_message="You are an expert fact-checker. Provide concise explanations about why certain beliefs turned out to be wrong. Keep responses under 200 words."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        prompt = f"""Explain why this common belief turned out to be false:

FALSE BELIEF: {fact['false_belief']}

THE TRUTH: {fact['truth']}

Provide a brief explanation of how this misconception originated and why the truth matters."""
        
        user_message = UserMessage(text=prompt)
        explanation = await chat.send_message(user_message)
        
        await db.facts.update_one({"id": fact_id}, {"$set": {"ai_explanation": explanation}})
        return {"explanation": explanation}
    except Exception as e:
        logger.error(f"AI explanation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate explanation")

# ============== ENGAGEMENT ROUTES ==============

@api_router.post("/engagement")
async def track_engagement(event: EngagementEvent):
    engagement_doc = {
        "id": str(uuid.uuid4()),
        "fact_id": event.fact_id,
        "event_type": event.event_type,
        "value": event.value,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.engagement.insert_one(engagement_doc)
    
    if event.event_type == "view":
        await db.facts.update_one({"id": event.fact_id}, {"$inc": {"views": 1}})
    elif event.event_type == "share":
        await db.facts.update_one({"id": event.fact_id}, {"$inc": {"shares": 1}})
    
    return {"message": "Engagement tracked"}

@api_router.get("/facts/{fact_id}/engagement")
async def get_fact_engagement(fact_id: str):
    views = await db.engagement.count_documents({"fact_id": fact_id, "event_type": "view"})
    shares = await db.engagement.count_documents({"fact_id": fact_id, "event_type": "share"})
    share_breakdown = await db.engagement.aggregate([
        {"$match": {"fact_id": fact_id, "event_type": "share"}},
        {"$group": {"_id": "$value", "count": {"$sum": 1}}}
    ]).to_list(100)
    return {"views": views, "shares": shares, "share_breakdown": {s["_id"]: s["count"] for s in share_breakdown if s["_id"]}}

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

# ============== STRIPE SUBSCRIPTION ROUTES ==============

@api_router.get("/subscription/plans")
async def get_subscription_plans():
    return {"plans": SUBSCRIPTION_PLANS}

@api_router.post("/subscription/create-checkout")
async def create_checkout_session(req: CheckoutRequest, current_user: dict = Depends(get_current_user)):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    plan = SUBSCRIPTION_PLANS.get(req.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan ID")
    
    try:
        checkout = StripeCheckout(api_key=STRIPE_API_KEY)
        
        checkout_request = CheckoutSessionRequest(
            product_name=plan["name"],
            unit_amount=int(plan["price"] * 100),
            currency=plan["currency"],
            quantity=1,
            mode="subscription",
            success_url=f"{req.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{req.origin_url}/subscription/cancel"
        )
        
        response: CheckoutSessionResponse = await checkout.create_checkout_session(checkout_request)
        
        await db.subscriptions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "session_id": response.session_id,
            "plan_id": req.plan_id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {"checkout_url": response.checkout_url, "session_id": response.session_id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

@api_router.get("/subscription/status/{session_id}")
async def get_subscription_status(session_id: str, current_user: dict = Depends(get_current_user)):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    try:
        checkout = StripeCheckout(api_key=STRIPE_API_KEY)
        status: CheckoutStatusResponse = await checkout.get_checkout_status(session_id)
        
        if status.payment_status == "paid":
            # Determine tier based on the subscription in DB
            subscription = await db.subscriptions.find_one({"session_id": session_id})
            tier = "premium" # Default
            if subscription and subscription.get("plan_id") == "sovereign_monthly":
                tier = "sovereign"
            elif subscription and subscription.get("plan_id") == "premium_monthly":
                tier = "standard"

            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {
                    "is_premium": True,
                    "tier": tier,
                    "subscription_id": status.subscription_id,
                    "subscription_updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            await db.subscriptions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "active", "subscription_id": status.subscription_id}}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "subscription_id": status.subscription_id
        }
    except Exception as e:
        logger.error(f"Stripe status check error: {e}")
        raise HTTPException(status_code=500, detail="Failed to check subscription status")

@api_router.get("/subscription/my-subscription")
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    subscription = await db.subscriptions.find_one(
        {"user_id": current_user["id"], "status": "active"},
        {"_id": 0}
    )
    return {
        "is_premium": current_user.get("is_premium", False),
        "tier": current_user.get("tier", "free"),
        "subscription": subscription,
        "email_verified": current_user.get("email_verified", False)
    }

# ============== ADMIN ROUTES ==============

ADMIN_EMAILS = ["admin@factsarefoes.com"]

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    first_user = await db.users.find_one({}, {"_id": 0}, sort=[("created_at", 1)])
    if user["email"] in ADMIN_EMAILS or (first_user and user["id"] == first_user["id"]):
        user["is_admin"] = True # Flag for frontend
        return user
# ============== NETWORK EVENTS ROUTES ==============

@api_router.get("/network/events")
async def get_network_events(since: Optional[str] = None):
    query = {}
    if since:
        query["created_at"] = {"$gt": since}
    events = await db.network_events.find(query, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    return {"events": events}

# ============== SOVEREIGN LINKS ROUTES ==============

@api_router.post("/links", response_model=LinkResponse)
async def create_link(link: LinkCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("tier") != "sovereign" and not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Sovereign tier required")
    
    existing = await db.sovereign_links.find_one({"short_code": link.short_code})
    if existing:
        raise HTTPException(status_code=400, detail="Short code already exists")
    
    link_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "short_code": link.short_code,
        "target_url": link.target_url,
        "clicks": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sovereign_links.insert_one(link_doc)
    return LinkResponse(**link_doc)

@api_router.get("/links/my-links", response_model=List[LinkResponse])
async def get_my_links(current_user: dict = Depends(get_current_user)):
    links = await db.sovereign_links.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [LinkResponse(**l) for l in links]

@api_router.get("/s/{short_code}")
async def resolve_link(short_code: str):
    link = await db.sovereign_links.find_one({"short_code": short_code}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    await db.sovereign_links.update_one({"short_code": short_code}, {"$inc": {"clicks": 1}})
    return {"target_url": link["target_url"]}

@api_router.delete("/links/{link_id}")
async def delete_link(link_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.sovereign_links.delete_one({"id": link_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Link not found or unauthorized")
    return {"message": "Link deleted"}

    raise HTTPException(status_code=403, detail="Admin access required")

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_facts = await db.facts.count_documents({})
    total_votes = await db.votes.count_documents({})
    total_views = await db.engagement.count_documents({"event_type": "view"})
    total_shares = await db.engagement.count_documents({"event_type": "share"})
    
    category_stats = await db.facts.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]).to_list(100)
    
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_facts = await db.facts.count_documents({"created_at": {"$gte": week_ago}})
    recent_users = await db.users.count_documents({"created_at": {"$gte": week_ago}})
    
    top_facts = await db.facts.find({}, {"_id": 0}).sort("upvotes", -1).limit(5).to_list(5)
    
    return {
        "total_users": total_users,
        "total_facts": total_facts,
        "total_votes": total_votes,
        "total_views": total_views,
        "total_shares": total_shares,
        "category_stats": {c["_id"]: c["count"] for c in category_stats if c["_id"]},
        "recent_facts": recent_facts,
        "recent_users": recent_users,
        "top_facts": top_facts
    }

@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(get_admin_user), limit: int = 50, skip: int = 0):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    return {"users": users, "total": total}

@api_router.get("/admin/facts")
async def get_all_facts_admin(admin: dict = Depends(get_admin_user), limit: int = 50, skip: int = 0, status: Optional[str] = None):
    query = {}
    if status == "featured":
        query["is_featured"] = True
    elif status == "pending":
        query["is_featured"] = False
    
    facts = await db.facts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.facts.count_documents(query)
    return {"facts": facts, "total": total}

@api_router.put("/admin/facts/{fact_id}/feature")
async def toggle_feature_fact(fact_id: str, admin: dict = Depends(get_admin_user)):
    fact = await db.facts.find_one({"id": fact_id})
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    
    new_status = not fact.get("is_featured", False)
    await db.facts.update_one({"id": fact_id}, {"$set": {"is_featured": new_status}})
    return {"message": f"Fact {'featured' if new_status else 'unfeatured'}", "is_featured": new_status}

@api_router.delete("/admin/facts/{fact_id}")
async def admin_delete_fact(fact_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.facts.delete_one({"id": fact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fact not found")
    await db.votes.delete_many({"fact_id": fact_id})
    await db.engagement.delete_many({"fact_id": fact_id})
    return {"message": "Fact deleted"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.facts.delete_many({"author_id": user_id})
    await db.votes.delete_many({"user_id": user_id})
    return {"message": "User and their content deleted"}

@api_router.get("/admin/engagement/timeline")
async def get_engagement_timeline(admin: dict = Depends(get_admin_user), days: int = 7):
    timeline = []
    for i in range(days):
        date = datetime.now(timezone.utc) - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        start = f"{date_str}T00:00:00"
        end = f"{date_str}T23:59:59"
        
        views = await db.engagement.count_documents({
            "event_type": "view",
            "created_at": {"$gte": start, "$lte": end}
        })
        shares = await db.engagement.count_documents({
            "event_type": "share",
            "created_at": {"$gte": start, "$lte": end}
        })
        new_facts = await db.facts.count_documents({
            "created_at": {"$gte": start, "$lte": end}
        })
        
        timeline.append({
            "date": date_str,
            "views": views,
            "shares": shares,
            "new_facts": new_facts
        })
    
    return {"timeline": list(reversed(timeline))}

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
