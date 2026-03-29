import json
import os
import time
from app.models.block import Block
from app.utils.hash_utils import generate_hash
from app.services.validation_service import ValidationService

# Persistent Storage
CHAIN_FILE = "blockchain_data.json"

class Blockchain:
    def __init__(self):
        self.chain = []
        self.difficulty = 3 
        
        # Priority: Disk fallback for safety
        if not self.load_chain():
            self.create_genesis_block()

    def create_genesis_block(self):
        """Initializes the SenseChain with the very first block."""
        genesis_block = Block(0, "Genesis Block: Neural Link Established", "0")
        self.mine_block(genesis_block)
        self.chain.append(genesis_block)
        self.save_chain()
        return genesis_block

    def get_latest_block(self):
        return self.chain[-1]

    def mine_block(self, block):
        """Standardized Proof of Work logic using Neural Hash Utility."""
        start_time = time.time()
        target = '0' * self.difficulty
        
        # Helper to get clean data for hashing
        def get_block_content(b):
            return {
                "index": b.index,
                "timestamp": b.timestamp,
                "data": b.data,
                "previous_hash": b.previous_hash,
                "nonce": b.nonce
            }

        block.hash = generate_hash(get_block_content(block))
        
        while not block.hash.startswith(target):
            block.nonce += 1
            block.hash = generate_hash(get_block_content(block))
            
        print(f"✅ Block {block.index} Mined! Nonce: {block.nonce} | Time: {time.time() - start_time:.4f}s")

    def add_block(self, data):
        """Mines and persists a new block with IoT/Neural data."""
        latest = self.get_latest_block()
        new_block = Block(latest.index + 1, data, latest.hash)
        
        print(f"⛏️  Mining block {new_block.index} [Difficulty: {self.difficulty}]...")
        self.mine_block(new_block)
        
        self.chain.append(new_block)
        self.save_chain()
        return new_block

    def is_chain_valid(self):
        """Deep audit of the entire blockchain integrity."""
        return ValidationService.validate_chain(self.chain)

    def repair_chain(self):
        """Self-Healing: Re-mines from the point of corruption."""
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            prev = self.chain[i-1]
            
            content = {"index":current.index, "timestamp":current.timestamp, "data":current.data, "previous_hash":current.previous_hash, "nonce":current.nonce}
            
            # Check for tampering or disconnection
            if current.hash != generate_hash(content) or current.previous_hash != prev.hash:
                print(f"🛠️  Neural Repair initiated from Block #{i}")
                for j in range(i, len(self.chain)):
                    self.chain[j].previous_hash = self.chain[j-1].hash
                    self.mine_block(self.chain[j])
                
                self.save_chain()
                return f"Success: Repaired {len(self.chain) - i} blocks."
        
        return "Chain is already healthy."

    def save_chain(self):
        """Saves the neural ledger to JSON backup."""
        try:
            with open(CHAIN_FILE, "w") as f:
                # Convert all block objects to dicts for JSON
                json.dump([vars(b) for b in self.chain], f, indent=4)
        except Exception as e:
            print(f"❌ Storage Error: {e}")

    def load_chain(self):
        """Loads the chain on system startup."""
        if os.path.exists(CHAIN_FILE):
            try:
                with open(CHAIN_FILE, "r") as f:
                    data = json.load(f)
                self.chain = []
                for item in data:
                    block = Block(item["index"], item["data"], item["previous_hash"])
                    block.timestamp, block.nonce, block.hash = item["timestamp"], item["nonce"], item["hash"]
                    self.chain.append(block)
                return True
            except: return False
        return False