import threading
import time
import random
import os
import sys
import io
import csv
import json
import anyio
from fastapi import FastAPI, HTTPException, Request, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from fpdf import FPDF

# --- AI INTEGRATION ---
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from chat_with_sense import generate_response
    print("🧠 Neural Link Established: Sense Brain V11 Online.")
except ImportError:
    try:
        from app.chat_with_sense import generate_response
        print("🧠 Neural Link Established: Sense Brain (Package) Online.")
    except Exception as e:
        print(f"⚠️ AI Module Load Error: {e}")
        def generate_response(text): return "AI Module missing or path configuration error."

# --- AUTH & DB IMPORTS ---
from app.auth.auth_routes import router as AuthRouter
from app.auth.auth_bearer import JWTBearer
from app.database import db_instance, connect_to_mongo, close_mongo_connection
from app.models.blockchain import Blockchain
from app.models.block import Block

app = FastAPI(title="SenseChain Real-time Node V12")

blockchain_lock = threading.Lock()
app_ready = threading.Event()
active_hardware_nodes = {} # registry for Authorized Clusters

# ✅ UPDATED CORS CONFIG (Explicitly allows your production domains)
origins = [
    "https://sense-chain.vercel.app",
    "http://localhost:5173",
    "*" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"] 
)

blockchain = Blockchain()

# --- DATA MODELS ---
class SensorData(BaseModel):
    sensor_id: str
    temperature: float
    humidity: float
    timestamp: Optional[Any] = None

class HandshakeData(BaseModel):
    node_id: str
    mac_addr: str

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

async def sync_to_mongodb(block_obj):
    if db_instance.collection is None: return
    try:
        await db_instance.collection.insert_one(serialize_block(block_obj))
    except Exception as e:
        print(f"⚠️ DB Sync Failed: {e}")

# --- STARTUP & SHUTDOWN ---
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    with blockchain_lock:
        if db_instance.collection is not None:
            try:
                db_chain = await db_instance.collection.find().sort("index", 1).to_list(1000)
                if db_chain:
                    blockchain.chain = []
                    for b in db_chain:
                        b.pop("_id", None)
                        blk = Block(b['index'], b['data'], b['previous_hash'])
                        blk.timestamp, blk.nonce, blk.hash = b['timestamp'], b['nonce'], b['hash']
                        blockchain.chain.append(blk)
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

# --- CORE ROUTES ---

@app.get("/")
async def health_check():
    return {
        "status": "Online",
        "message": "SenseChain Backend is Live",
        "version": "12.0.1",
        "active_nodes": len(active_hardware_nodes)
    }

app.include_router(AuthRouter, prefix="/auth")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await notify_clients()
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/node_handshake")
async def node_handshake(data: HandshakeData):
    session_token = f"SENSE_{random.randint(1000, 9999)}"
    active_hardware_nodes[data.node_id] = {
        "mac": data.mac_addr,
        "token": session_token,
        "status": "Secured",
        "last_sync": time.time(),
        "last_data": "Neural Bridge Established"
    }
    await notify_clients()
    return {"status": "authorized", "token": session_token}

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
            "last_data": f"{data.temperature}°C | {data.humidity}%"
        }
        await notify_clients() 
        return {"message": "Block secured", "index": block.index}

# ✅ ASYNC AI ASSISTANT (Fixed "Thinking..." issue)
@app.post("/ask_assistant")
async def ask_assistant(request: Request):
    try:
        req_data = await request.json()
        question = req_data.get("question", "")
        
        # Long running AI tasks ko main thread se bahar chalate hain
        result = await run_in_threadpool(generate_response, question)
        
        ai_reply = result[0] if isinstance(result, tuple) else result
        clean_reply = str(ai_reply).replace("*", "").replace("#", "").strip()
        
        return {"reply": clean_reply, "status": "success"}
    except Exception as e:
        print(f"❌ Assistant Error: {e}")
        return {"reply": "Neural signal timeout. Please try again.", "status": "error"}

@app.get("/get_uplink_ip")
async def get_uplink_ip():
    return {"ip": "Cloud Node", "endpoint": "https://sensechain.onrender.com"}

@app.get("/db_stats")
async def get_db_stats():
    if db_instance.db is not None:
        try:
            stats = await db_instance.db.command("dbStats")
            return {"status": "Online", "objects": stats['objects']}
        except: pass
    return {"status": "Offline", "objects": 0}

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
        for b in blockchain.chain[-20:]: 
            pdf.cell(20, 8, str(b.index), 1)
            pdf.cell(45, 8, time.ctime(b.timestamp), 1)
            temp = b.data.get('temperature', 'N/A')
            pdf.cell(25, 8, f"{temp} C", 1)
            pdf.cell(100, 8, str(b.hash)[:35] + "...", 1); pdf.ln()
        
        pdf_content = pdf.output(dest='S').encode('latin-1', 'ignore')
        return StreamingResponse(io.BytesIO(pdf_content), media_type="application/pdf", 
                            headers={"Content-Disposition": "attachment; filename=SenseChain_Audit.pdf"})
    except Exception as e: 
        raise HTTPException(status_code=500, detail=str(e))