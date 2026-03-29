import hashlib
import json

def generate_hash(data):
    """
    Generates a deterministic SHA-256 hash for the given data.
    Ensures that the same dictionary always produces the same hash.
    """
    # 1. Convert dictionary to string (sorted for consistency)
    # 2. Convert string to bytes
    # 3. Generate SHA-256 and return hex format
    try:
        data_string = json.dumps(data, sort_keys=True).encode()
        return hashlib.sha256(data_string).hexdigest()
    except Exception as e:
        print(f"❌ Hashing Error: {e}")
        return None

if __name__ == "__main__":
    # Test cases for SenseChain Integrity
    sample_data = {
        "device_id": "Device_01",
        "temperature": 28,
        "humidity": 65,
        "status": "SECURE"
    }

    print("--- SenseChain Hash Utility Test ---")
    hash_value = generate_hash(sample_data)
    print(f"Neural Hash: {hash_value}")