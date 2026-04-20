import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'facts-are-foes-secret-key-prod-2024-xyz123-fallback')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# Resend Email Config
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

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
