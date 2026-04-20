from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from database import get_db
from utils.security import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    db = get_db()
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

@router.get("/users")
async def get_all_users(admin: dict = Depends(get_admin_user), limit: int = 50, skip: int = 0):
    db = get_db()
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    return {"users": users, "total": total}

@router.get("/facts")
async def get_all_facts_admin(admin: dict = Depends(get_admin_user), limit: int = 50, skip: int = 0, status: Optional[str] = None):
    db = get_db()
    query = {}
    if status == "featured":
        query["is_featured"] = True
    elif status == "pending":
        query["is_featured"] = False
    facts = await db.facts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.facts.count_documents(query)
    return {"facts": facts, "total": total}

@router.put("/facts/{fact_id}/feature")
async def toggle_feature_fact(fact_id: str, admin: dict = Depends(get_admin_user)):
    db = get_db()
    fact = await db.facts.find_one({"id": fact_id})
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    new_status = not fact.get("is_featured", False)
    await db.facts.update_one({"id": fact_id}, {"$set": {"is_featured": new_status}})
    return {"message": f"Fact {'featured' if new_status else 'unfeatured'}", "is_featured": new_status}

@router.delete("/facts/{fact_id}")
async def admin_delete_fact(fact_id: str, admin: dict = Depends(get_admin_user)):
    db = get_db()
    result = await db.facts.delete_one({"id": fact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fact not found")
    await db.votes.delete_many({"fact_id": fact_id})
    await db.engagement.delete_many({"fact_id": fact_id})
    return {"message": "Fact deleted"}

@router.delete("/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    db = get_db()
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    await db.facts.delete_many({"author_id": user_id})
    await db.votes.delete_many({"user_id": user_id})
    return {"message": "User and their content deleted"}

@router.get("/engagement/timeline")
async def get_engagement_timeline(admin: dict = Depends(get_admin_user), days: int = 7):
    db = get_db()
    timeline = []
    for i in range(days):
        date = datetime.now(timezone.utc) - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        start = f"{date_str}T00:00:00"
        end = f"{date_str}T23:59:59"
        views = await db.engagement.count_documents({"event_type": "view", "created_at": {"$gte": start, "$lte": end}})
        shares = await db.engagement.count_documents({"event_type": "share", "created_at": {"$gte": start, "$lte": end}})
        new_facts = await db.facts.count_documents({"created_at": {"$gte": start, "$lte": end}})
        timeline.append({"date": date_str, "views": views, "shares": shares, "new_facts": new_facts})
    return {"timeline": list(reversed(timeline))}
