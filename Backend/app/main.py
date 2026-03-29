import threading
import time
import random
import requests
import os
import sys
import io
import csv
import json
import socket
from fastapi import FastAPI, HTTPException, Request, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from fpdf import FPDF

# --- AI INTEGRATION ---
# Ensuring the local 'app' directory is in sys.path so modules can find each other
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    # Attempting import now that the directory is explicitly in the path
    from chat_with_sense import generate_response
    print("🧠 Neural Link Established: Sense Brain V11 Online.")
except ImportError:
    try:
        # Fallback to package-style import
        from app.chat_with_sense import generate_response
        print("🧠 Neural Link Established: Sense Brain V11 (Package) Online.")
    except Exception as e:
        print(f"⚠️ AI Module Load Error: {e}")
        def generate_response(text): return "AI Module missing or path configuration error."
except Exception as e:
    print(f"⚠️ AI Module Load Error: {e}")
    def generate_response(text): return "AI Module missing or path configuration error."

# --- AUTH IMPORTS ---
from app.auth.auth_routes import router as AuthRouter
from app.auth.auth_bearer import JWTBearer

# --- DB & BLOCKCHAIN IMPORTS ---
from app.database import db_instance, connect_to_mongo, close_mongo_connection
from app.models.blockchain import Blockchain
from app.models.block import Block

app = FastAPI(title="SenseChain Real-time Node V12")

blockchain_lock = threading.Lock()
app_ready = threading.Event()

# ✅ HARDWARE & SIMULATION NODE REGISTRY
active_hardware_nodes = {}

# --- CORS SETTINGS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

blockchain = Blockchain()
app.include_router(AuthRouter, prefix="/auth")

# --- DATA MODELS ---
class HandshakeData(BaseModel):
    node_id: str
    mac_addr: str

class SensorData(BaseModel):
    sensor_id: str
    temperature: float
    humidity: float
    timestamp: Optional[Any] = None
    extra_info: Optional[Dict[str, Any]] = None

class ConfigUpdate(BaseModel):
    difficulty: int

# --- REAL-TIME WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                continue

manager = ConnectionManager()

def serialize_block(block):
    return {
        "index": int(block.index),
        "timestamp": float(block.timestamp),
        "data": block.data,
        "previous_hash": str(block.previous_hash),
        "hash": str(block.hash),
        "nonce": int(block.nonce)
    }

async def notify_clients():
    state = {
        "type": "UPDATE",
        "chain": [serialize_block(b) for b in blockchain.chain],
        "integrity": blockchain.is_chain_valid(),
        "length": len(blockchain.chain),
        "difficulty": blockchain.difficulty,
        "lastUpdated": time.time(),
        "active_nodes": active_hardware_nodes
    }
    await manager.broadcast(state)

# --- DATABASE SYNC HELPER ---
async def sync_to_mongodb(block_obj):
    if db_instance.collection is None: return
    try:
        await db_instance.collection.insert_one(serialize_block(block_obj))
    except: pass

# --- STARTUP & SHUTDOWN ---
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    with blockchain_lock:
        if db_instance.collection is not None:
            try:
                db_chain = await db_instance.collection.find().sort("index", 1).to_list(10000)
                if db_chain:
                    blockchain.chain = []
                    for b in db_chain:
                        b.pop("_id", None)
                        blk = Block(b['index'], b['data'], b['previous_hash'])
                        blk.timestamp, blk.nonce, blk.hash = b['timestamp'], b['nonce'], b['hash']
                        blockchain.chain.append(blk)
                    print("✅ MongoDB Ledger Synced.")
                else:
                    genesis = blockchain.create_genesis_block()
                    await sync_to_mongodb(genesis)
            except:
                if not blockchain.chain: blockchain.create_genesis_block()
        else:
            if not blockchain.chain: blockchain.create_genesis_block()
    app_ready.set()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# --- WEBSOCKET ROUTE ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await notify_clients()
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- IOT SIMULATOR ---
def run_iot_simulator():
    app_ready.wait()
    while True:
        try:
            if not active_hardware_nodes:
                requests.post("http://127.0.0.1:8000/mine_block", json={
                    "sensor_id": "VIRTUAL_NODE",
                    "temperature": round(random.uniform(20.0, 32.0), 2),
                    "humidity": round(random.uniform(40.0, 60.0), 2),
                    "timestamp": time.time()
                }, timeout=5)
        except: pass
        time.sleep(10)

threading.Thread(target=run_iot_simulator, daemon=True).start()

# --- CORE BLOCKCHAIN ENDPOINTS ---

@app.get("/chain")
def get_chain():
    return {"length": len(blockchain.chain), "chain": [serialize_block(b) for b in blockchain.chain]}

