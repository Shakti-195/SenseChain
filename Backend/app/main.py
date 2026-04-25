import threading
import time
import random
import os
import sys
import io
import json
import logging
import asyncio
from fastapi import FastAPI, HTTPException, Request, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from fpdf import FPDF

# ✅ PRODUCTION LOGGING
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SenseChain-Node")

# --- AI INTEGRATION ---
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    try:
        from chat_with_sense import generate_response
    except ImportError:
        from app.chat_with_sense import generate_response
    logger.info("🧠 Neural Link Established: Sense Brain V11 Online.")
except Exception as e:
    logger.error(f"⚠️ AI Module Load Error: {e}")
    def generate_response(text): 
        return "Neural Node is calibrating. Please retry in 30 seconds."

# --- AUTH & DB IMPORTS ---
from app.auth.auth_routes import router as AuthRouter
from app.auth.auth_bearer import JWTBearer
from app.database import db_instance, connect_to_mongo, close_mongo_connection
from app.models.blockchain import Blockchain
from app.models.block import Block

app = FastAPI(title="SenseChain Master Node V12.5")

blockchain_lock = threading.Lock()
active_hardware_nodes = {}

# ✅ PRODUCTION CORS CONFIG
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"] 
)

blockchain = Blockchain()

# --- WEBSOCKET MANAGER ---
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
    # ✅ Fixed: Added unique ID and safe data fallback for Recharts
    return {
        "id": f"blk_{block.index}_{block.timestamp}",
        "index": int(block.index),
        "timestamp": float(block.timestamp),
        "data": block.data if isinstance(block.data, dict) else {"temperature": 0, "humidity": 0},
        "previous_hash": str(block.previous_hash),
        "hash": str(block.hash),
        "nonce": int(block.nonce)
    }

# ✅ CRITICAL: Notify UI with REAL-TIME Integrity Status
async def notify_clients():
    # Physically re-validate entire chain hashes to catch any tampering
    current_integrity = blockchain.is_chain_valid()
    
    state = {
        "type": "UPDATE",
        "chain": [serialize_block(b) for b in blockchain.chain],
        "integrity": current_integrity, 
        "length": len(blockchain.chain),
        "difficulty": blockchain.difficulty,
        "lastUpdated": time.time(),
        "active_nodes": active_hardware_nodes 
    }
    await manager.broadcast(state)

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
                        blk = Block(b['index'], b['data'], b['previous_hash'])
                        blk.timestamp, blk.nonce, blk.hash = b['timestamp'], b['nonce'], b['hash']
                        blockchain.chain.append(blk)
                else:
                    blockchain.create_genesis_block()
            except Exception as e:
                logger.error(f"Sync Error: {e}")
                if not blockchain.chain: blockchain.create_genesis_block()
        else:
            if not blockchain.chain: blockchain.create_genesis_block()
    
    # ✅ Heartbeat Task: Keeps WebSocket alive and Dashboard synced
    async def heartbeat():
        while True:
            await asyncio.sleep(10)
            await notify_clients()
    asyncio.create_task(heartbeat())

    # ✅ Real-time Data Generation Loop for Dashboard SaaS feel
    async def simulation_loop():
        while True:
            await asyncio.sleep(4)  # Generate a block every 4 seconds for active simulations
            needs_notify = False
            new_blocks = []
            with blockchain_lock:
                for node_id, node_info in list(active_hardware_nodes.items()):
                    if node_info.get("status") == "Simulating":
                        simulated_data = {
                            "temperature": round(random.uniform(20.0, 30.0), 2),
                            "humidity": round(random.uniform(40.0, 70.0), 2),
                            "device_id": node_id,
                            "status": "active"
                        }
                        nb = blockchain.add_block(simulated_data)
                        new_blocks.append(nb)
                        node_info["last_sync"] = time.time()
                        needs_notify = True
                        
            if new_blocks and db_instance.collection is not None:
                await db_instance.collection.insert_many([serialize_block(b) for b in new_blocks])
            if needs_notify:
                await notify_clients()

    asyncio.create_task(simulation_loop())

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# --- ROUTES ---

@app.get("/")
async def health_check():
    return {"status": "success", "integrity": blockchain.is_chain_valid()}

