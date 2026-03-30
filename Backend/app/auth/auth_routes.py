import bcrypt
import random
from fastapi import APIRouter, Body, HTTPException
from app.auth.auth_handler import sign_jwt
from app.database import db_instance

router = APIRouter()

# -------------------------
# OTP STORE (MEMORY - Warning: Clears on server restart)
# -------------------------
otp_store = {}

# -------------------------
# PASSWORD HASHING
# -------------------------
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

# =========================================================
# 🔐 SIGNUP
# =========================================================
@router.post("/signup", tags=["user"])
async def create_user(user: dict = Body(...)):
    if db_instance.collection_users is None:
        raise HTTPException(status_code=500, detail="Database node unreachable. Try again.")

    existing_user = await db_instance.collection_users.find_one({"email": user["email"]})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists!")
    
    raw_password = str(user["password"])[:71]
    hashed_password = hash_password(raw_password)
    
    new_user = {
        "username": user["username"],
        "email": user["email"],
        "password": hashed_password,
        "role": user.get("role", "viewer")
    }
    
    await db_instance.collection_users.insert_one(new_user)
    return sign_jwt(user["email"])


# =========================================================
# 🔐 LOGIN
# =========================================================
@router.post("/login", tags=["user"])
async def user_login(user: dict = Body(...)):
    if db_instance.collection_users is None:
        raise HTTPException(status_code=500, detail="Database connection missing")

    db_user = await db_instance.collection_users.find_one({"email": user["email"]})
    
    if db_user:
        raw_password = str(user["password"])[:71]
        if verify_password(raw_password, db_user["password"]):
            return sign_jwt(user["email"])
    
    raise HTTPException(status_code=401, detail="Invalid email or password")


# =========================================================
# 🔢 SEND OTP
# =========================================================
@router.post("/send-otp")
async def send_otp(data: dict = Body(...)):
    email = data.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    otp = str(random.randint(1000, 9999))
    # 🔥 Storing in memory (For production, consider MongoDB collection 'otps')
    otp_store[email] = otp

    print(f"DEBUG: Generated OTP for {email} -> {otp}")

    return {
        "message": "OTP generated successfully",
        "otp": otp # In real apps, don't send this; use email service
    }


# =========================================================
# 🔢 VERIFY OTP
# =========================================================
@router.post("/verify-otp")
async def verify_otp(data: dict = Body(...)):
    email = data.get("email")
    otp = str(data.get("otp")) # Ensure string comparison

    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required")

    stored_otp = otp_store.get(email)

    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP expired or not found. Please resend.")

    if str(stored_otp) != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please check again.")

    # Optional: Clear OTP after successful verification
    # del otp_store[email]

    return {"message": "OTP verified", "status": "success"}


# =========================================================
# 🔄 RESET PASSWORD
# =========================================================
@router.post("/reset-password")
async def reset_password(data: dict = Body(...)):
    email = data.get("email")
    new_password = data.get("new_password")

    if not email or not new_password:
        raise HTTPException(status_code=400, detail="Missing required fields")

    if db_instance.collection_users is None:
        raise HTTPException(status_code=500, detail="Database connection missing")

    db_user = await db_instance.collection_users.find_one({"email": email})

    if not db_user:
        raise HTTPException(status_code=404, detail="User account not found")

    raw_password = str(new_password)[:71]
    hashed_password = hash_password(raw_password)

    await db_instance.collection_users.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}}
    )

    return {"message": "Password updated successfully", "status": "success"}