@app.post("/mine_block")
async def mine_block(data: SensorData):
    with blockchain_lock:
        block = blockchain.add_block(data.model_dump())
        await sync_to_mongodb(block)
        active_hardware_nodes[data.sensor_id] = {
            "status": "Online",
            "last_sync": time.time(),
            "last_data": f"{data.temperature}C | {data.humidity}%"
        }
        await notify_clients() 
        return {"message": "Block secured", "index": block.index}

@app.get("/difficulty")
async def get_difficulty():
    return {"difficulty": blockchain.difficulty}

@app.post("/update_config")
async def update_config(config: ConfigUpdate):
    try:
        with blockchain_lock:
            blockchain.difficulty = config.difficulty
            print(f"⚙️ [API] Consensus Updated: New Target = {config.difficulty}")
            await notify_clients()
            return {"status": "success", "difficulty": blockchain.difficulty}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/node_handshake")
async def node_handshake(data: HandshakeData):
    session_token = f"SENSE_{random.randint(1000, 9999)}"
    active_hardware_nodes[data.node_id] = {
        "mac": data.mac_addr, "token": session_token,
        "status": "Ready", "last_sync": time.time()
    }
    return {"status": "authorized", "token": session_token}

@app.post("/trigger_simulated_node/{node_id}")
async def trigger_simulated_node(node_id: str):
    def simulate_hardware():
        for i in range(100):
            time.sleep(random.uniform(2.5, 5.0)) 
            try:
                payload = {
                    "sensor_id": node_id,
                    "temperature": round(random.uniform(23.0, 29.0), 2),
                    "humidity": round(random.uniform(45.0, 55.0), 2),
                    "timestamp": time.time()
                }
                requests.post("http://127.0.0.1:8000/mine_block", json=payload, timeout=10)
            except: pass
    threading.Thread(target=simulate_hardware, daemon=True).start()
    return {"status": "Simulation Active", "node": node_id}

@app.post("/tamper_block/{index}", dependencies=[Depends(JWTBearer())])
async def tamper_block(index: int, new_temperature: float = 99.9):
    with blockchain_lock:
        if 0 <= index < len(blockchain.chain):
            blockchain.chain[index].data['temperature'] = new_temperature
            await notify_clients() 
            return {"message": f"Block #{index} tampered"}
        raise HTTPException(404, "Block index out of range")

@app.post("/repair_chain", dependencies=[Depends(JWTBearer())])
async def repair_chain():
    with blockchain_lock:
        msg = blockchain.repair_chain()
        if "Success" in msg and db_instance.collection is not None:
            await db_instance.collection.delete_many({})
            for b in blockchain.chain: await sync_to_mongodb(b)
        await notify_clients() 
        return {"message": msg}

@app.post("/reset_ledger", dependencies=[Depends(JWTBearer())])
async def reset_ledger():
    with blockchain_lock:
        if db_instance.collection is not None:
            await db_instance.collection.delete_many({})
        blockchain.chain = []
        genesis = blockchain.create_genesis_block()
        await sync_to_mongodb(genesis)
        await notify_clients()
        return {"message": "Ledger Purged"}

@app.get("/export_pdf")
def export_pdf():
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, "SenseChain Forensic Audit Report", ln=True, align='C')
        pdf.ln(10)
        pdf.set_font("Arial", "B", 10)
        pdf.cell(20, 8, "Index", 1); pdf.cell(45, 8, "Timestamp", 1); pdf.cell(25, 8, "Temp", 1); pdf.cell(100, 8, "Hash", 1); pdf.ln()
        pdf.set_font("Arial", "", 8)
        for b in blockchain.chain[-30:]:
            pdf.cell(20, 8, str(b.index), 1); pdf.cell(45, 8, time.ctime(b.timestamp), 1)
            pdf.cell(25, 8, f"{b.data.get('temperature')} C", 1); pdf.cell(100, 8, str(b.hash)[:35] + "...", 1); pdf.ln()
        return StreamingResponse(io.BytesIO(pdf.output(dest='S').encode('latin-1', 'ignore')),
            media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=SenseChain_Audit.pdf"})
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/export_report")
def export_csv():
    output = io.StringIO(); writer = csv.writer(output)
    writer.writerow(["Index", "Time", "Temp", "Hum", "Hash"])
    for b in blockchain.chain:
        writer.writerow([b.index, time.ctime(b.timestamp), b.data.get("temperature"), b.data.get("humidity"), b.hash])
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=report.csv"})

@app.post("/ask_assistant")
async def ask_assistant(request: Request):
    try:
        data = await request.json()
        result = generate_response(data.get("question", ""))
        ai_reply = result[0] if isinstance(result, tuple) else result
        return {"reply": str(ai_reply).replace("*", "").replace("#", "").strip(), "status": "success"}
    except Exception as e: return {"reply": f"Neural Link Error: {str(e)}", "status": "error"}

@app.get("/db_stats")
async def get_db_stats():
    if db_instance.db is not None:
        try:
            stats = await db_instance.db.command("dbStats")
            return {"status": "Online", "objects": stats['objects']}
        except: pass
    return {"status": "Offline", "objects": 0}