from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional

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
