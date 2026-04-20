from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from database import get_db
from models.schemas import LinkCreate, LinkResponse, FactResponse
from utils.security import get_current_user

router = APIRouter(tags=["misc"])

@router.post("/links", response_model=LinkResponse)
async def create_link(link: LinkCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
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

@router.get("/links/my-links", response_model=List[LinkResponse])
async def get_my_links(current_user: dict = Depends(get_current_user)):
    db = get_db()
    links = await db.sovereign_links.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [LinkResponse(**l) for l in links]

@router.get("/s/{short_code}")
async def resolve_link(short_code: str):
    db = get_db()
    link = await db.sovereign_links.find_one({"short_code": short_code}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    await db.sovereign_links.update_one({"short_code": short_code}, {"$inc": {"clicks": 1}})
    return {"target_url": link["target_url"]}

@router.delete("/links/{link_id}")
async def delete_link(link_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.sovereign_links.delete_one({"id": link_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Link not found or unauthorized")
    return {"message": "Link deleted"}

@router.get("/network/events")
async def get_network_events(since: Optional[str] = None):
    db = get_db()
    query = {}
    if since:
        query["created_at"] = {"$gt": since}
    events = await db.network_events.find(query, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    return {"events": events}

@router.get("/users/{user_id}/facts", response_model=List[FactResponse])
async def get_user_facts(user_id: str):
    db = get_db()
    facts = await db.facts.find({"author_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [FactResponse(**f) for f in facts]

@router.get("/users/{user_id}/stats")
async def get_user_stats(user_id: str):
    db = get_db()
    total_facts = await db.facts.count_documents({"author_id": user_id})
    user_facts = await db.facts.find({"author_id": user_id}, {"_id": 0, "upvotes": 1, "downvotes": 1}).to_list(1000)
    total_upvotes = sum(f.get("upvotes", 0) for f in user_facts)
    total_downvotes = sum(f.get("downvotes", 0) for f in user_facts)
    return {"total_facts": total_facts, "total_upvotes": total_upvotes, "total_downvotes": total_downvotes}

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

@router.get("/categories")
async def get_categories():
    return CATEGORIES