app.include_router(AuthRouter, prefix="/auth")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await notify_clients()
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.post("/tamper_block/{index}", dependencies=[Depends(JWTBearer())])
async def tamper_block(index: int, new_temperature: float = Query(99.9)):
    with blockchain_lock:
        if not (0 <= index < len(blockchain.chain)):
            raise HTTPException(status_code=404, detail="Target node out of range")

        block = blockchain.chain[index]
        if not isinstance(block.data, dict):
            # Convert non-dict genesis-style data into structured payload
            block.data = {
                "message": str(block.data),
                "temperature": 0,
                "humidity": 0,
                "status": "tampered"
            }

        block.data["temperature"] = new_temperature
        blockchain.is_chain_valid()
        logger.warning(f"🚨 BREACH INJECTED: Block {index}")

    if db_instance.collection is not None:
        await db_instance.collection.update_one({"index": index}, {"$set": {"data": block.data}})

    await notify_clients()
    return {"message": "Breach deployed", "status": "success"}

@app.post("/repair_chain", dependencies=[Depends(JWTBearer())])
async def repair_chain():
    with blockchain_lock:
        blockchain.repair_chain()
        
    if db_instance.collection is not None:
        await db_instance.collection.delete_many({})
        if len(blockchain.chain) > 0:
            await db_instance.collection.insert_many([serialize_block(b) for b in blockchain.chain])

    await notify_clients()
    return {"status": "success", "message": "Neural Integrity Restored"}


