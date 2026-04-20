import logging
import bcrypt
import jwt
import secrets
import asyncio
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, RESEND_API_KEY, SENDER_EMAIL
from database import get_db

try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    resend = None

if RESEND_AVAILABLE and RESEND_API_KEY and RESEND_API_KEY != 're_your_api_key_here':
    resend.api_key = RESEND_API_KEY

logger = logging.getLogger(__name__)
security = HTTPBearer()

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
    if not RESEND_AVAILABLE or not RESEND_API_KEY or RESEND_API_KEY == 're_your_api_key_here':
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
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        return False

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        db = get_db()
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

ADMIN_EMAILS = ["admin@factsarefoes.com"]

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    db = get_db()
    first_user = await db.users.find_one({}, {"_id": 0}, sort=[("created_at", 1)])
    if user["email"] in ADMIN_EMAILS or (first_user and user["id"] == first_user["id"]):
        user["is_admin"] = True
        return user
    raise HTTPException(status_code=403, detail="Admin access required")
