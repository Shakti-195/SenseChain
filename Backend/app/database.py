from motor.motor_asyncio import AsyncIOMotorClient

class Database:
    client: AsyncIOMotorClient = None
    db = None
    collection = None        # Ye Blockchain Ledger ke liye hai
    collection_users = None  # YE NAYA HAI: Users (Signup/Login) ke liye

# Is instance ko hum main.py aur auth_routes.py mein use karenge
db_instance = Database()

# Localhost address
MONGODB_URL = "mongodb://localhost:27017"

async def connect_to_mongo():
    try:
        db_instance.client = AsyncIOMotorClient(MONGODB_URL)
        
        # Database ka naam 'sensechain_db'
        db_instance.db = db_instance.client.sensechain_db
        
        # 1. Blockchain Ledger Collection
        db_instance.collection = db_instance.db.ledger
        
        # 2. User Authentication Collection (Naya setup)
        db_instance.collection_users = db_instance.db.users
        
        print("✅ MongoDB Connected Successfully!")
        print("📁 Collections Initialized: [ledger], [users]")
        
    except Exception as e:
        print(f"❌ Connection Error: {e}")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("❌ MongoDB Connection Closed.")