# =========================================================
# 🤖 AI COMMAND BUS — Sense Brain executes system actions
# =========================================================
@app.post("/ai_execute")
async def ai_execute(request: Request):
    """Unified AI command bus. Sense Brain calls this to act on the system."""
    import datetime
    try:
        body    = await request.json()
        action  = body.get("action", "").strip().lower()
        payload = body.get("payload", {})

        now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S UTC")

        # ── MINE / ADD BLOCK ──────────────────────────────────────────────
        if action == "mine_block":
            node_id = payload.get("node_id", "SENSE-AI-NODE")
            sim_data = {
                "temperature": round(payload.get("temperature", __import__('random').uniform(20, 30)), 2),
                "humidity":    round(payload.get("humidity",    __import__('random').uniform(40, 70)), 2),
                "device_id":   node_id,
                "status":      "active",
            }
            with blockchain_lock:
                new_block = blockchain.add_block(sim_data)
                active_hardware_nodes[node_id] = {
                    "status": "AI-Controlled", "last_sync": __import__('time').time(),
                    "last_data": sim_data, "last_block_index": new_block.index
                }
            if db_instance.collection is not None:
                await db_instance.collection.insert_one(serialize_block(new_block))
            await notify_clients()
            return {
                "action": "mine_block", "status": "success",
                "message": f"Block #{new_block.index} mined by AI at {now_str}. Hash: {new_block.hash[:20]}...",
                "data": {"index": new_block.index, "hash": new_block.hash, "node": node_id,
                         "temperature": sim_data["temperature"], "humidity": sim_data["humidity"]}
            }

        # ── REPAIR CHAIN ─────────────────────────────────────────────────
        elif action == "repair_chain":
            with blockchain_lock:
                blockchain.repair_chain()
            if db_instance.collection is not None:
                await db_instance.collection.delete_many({})
                if blockchain.chain:
                    await db_instance.collection.insert_many([serialize_block(b) for b in blockchain.chain])
            await notify_clients()
            return {
                "action": "repair_chain", "status": "success",
                "message": f"Chain repaired at {now_str}. All {len(blockchain.chain)} blocks re-verified.",
                "data": {"chain_length": len(blockchain.chain)}
            }

        # ── TAMPER BLOCK ─────────────────────────────────────────────────
        elif action == "tamper_block":
            index = int(payload.get("index", 1))
            temp  = float(payload.get("temperature", 999.9))
            with blockchain_lock:
                if not (0 <= index < len(blockchain.chain)):
                    return {"action": "tamper_block", "status": "error",
                            "message": f"Block #{index} does not exist. Chain has {len(blockchain.chain)} blocks."}
                block = blockchain.chain[index]
                if not isinstance(block.data, dict):
                    block.data = {"message": str(block.data), "temperature": 0, "humidity": 0, "status": "tampered"}
                block.data["temperature"] = temp
                blockchain.is_chain_valid()
            if db_instance.collection is not None:
                await db_instance.collection.update_one({"index": index}, {"$set": {"data": block.data}})
            await notify_clients()
            return {
                "action": "tamper_block", "status": "success",
                "message": f"Block #{index} tampered at {now_str}. Temperature set to {temp}°C. Chain integrity now BREACHED.",
                "data": {"index": index, "temperature": temp}
            }

        # ── STOP NODE ────────────────────────────────────────────────────
        elif action == "stop_node":
            node_id = payload.get("node_id", "")
            with blockchain_lock:
                removed = node_id in active_hardware_nodes
                if removed:
                    del active_hardware_nodes[node_id]
            await notify_clients()
            return {
                "action": "stop_node", "status": "success" if removed else "warning",
                "message": f"Node {node_id} {'terminated' if removed else 'was not active'} at {now_str}.",
                "data": {"node_id": node_id, "was_active": removed}
            }

        # ── RESET LEDGER ─────────────────────────────────────────────────
        elif action == "reset_ledger":
            with blockchain_lock:
                blockchain.chain = []
                genesis = blockchain.create_genesis_block()
                blockchain.save_chain()
            if db_instance.collection is not None:
                await db_instance.collection.delete_many({})
                await db_instance.collection.insert_one(serialize_block(genesis))
            await notify_clients()
            return {
                "action": "reset_ledger", "status": "success",
                "message": f"Ledger reset at {now_str}. Genesis block created. All data cleared.",
                "data": {"chain_length": 1}
            }

        # ── SET DIFFICULTY ───────────────────────────────────────────────
        elif action == "set_difficulty":
            level = int(payload.get("level", 3))
            level = max(1, min(5, level))
            with blockchain_lock:
                blockchain.difficulty = level
            return {
                "action": "set_difficulty", "status": "success",
                "message": f"Mining difficulty set to {level} at {now_str}. Changes take effect on next block.",
                "data": {"difficulty": level}
            }

        # ── GET SNAPSHOT ─────────────────────────────────────────────────
        elif action == "get_snapshot":
            chain  = blockchain.chain
            valid  = blockchain.is_chain_valid()
            recent = [b for b in chain if isinstance(b.data, dict)][-10:]
            temps  = [b.data.get("temperature") for b in recent if b.data.get("temperature") is not None]
            hums   = [b.data.get("humidity")    for b in recent if b.data.get("humidity")    is not None]
            return {
                "action": "get_snapshot", "status": "success",
                "message": f"System snapshot captured at {now_str}.",
                "data": {
                    "chain_length": len(chain),
                    "integrity": "SECURE" if valid else "BREACH DETECTED",
                    "difficulty": blockchain.difficulty,
                    "active_nodes": len(active_hardware_nodes),
                    "nodes": list(active_hardware_nodes.keys()),
                    "avg_temperature": round(sum(temps)/len(temps), 2) if temps else None,
                    "avg_humidity":    round(sum(hums)/len(hums),   2) if hums  else None,
                }
            }

        else:
            return {"action": action, "status": "error",
                    "message": f"Unknown action '{action}'. Supported: mine_block, repair_chain, tamper_block, stop_node, reset_ledger, set_difficulty, get_snapshot"}

    except Exception as e:
        logger.error(f"AI Execute Error: {e}")
        return {"action": body.get("action", "?"), "status": "error", "message": str(e)}


