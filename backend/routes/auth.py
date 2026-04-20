from fastapi import APIRouter, HTTPException, Depends, Request
import uuid
from datetime import datetime, timezone
from database import get_db
from models.schemas import UserCreate, UserLogin, EmailVerificationRequest, ResendVerificationRequest
from utils.security import (
    hash_password, verify_password, create_token, generate_verification_token, 
    send_verification_email, get_current_user
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=dict)
async def register(user: UserCreate, request: Request):
    db = get_db()
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

@router.post("/verify-email")
async def verify_email(req: EmailVerificationRequest):
    db = get_db()
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

@router.post("/resend-verification")
async def resend_verification(req: ResendVerificationRequest, request: Request):
    db = get_db()
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

@router.post("/login", response_model=dict)
async def login(user: UserLogin):
    db = get_db()
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

@router.get("/me", response_model=dict)
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
