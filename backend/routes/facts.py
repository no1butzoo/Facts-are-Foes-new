from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import logging
from database import get_db
from models.schemas import FactResponse, FactCreate, FactUpdate, VoteCreate, EngagementEvent
from utils.security import get_current_user
from config import EMERGENT_LLM_KEY
from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter(tags=["facts"])
logger = logging.getLogger(__name__)

@router.get("/facts", response_model=List[FactResponse])
async def get_facts(category: Optional[str] = None, featured: Optional[bool] = None, search: Optional[str] = None, limit: int = 50):
    db = get_db()
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

@router.get("/facts/{fact_id}", response_model=FactResponse)
async def get_fact(fact_id: str):
    db = get_db()
    fact = await db.facts.find_one({"id": fact_id}, {"_id": 0})
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    return FactResponse(**fact)

@router.post("/facts", response_model=FactResponse)
async def create_fact(fact: FactCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
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
    await db.network_events.insert_one({
        "id": str(uuid.uuid4()),
        "event_type": "fact_submitted",
        "message": f"Akashic Update: New Truth archived in {fact.category}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return FactResponse(**fact_doc)

@router.put("/facts/{fact_id}", response_model=FactResponse)
async def update_fact(fact_id: str, fact: FactUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
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

@router.delete("/facts/{fact_id}")
async def delete_fact(fact_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.facts.find_one({"id": fact_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Fact not found")
    if existing["author_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this fact")
    
    await db.facts.delete_one({"id": fact_id})
    await db.votes.delete_many({"fact_id": fact_id})
    return {"message": "Fact deleted"}

@router.post("/facts/{fact_id}/vote")
async def vote_fact(fact_id: str, vote: VoteCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
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

@router.get("/facts/{fact_id}/vote")
async def get_user_vote(fact_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    vote = await db.votes.find_one({"fact_id": fact_id, "user_id": current_user["id"]}, {"_id": 0})
    return {"vote_type": vote["vote_type"] if vote else None}

@router.post("/facts/{fact_id}/explain")
async def generate_ai_explanation(fact_id: str):
    db = get_db()
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
        prompt = f"Explain why this common belief turned out to be false:\n\nFALSE BELIEF: {fact['false_belief']}\n\nTHE TRUTH: {fact['truth']}\n\nProvide a brief explanation of how this misconception originated and why the truth matters."
        user_message = UserMessage(text=prompt)
        explanation = await chat.send_message(user_message)
        await db.facts.update_one({"id": fact_id}, {"$set": {"ai_explanation": explanation}})
        return {"explanation": explanation}
    except Exception as e:
        logger.error(f"AI explanation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate explanation")

@router.post("/engagement")
async def track_engagement(event: EngagementEvent):
    db = get_db()
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

@router.get("/facts/{fact_id}/engagement")
async def get_fact_engagement(fact_id: str):
    db = get_db()
    views = await db.engagement.count_documents({"fact_id": fact_id, "event_type": "view"})
    shares = await db.engagement.count_documents({"fact_id": fact_id, "event_type": "share"})
    share_breakdown = await db.engagement.aggregate([
        {"$match": {"fact_id": fact_id, "event_type": "share"}},
        {"$group": {"_id": "$value", "count": {"$sum": 1}}}
    ]).to_list(100)
    return {"views": views, "shares": shares, "share_breakdown": {s["_id"]: s["count"] for s in share_breakdown if s["_id"]}}