@app.post("/ask_assistant")
async def ask_assistant(request: Request):
    try:
        req_data     = await request.json()
        raw_q        = req_data.get("question", "").strip()
        deep_srch    = req_data.get("deep_search", False)
        sys_ctx      = req_data.get("system_context", "")  # live system data injected by frontend

        if not raw_q:
            return {"reply": "Please ask me something!", "status": "error"}

        # Enrich question with live system context when provided
        enriched_q = raw_q
        if sys_ctx:
            enriched_q = (
                f"[LIVE SENSECHAIN SYSTEM DATA]\n{sys_ctx}\n"
                f"[END SYSTEM DATA]\n\n"
                f"Using the live system data above, answer this question accurately:\n{raw_q}"
            )

        # ── DEEP SEARCH: all queries go through Google automatically ─────────
        if deep_srch:
            def _do_deep_search():
                try:
                    from chat_with_sense import search_google_results
                except ImportError:
                    from app.chat_with_sense import search_google_results

                web = search_google_results(raw_q)

                # Only treat as error if OUR OWN error strings are returned.
                # Do NOT use broad substring checks like "unavailable" — Google
                # result snippets often contain that word legitimately.
                is_error = (
                    not web
                    or web.startswith("Search error:")
                    or web.startswith("Search API error:")
                    or web.startswith("Search module unavailable")
                    or web == "No live results found. Check your API quota or query."
                )

                if not is_error:
                    return (
                        f"Google Search Results for: \"{raw_q}\"\n\n"
                        f"{web}\n"
                        "--- Powered by Sense Brain Deep Search via Google ---"
                    )

                # Fallback: local AI when search quota/network unavailable
                try:
                    from chat_with_sense import generate_response as gr
                except ImportError:
                    from app.chat_with_sense import generate_response as gr
                res = gr(enriched_q)
                ai  = res[0] if isinstance(res, (tuple, list)) else res
                logger.warning(f"Deep search fallback triggered. Search returned: {web}")
                return f"[Search unavailable - using local knowledge]\n\n{ai}"

            reply = await asyncio.wait_for(run_in_threadpool(_do_deep_search), timeout=40.0)
            return {"reply": str(reply).strip(), "status": "success", "source": "deep_search"}

        # ── STANDARD local AI ─────────────────────────────────────────────────
        result   = await asyncio.wait_for(run_in_threadpool(generate_response, enriched_q), timeout=25.0)
        ai_reply = result[0] if isinstance(result, (tuple, list)) else result
        return {"reply": str(ai_reply).replace("*", "").strip(), "status": "success", "source": "local_ai"}

    except asyncio.TimeoutError:
        return {"reply": "Neural connection timed out. Please try again.", "status": "error"}
    except Exception as e:
        logger.error(f"AI ERROR: {e}")
        return {"reply": "Neural link error. Please retry.", "status": "error"}

@app.post("/trigger_simulated_node/{node_id}")
async def trigger_simulated_node(node_id: str):
    # Simulate sensor packet and add a block to the chain for dashboard graphs
    simulated_data = {
        "temperature": round(random.uniform(20.0, 30.0), 2),
        "humidity": round(random.uniform(40.0, 70.0), 2),
        "device_id": node_id,
        "status": "active"
    }

    with blockchain_lock:
        new_block = blockchain.add_block(simulated_data)

        active_hardware_nodes[node_id] = {
            "status": "Simulating",
            "last_sync": time.time(),
            "last_data": simulated_data,
            "last_block_index": new_block.index
        }

    if db_instance.collection is not None:
        await db_instance.collection.insert_one(serialize_block(new_block))

    await notify_clients()
    return {
        "status": "success",
        "message": f"Node {node_id} initialized and block mined",
        "block": serialize_block(new_block)
    }


@app.post("/stop_simulated_node/{node_id}")
async def stop_simulated_node(node_id: str):
    with blockchain_lock:
        if node_id in active_hardware_nodes:
            del active_hardware_nodes[node_id]
    await notify_clients()
    return {"status": "success", "message": f"Node {node_id} terminated"}


@app.post("/node_handshake")
async def node_handshake(payload: Dict[str, Any]):
    """Register an external hardware node via P2P handshake from Uplink Terminal."""
    node_id = payload.get("node_id", "UNKNOWN-NODE")
    mac_addr = payload.get("mac_addr", "XX:XX:XX:XX")
    with blockchain_lock:
        active_hardware_nodes[node_id] = {
            "status": "Authorized",
            "mac": mac_addr,
            "authorized_at": time.time(),
            "last_sync": time.time(),
        }
    await notify_clients()
    logger.info(f"✅ Node Handshake Complete: {node_id} [{mac_addr}]")
    return {"status": "success", "message": f"Node {node_id} authorized and registered."}



