import hashlib
from app.utils.hash_utils import generate_hash

class ValidationService:
    @staticmethod
    def validate_chain(chain):
        """
        SenseChain Audit: Checks the integrity of the entire blockchain.
        This is the method your blockchain.py is looking for.
        """
        for i in range(1, len(chain)):
            current = chain[i]
            prev = chain[i-1]

            # 1. Check Hash Integrity
            # Extract content for re-hashing
            content = {
                "index": current.index,
                "timestamp": current.timestamp,
                "data": current.data,
                "previous_hash": current.previous_hash,
                "nonce": current.nonce
            }
            
            if current.hash != generate_hash(content):
                print(f"❌ Validation Error: Block {current.index} hash is invalid!")
                return False

            # 2. Check Linkage
            if current.previous_hash != prev.hash:
                print(f"❌ Validation Error: Block {current.index} is disconnected from {prev.index}")
                return False

        print("✅ SenseChain Integrity Verified: 100% Healthy.")
        return True