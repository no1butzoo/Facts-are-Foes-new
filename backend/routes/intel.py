from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid
import random
from datetime import datetime, timezone, timedelta
import asyncio
import feedparser
from bs4 import BeautifulSoup
import logging
from database import get_db
from models.schemas import FoeResponseRequest, CipherSubmission
from utils.security import get_current_user
from config import EMERGENT_LLM_KEY
from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter(prefix="/intel", tags=["intel"])
logger = logging.getLogger(__name__)

@router.get("/news")
async def get_intel_news():
    rss_feeds = [
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "http://rss.cnn.com/rss/edition.rss",
        "https://www.aljazeera.com/xml/rss/all.xml"
    ]
    articles = []
    try:
        feed_url = random.choice(rss_feeds)
        feed = await asyncio.to_thread(feedparser.parse, feed_url)
        for entry in feed.entries[:10]:
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
                "category": "politics"
            })
    except Exception as e:
        logger.error(f"Failed to fetch RSS: {e}")
        articles = [
            {
                "title": "Global Markets Rally Despite Economic Indicators",
                "description": "Stocks hit record highs as investors ignore warning signs from the bond market.",
                "source": "Financial Times",
                "url": "#",
                "category": "business"
            }
        ]
    return {"articles": articles}

@router.post("/generate-foe-response")
async def generate_foe_response(req: FoeResponseRequest, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_premium") and current_user.get("tier") != "sovereign":
        canned = ["Observe the emotional charge in this headline. Who benefits from your fear?"]
        return {"foe_response": random.choice(canned)}
    if not EMERGENT_LLM_KEY:
        return {"foe_response": "System offline. Trust your intuition."}
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"foe-resp-{current_user['id']}-{uuid.uuid4()}",
            system_message="You are a narrative intelligence analyst. Decode mainstream news headlines. Keep responses under 50 words. Be cryptic, insightful, and provocative."
        ).with_model("gemini", "gemini-3-flash-preview")
        prompt = f"Analyze this mainstream headline:\nHEADLINE: {req.headline}\nDESCRIPTION: {req.description}\nSOURCE: {req.source}\nGenerate a 'Counter-Narrative' or 'Foe Response'."
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return {"foe_response": response}
    except Exception as e:
        logger.error(f"LLM Error: {e}")
        return {"foe_response": "Signal jammed. The narrative is too strong right now."}

@router.post("/cipher-submit")
async def submit_cipher_result(submission: CipherSubmission, current_user: dict = Depends(get_current_user)):
    db = get_db()
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

@router.get("/access")
async def check_intel_access(current_user: dict = Depends(get_current_user)):
    has_access = current_user.get("tier") == "sovereign" or current_user.get("is_admin", False)
    return {"has_access": has_access}

@router.get("/content")
async def get_intel_content(current_user: dict = Depends(get_current_user)):
    has_access = current_user.get("tier") == "sovereign" or current_user.get("is_admin", False)
    if not has_access:
        return {"content": []}
    content = [
        {"id": "1", "title": "The 5th Dimension Strategy", "type": "Video", "description": "Transcending the left-right paradigm."},
        {"id": "2", "title": "Narrative Kill-Switch", "type": "PDF", "description": "How to stop a viral lie in its tracks."},
        {"id": "3", "title": "Project: Thyself - Full Archive", "type": "Course", "description": "All 5 Alchemical Formulas unlocked."}
    ]
    return {"content": content}

@router.get("/anarchy-arithmetic")
async def get_anarchy_arithmetic():
    base_time = datetime.now() - timedelta(hours=24)
    data = []
    stability = 80
    dissonance = 20
    for i in range(24):
        chaos_factor = random.uniform(-15.0, 15.0)
        stability = max(10, min(95, stability + chaos_factor * 0.8))
        dissonance = max(5, min(90, dissonance - chaos_factor + random.uniform(0, 10)))
        data.append({
            "time": (base_time + timedelta(hours=i)).strftime("%H:00"),
            "narrative_stability": round(stability, 1),
            "cognitive_dissonance": round(dissonance, 1),
            "anarchy_index": round(abs(stability - dissonance) * random.uniform(0.8, 1.2), 1)
        })
    return {"data": data}

@router.get("/frequency-cipher")
async def get_frequency_cipher():
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

@router.get("/invisible-hand")
async def get_invisible_hand():
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    data = []
    for month in months:
        if month in ['Aug', 'Oct', 'Nov']:
            narrative, fear, truth = random.randint(60, 90), random.randint(60, 85), random.randint(10, 30)
        else:
            narrative, fear, truth = random.randint(20, 50), random.randint(20, 45), random.randint(30, 60)
        data.append({"name": month, "narrative": narrative, "truth": truth, "fear": fear})
    return {"data": data}

@router.get("/project-thyself")
async def get_project_thyself(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_premium") and current_user.get("tier") != "sovereign":
        data = [
            {"subject": "Awareness", "A": 30, "fullMark": 100},
            {"subject": "Detachment", "A": 20, "fullMark": 100},
            {"subject": "Synthesis", "A": 15, "fullMark": 100},
            {"subject": "Projection", "A": 10, "fullMark": 100},
            {"subject": "Sovereignty", "A": 5, "fullMark": 100}
        ]
    else:
        data = [
            {"subject": "Awareness", "A": random.randint(70, 95), "fullMark": 100},
            {"subject": "Detachment", "A": random.randint(65, 90), "fullMark": 100},
            {"subject": "Synthesis", "A": random.randint(60, 85), "fullMark": 100},
            {"subject": "Projection", "A": random.randint(50, 80), "fullMark": 100},
            {"subject": "Sovereignty", "A": random.randint(45, 75), "fullMark": 100}
        ]
    return {"data": data}