@app.post("/add_block")
async def add_block(payload: Dict[str, Any]):
    """Ingest a new block payload and mine it to the chain."""
    try:
        if not payload or not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="Payload must be a JSON object")

        with blockchain_lock:
            new_data = {
                "temperature": float(payload.get('temperature', 0)),
                "humidity": float(payload.get('humidity', 0)),
                "device_id": str(payload.get('device_id', 'SENSE-NODE-UNKNOWN')),
                "status": payload.get('status', 'secure')
            }
            new_block = blockchain.add_block(new_data)

        if db_instance.collection is not None:
            await db_instance.collection.insert_one(serialize_block(new_block))

        await notify_clients()
        return {"status": "success", "block": serialize_block(new_block)}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Add Block Error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/difficulty")
async def get_difficulty():
    return {"difficulty": blockchain.difficulty}


@app.post("/update_config")
async def update_config(payload: Dict[str, Any]):
    difficulty_value = payload.get('difficulty')
    if difficulty_value is None:
        raise HTTPException(status_code=400, detail='difficulty is required')
    try:
        difficulty_value = int(difficulty_value)
        if not 1 <= difficulty_value <= 5:
            raise ValueError()
    except ValueError:
        raise HTTPException(status_code=400, detail='difficulty must be integer 1-5')

    with blockchain_lock:
        blockchain.difficulty = difficulty_value

    return {"status": "success", "difficulty": blockchain.difficulty}


@app.post("/reset_ledger")
async def reset_ledger():
    with blockchain_lock:
        blockchain.chain = []
        genesis = blockchain.create_genesis_block()
        blockchain.save_chain()

    if db_instance.collection is not None:
        await db_instance.collection.delete_many({})
        await db_instance.collection.insert_one(serialize_block(genesis))

    await notify_clients()
    return {"status": "success", "message": "Ledger reset successfully"}


@app.get("/chain")
async def get_chain():
    return {
        "chain": [serialize_block(b) for b in blockchain.chain],
        "integrity": blockchain.is_chain_valid(),
        "length": len(blockchain.chain),
        "difficulty": blockchain.difficulty,
        "lastUpdated": time.time(),
        "active_nodes": active_hardware_nodes
    }


@app.get("/validate_integrity")
async def validate_integrity():
    valid = blockchain.is_chain_valid()
    return {"status": valid}


@app.get("/system_snapshot")
async def system_snapshot():
    """Full live system snapshot for Sense Brain AI context injection."""
    import datetime
    now = datetime.datetime.now(datetime.timezone.utc)
    chain   = blockchain.chain
    valid   = blockchain.is_chain_valid()
    length  = len(chain)

    # Analytics: averages from last 20 data blocks
    recent  = [b for b in chain if isinstance(b.data, dict)][-20:]
    temps   = [b.data.get('temperature', 0) for b in recent if b.data.get('temperature') is not None]
    hums    = [b.data.get('humidity', 0)    for b in recent if b.data.get('humidity')    is not None]
    avg_temp = round(sum(temps) / len(temps), 2) if temps else None
    avg_hum  = round(sum(hums)  / len(hums),  2) if hums  else None

    # Last 5 blocks summary
    last5 = []
    for b in chain[-5:]:
        bd = b.data if isinstance(b.data, dict) else {}
        last5.append({
            "index":       b.index,
            "hash":        b.hash[:20] + "...",
            "temperature": bd.get('temperature'),
            "humidity":    bd.get('humidity'),
            "device_id":   bd.get('device_id', 'N/A'),
            "status":      bd.get('status', 'N/A'),
        })

    # Node summary
    nodes_summary = [
        {
            "id":     nid,
            "status": info.get("status"),
            "mac":    info.get("mac", "N/A"),
            "last_sync_ago_sec": round(now.timestamp() - info.get("last_sync", now.timestamp())),
        }
        for nid, info in active_hardware_nodes.items()
    ]

    return {
        "timestamp_utc":      now.isoformat(),
        "chain_length":       length,
        "integrity":          "SECURE" if valid else "BREACH DETECTED",
        "difficulty":         blockchain.difficulty,
        "active_nodes":       len(active_hardware_nodes),
        "nodes":              nodes_summary,
        "avg_temperature_c":  avg_temp,
        "avg_humidity_pct":   avg_hum,
        "recent_blocks_count":len(recent),
        "last_5_blocks":      last5,
        "platform":           "SenseChain Neural Infrastructure v12.5",
    }


