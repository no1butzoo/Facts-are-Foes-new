from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from database import connect_db, close_db

# Load env variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import routers
from routes.auth import router as auth_router
from routes.facts import router as facts_router
from routes.intel import router as intel_router
from routes.subscriptions import router as subscriptions_router
from routes.admin import router as admin_router
from routes.misc import router as misc_router

app = FastAPI(title="Facts Are Foes API")
api_router = APIRouter(prefix="/api")

# Include routers
api_router.include_router(auth_router)
api_router.include_router(facts_router)
api_router.include_router(intel_router)
api_router.include_router(subscriptions_router)
api_router.include_router(admin_router)
api_router.include_router(misc_router)

# Health checks & Seed (keeping seed simple here or move later)
@api_router.get("/")
async def root():
    return {"message": "Facts Are Foes API", "version": "2.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    connect_db()

@app.on_event("shutdown")
async def shutdown_db_client():
    close_db()
