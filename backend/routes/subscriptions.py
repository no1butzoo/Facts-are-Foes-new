from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid
import logging
from datetime import datetime, timezone
from database import get_db
from models.schemas import CheckoutRequest
from utils.security import get_current_user
from config import STRIPE_API_KEY, SUBSCRIPTION_PLANS
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

router = APIRouter(prefix="/subscription", tags=["subscriptions"])
logger = logging.getLogger(__name__)

@router.get("/plans")
async def get_subscription_plans():
    return {"plans": SUBSCRIPTION_PLANS}

@router.post("/create-checkout")
async def create_checkout_session(req: CheckoutRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
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

@router.get("/status/{session_id}")
async def get_subscription_status(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    try:
        checkout = StripeCheckout(api_key=STRIPE_API_KEY)
        status: CheckoutStatusResponse = await checkout.get_checkout_status(session_id)
        if status.payment_status == "paid":
            subscription = await db.subscriptions.find_one({"session_id": session_id})
            tier = "premium"
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
            
            if subscription and subscription.get("status") != "active":
                tier_msg = "Sovereignty" if tier == "sovereign" else "Premium Access"
                await db.network_events.insert_one({
                    "id": str(uuid.uuid4()),
                    "event_type": "subscription",
                    "message": f"A Node has initiated {tier_msg}. The Network strengthens.",
                    "created_at": datetime.now(timezone.utc).isoformat()
                })

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

@router.get("/my-subscription")
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    db = get_db()
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