@app.get("/export_pdf")
def export_pdf():
    """Generate an industry-grade forensic blockchain audit PDF report."""
    try:
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)
        report_id = f"SC-RPT-{int(now.timestamp())}"
        chain_valid = blockchain.is_chain_valid()

        class GovPDF(FPDF):
            def header(self):
                # Top border bar
                self.set_fill_color(13, 71, 161)   # dark blue
                self.rect(0, 0, 210, 8, 'F')
                self.set_fill_color(200, 16, 46)    # red stripe
                self.rect(0, 8, 210, 3, 'F')
                self.ln(16)

            def footer(self):
                self.set_y(-20)
                self.set_fill_color(13, 71, 161)
                self.rect(0, 277, 210, 20, 'F')
                self.set_font('Arial', 'I', 7)
                self.set_text_color(200, 220, 255)
                self.cell(0, 5,
                    f'CLASSIFICATION: INTERNAL • REPORT ID: {report_id} • GENERATED: {now.strftime("%Y-%m-%d %H:%M:%S UTC")}',
                    ln=True, align='C')
                self.cell(0, 5,
                    'SenseChain Neural Infrastructure Division · blockchain@sensechain.io · DO NOT DISTRIBUTE',
                    ln=True, align='C')

        pdf = GovPDF()
        pdf.set_auto_page_break(auto=True, margin=25)
        pdf.add_page()

        # ── LETTERHEAD ──
        pdf.set_font('Arial', 'B', 9)
        pdf.set_text_color(13, 71, 161)
        pdf.cell(0, 5, 'SENSECHAIN NEURAL INFRASTRUCTURE DIVISION', ln=True, align='C')
        pdf.set_font('Arial', '', 7)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 4, 'Blockchain IoT Security Network · Officially Issued Document', ln=True, align='C')
        pdf.ln(4)

        # Red classification stripe
        pdf.set_fill_color(200, 16, 46)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font('Arial', 'B', 8)
        pdf.cell(0, 7, '  OFFICIAL · FORENSIC AUDIT REPORT · CONFIDENTIAL', ln=True, align='C', fill=True)
        pdf.ln(3)

        # ── REPORT TITLE ──
        pdf.set_text_color(13, 71, 161)
        pdf.set_font('Arial', 'B', 20)
        pdf.cell(0, 12, 'BLOCKCHAIN FORENSIC', ln=True, align='C')
        pdf.set_font('Arial', 'B', 18)
        pdf.cell(0, 10, 'INTEGRITY AUDIT REPORT', ln=True, align='C')
        pdf.ln(2)

        # ── META TABLE ──
        pdf.set_font('Arial', '', 9)
        pdf.set_text_color(50, 50, 50)
        meta = [
            ('Report Reference:', report_id),
            ('Issued Date:', now.strftime('%d %B %Y')),
            ('Issued Time (UTC):', now.strftime('%H:%M:%S')),
            ('Network Status:', 'SECURE — All Hashes Verified' if chain_valid else 'BREACH DETECTED — Chain Compromised'),
            ('Total Blocks Audited:', str(len(blockchain.chain))),
            ('Proof-of-Work Algorithm:', f'SHA-256 (Difficulty: {blockchain.difficulty})'),
            ('Issued By:', 'SenseChain Neural Audit Engine v12.5'),
        ]
        for label, val in meta:
            pdf.set_font('Arial', 'B', 8)
            pdf.set_text_color(80, 80, 80)
            pdf.cell(65, 7, label)
            pdf.set_font('Arial', '', 8)
            if 'BREACH' in val:
                pdf.set_text_color(200, 16, 46)
            elif 'SECURE' in val:
                pdf.set_text_color(0, 120, 60)
            else:
                pdf.set_text_color(30, 30, 30)
            pdf.cell(0, 7, val, ln=True)
        pdf.ln(4)

        # ── INTEGRITY VERDICT BOX ──
        if chain_valid:
            pdf.set_fill_color(220, 255, 230)
            pdf.set_draw_color(0, 120, 60)
            pdf.set_text_color(0, 100, 50)
            verdict = '✓  CRYPTOGRAPHIC VERIFICATION: PASSED — All Hash Linkages Valid'
        else:
            pdf.set_fill_color(255, 230, 230)
            pdf.set_draw_color(200, 16, 46)
            pdf.set_text_color(180, 0, 0)
            verdict = '✗  BREACH ALERT: SHA-256 Hash Inconsistency Detected in Ledger'
        pdf.set_font('Arial', 'B', 9)
        pdf.set_line_width(0.5)
        pdf.rect(15, pdf.get_y(), 180, 10, 'FD')
        pdf.set_xy(17, pdf.get_y() + 1.5)
        pdf.cell(176, 7, verdict, ln=True)
        pdf.ln(6)

        # ── BLOCK LEDGER TABLE ──
        pdf.set_font('Arial', 'B', 10)
        pdf.set_text_color(13, 71, 161)
        pdf.cell(0, 8, 'LEDGER TRANSACTION LOG', ln=True)
        pdf.set_line_width(0.3)
        pdf.set_draw_color(13, 71, 161)
        pdf.line(15, pdf.get_y(), 195, pdf.get_y())
        pdf.ln(3)

        # Table header
        headers = ['Block#', 'Timestamp (UTC)', 'Temp (°C)', 'Humidity (%)', 'Nonce', 'Hash (Truncated)', 'Status']
        col_w =   [15,        42,                18,           18,             16,      64,                  17]
        pdf.set_fill_color(13, 71, 161)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font('Arial', 'B', 7)
        for h, w in zip(headers, col_w):
            pdf.cell(w, 8, h, border=0, align='C', fill=True)
        pdf.ln()

        # Table rows
        for i, b in enumerate(blockchain.chain):
            bd = b.data if isinstance(b.data, dict) else {}
            temp = bd.get('temperature', '--')
            hum  = bd.get('humidity', '--')
            ts = datetime.datetime.fromtimestamp(
                float(b.timestamp) if float(b.timestamp) > 1e10
                else float(b.timestamp), tz=datetime.timezone.utc
            ).strftime('%Y-%m-%d %H:%M:%S')

            # Verify hash linkage
            ok = True
            if i > 0:
                prev = blockchain.chain[i-1]
                ok = (b.previous_hash == prev.hash)

            # Alternating row colors
            if i % 2 == 0:
                pdf.set_fill_color(245, 247, 255)
            else:
                pdf.set_fill_color(255, 255, 255)

            pdf.set_text_color(30, 30, 30)
            pdf.set_font('Arial', '', 6.5)
            row = [
                f'#{b.index}',
                ts,
                str(temp) if temp != '--' else '--',
                str(hum) if hum != '--' else '--',
                str(b.nonce),
                str(b.hash)[:30] + '...',
                'VALID' if ok else 'BREACH',
            ]
            for val, w in zip(row, col_w):
                if val in ('BREACH', 'VALID'):
                    if val == 'BREACH':
                        pdf.set_text_color(200, 16, 46)
                    else:
                        pdf.set_text_color(0, 120, 60)
                    pdf.set_font('Arial', 'B', 6.5)
                    pdf.cell(w, 7, val, border=0, align='C', fill=True)
                    pdf.set_text_color(30, 30, 30)
                    pdf.set_font('Arial', '', 6.5)
                else:
                    pdf.cell(w, 7, val, border=0, align='C', fill=True)
            pdf.ln()
        pdf.ln(6)

        # ── SIGNATURE BLOCK ──
        pdf.set_font('Arial', 'B', 9)
        pdf.set_text_color(13, 71, 161)
        pdf.cell(0, 7, 'AUDIT VERIFICATION SIGNATURE', ln=True)
        pdf.set_draw_color(13, 71, 161)
        pdf.set_line_width(0.3)
        pdf.line(15, pdf.get_y(), 195, pdf.get_y())
        pdf.ln(4)
        pdf.set_font('Arial', '', 8)
        pdf.set_text_color(60, 60, 60)
        sig_lines = [
            f'This document was automatically generated by the SenseChain Neural Audit Engine on {now.strftime("%d %B %Y at %H:%M:%S UTC")}.',
            f'Report uniquely identified as: {report_id}',
            'Cryptographic verification performed using SHA-256 hash linkage analysis.',
            'This document constitutes an official forensic record and should be retained for compliance purposes.',
            'Unauthorized alteration of this document voids its forensic validity.',
        ]
        for line in sig_lines:
            pdf.cell(0, 5, line, ln=True)
        pdf.ln(4)

        # Signature lines
        for label in ['Lead Auditor Signature', 'System Controller', 'Date of Issue']:
            pdf.set_font('Arial', '', 8)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(60, 5, '_' * 28)
            pdf.cell(5)
            pdf.cell(60, 5, label)
            pdf.ln(8)

        # Output
        filename = f"SenseChain_ForensicAudit_{now.strftime('%Y%m%d_%H%M%S')}.pdf"
        out = io.BytesIO(pdf.output(dest='S').encode('latin-1'))
        return StreamingResponse(
            out,
            media_type='application/pdf',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )
    except Exception as e:
        logger.error(f"Export PDF Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/export_report")
