import hashlib
import json
import time

class Block:
    def __init__(self, index, data, previous_hash, timestamp=None):
        self.index = int(index)
        self.timestamp = float(timestamp) if timestamp else time.time()
        self.data = data
        self.previous_hash = str(previous_hash)
        self.nonce = 0
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        """
        Generates a deterministic SHA-256 hash.
        CRITICAL: sort_keys=True ensures the dictionary is always hashed 
        in the same order, preventing 'Invalid Hash' errors.
        """
        block_dict = {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }
        
        # Ensure we use a standardized, sorted JSON string for hashing
        block_string = json.dumps(block_dict, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()