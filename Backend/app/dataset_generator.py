import json
import random

def generate_advanced_sense_data(samples=8000):
    dataset = []

    # --- 1. TECHNICAL DEBUGGING (DEEP) ---
    debugging = [
        {
            "input": "block {idx} hash mismatch error",
            "output": "Block {idx} hash mismatch indicates data integrity failure. Recompute the hash and verify previousHash linkage. If mismatch persists, trigger chain re-mining."
        },
        {
            "input": "node not syncing with blockchain",
            "output": "Check network latency and peer connections. Ensure your node is connected to at least 3 peers and ports are open."
        },
        {
            "input": "mining taking too long",
            "output": "Mining delay is caused by high difficulty. Reduce difficulty or optimize hashing using GPU acceleration."
        },
        {
            "input": "api not responding",
            "output": "Check if Express server is running and port is not blocked. Also verify middleware like body-parser."
        },
        {
            "input": "cannot connect to mongodb",
            "output": "Ensure MongoDB is running. Verify URI, credentials, and network access permissions."
        }
    ]

    # --- 2. IOT REAL-WORLD SCENARIOS ---
    iot_real = [
        {
            "input": "temperature sensor giving wrong values",
            "output": "Calibrate the sensor and check environmental interference. DHT11 sensors are sensitive to humidity and heat spikes."
        },
        {
            "input": "sensor data delay",
            "output": "Delay occurs due to network latency or edge processing issues. Use edge computing to reduce round-trip time."
        },
        {
            "input": "battery draining fast in sensors",
            "output": "Enable sleep mode and reduce transmission frequency. Avoid constant polling."
        }
    ]

    # --- 3. BLOCKCHAIN CONCEPTS ---
    blockchain = [
        {
            "input": "what is proof of work",
            "output": "Proof of Work is a consensus mechanism where miners solve cryptographic puzzles to validate transactions and add new blocks."
        },
        {
            "input": "what is 51 percent attack",
            "output": "A 51% attack occurs when one entity gains majority control of network hash power and can manipulate the blockchain."
        },
        {
            "input": "why blockchain is secure",
            "output": "Blockchain uses cryptographic hashing and decentralization. Any change alters hashes, making tampering detectable."
        }
    ]

    # --- 4. STEP-BY-STEP GUIDES ---
    guides = [
        {
            "input": "how to setup mongodb",
            "output": "1. Install MongoDB\n2. Start service\n3. Connect using URI\n4. Test connection with Mongo shell"
        },
        {
            "input": "how to create blockchain from scratch",
            "output": "1. Create Block class\n2. Add hashing (SHA-256)\n3. Link blocks via previousHash\n4. Implement mining\n5. Validate chain"
        }
    ]

    # --- 5. SECURITY ---
    security = [
        {
            "input": "how to secure iot devices",
            "output": "Use encryption, secure boot, and blockchain logging. Avoid default passwords."
        },
        {
            "input": "man in the middle attack",
            "output": "An attacker intercepts communication. Prevent it using TLS and blockchain verification."
        }
    ]

    # --- 6. LOG ANALYSIS ---
    logs = [
        {
            "input": "error: econnrefused 127.0.0.1:27017",
            "output": "MongoDB service is not running or port is blocked. Start MongoDB or check firewall."
        },
        {
            "input": "warning: high latency detected",
            "output": "Network congestion or heavy computation is causing delay. Optimize processing or reduce load."
        }
    ]

    # --- 7. HUMAN CONVERSATION ---
    conversation = [
        {
            "input": "i am stuck",
            "output": "No worries. Debugging is part of the process. Tell me the error and we will fix it together."
        },
        {
            "input": "this is confusing",
            "output": "Let me simplify it for you step by step. Which part is unclear?"
        },
        {
            "input": "hello sense",
            "output": "Hey! Ready to monitor your blockchain or debug some nodes?"
        }
    ]

    # --- ALL CATEGORIES ---
    categories = [
        debugging, iot_real, blockchain,
        guides, security, logs, conversation
    ]

    # --- GENERATION ---
    for _ in range(samples):
        cat = random.choice(categories)
        sample = random.choice(cat)

        idx = random.randint(1, 1000)

        inp = sample["input"].replace("{idx}", str(idx))
        out = sample["output"].replace("{idx}", str(idx))

        dataset.append({
            "instruction": inp,
            "response": out
        })

    random.shuffle(dataset)

    with open("sensechain_pro_dataset.json", "w") as f:
        json.dump(dataset, f, indent=4)

    print(f"🔥 Pro Dataset Generated: {len(dataset)} samples")

if __name__ == "__main__":
    generate_advanced_sense_data()