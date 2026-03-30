import os  # Environment variables read karne ke liye zaroori hai
from motor.motor_asyncio import AsyncIOMotorClient

class Database:
    client: AsyncIOMotorClient = None
    db = None
    collection = None         # Blockchain Ledger ke liye
    collection_users = None   # Users (Signup/Login) ke liye

# Is instance ko hum main.py aur auth_routes.py mein use karenge
db_instance = Database()

# --- MODIFIED FOR DEPLOYMENT ---
# Render par ye 'MONGO_URI' variable check karega, agar nahi milega toh localhost use karega
MONGODB_URL = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "sensechain_db")

async def connect_to_mongo():
    try:
        # Atlas ya Local connection establish karna
        db_instance.client = AsyncIOMotorClient(MONGODB_URL)
        
        # Database select karna (Ab ye dynamic hai)
        db_instance.db = db_instance.client[DB_NAME]
        
        # Collections initialize karna
        db_instance.collection = db_instance.db.ledger
        db_instance.collection_users = db_instance.db.users
        
        print(f"✅ MongoDB Connected Successfully to: {DB_NAME}")
        print("📁 Collections Initialized: [ledger], [users]")
        
    except Exception as e:
        print(f"❌ Connection Error: {e}")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("❌ MongoDB Connection Closed.")