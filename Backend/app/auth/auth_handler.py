import time
import jwt
from typing import Dict

# 🔐 SECRET KEY: Ise secret rakhna, ye tokens sign karne ke kaam aati hai.
JWT_SECRET = "SENSE_CHAIN_V11_NEURAL_SECRET_KEY_99" 
JWT_ALGORITHM = "HS256"

def sign_jwt(user_id: str) -> Dict[str, str]:
    """User ID ke liye ek naya JWT Token generate karta hai."""
    payload = {
        "user_id": user_id,
        "expires": time.time() + 3600  # 1 Hour validity
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {"access_token": token}

def decode_jwt(token: str) -> dict:
    """Token ko check karta hai ki wo valid hai ya expire toh nahi hua."""
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded_token if decoded_token["expires"] >= time.time() else None
    except:
        return {}