def export_report():
    """Generate an industry-grade forensic CSV audit report."""
    try:
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)
        report_id = f"SC-RPT-{int(now.timestamp())}"
        chain_valid = blockchain.is_chain_valid()

        output = io.StringIO()

        # ── DOCUMENT HEADER (metadata comment block) ──
        output.write('# ================================================================\n')
        output.write('# SENSECHAIN NEURAL INFRASTRUCTURE DIVISION\n')
        output.write('# OFFICIAL BLOCKCHAIN FORENSIC AUDIT REPORT\n')
        output.write('# CLASSIFICATION: INTERNAL / RESTRICTED\n')
        output.write('# ================================================================\n')
        output.write(f'# REPORT ID:        {report_id}\n')
        output.write(f'# ISSUED DATE:       {now.strftime("%d %B %Y")}\n')
        output.write(f'# ISSUED TIME (UTC): {now.strftime("%H:%M:%S")}\n')
        output.write(f'# TOTAL BLOCKS:      {len(blockchain.chain)}\n')
        output.write(f'# DIFFICULTY:        {blockchain.difficulty} (SHA-256 PoW)\n')
        output.write(f'# INTEGRITY STATUS:  {"SECURE - All Hash Linkages Valid" if chain_valid else "BREACH DETECTED - Chain Compromised"}\n')
        output.write(f'# GENERATED BY:      SenseChain Neural Audit Engine v12.5\n')
        output.write('# ================================================================\n')
        output.write('#\n')

        # ── CSV DATA ──
        output.write('block_index,timestamp_unix,datetime_utc,temperature_c,humidity_pct,device_id,nonce,sha256_hash,previous_hash,linkage_valid,anomaly_flag\n')

        for i, b in enumerate(blockchain.chain):
            bd = b.data if isinstance(b.data, dict) else {}
            ts_float = float(b.timestamp)
            if ts_float < 1e12:
                ts_float *= 1000
            dt_utc = datetime.datetime.fromtimestamp(ts_float / 1000, tz=datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

            linkage_ok = True
            if i > 0:
                linkage_ok = (b.previous_hash == blockchain.chain[i-1].hash)

            temp = bd.get('temperature', '')
            hum  = bd.get('humidity', '')
            dev  = bd.get('device_id', 'SENSE-NODE')
            anomaly = 'YES' if (isinstance(temp, (int, float)) and (temp > 50 or temp < -10)) else 'NO'
            if not linkage_ok:
                anomaly = 'YES'

            output.write(
                f'{b.index},{b.timestamp},{dt_utc},{temp},{hum},{dev},{b.nonce},{b.hash},{b.previous_hash},{"PASS" if linkage_ok else "FAIL"},{anomaly}\n'
            )

        output.write('#\n')
        output.write('# END OF OFFICIAL REPORT\n')
        output.write(f'# DOCUMENT REFERENCE: {report_id} | SenseChain Neural Infrastructure Division\n')
        output.write('# This document is auto-generated and constitutes an official forensic record.\n')

        filename = f"SenseChain_ForensicAudit_{now.strftime('%Y%m%d_%H%M%S')}.csv"
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )
    except Exception as e:
        logger.error(f"Export CSV Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))