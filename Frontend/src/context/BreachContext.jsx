import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { soundManager } from '../utils/soundManager';

const BreachContext = createContext(null);

// ── REALISTIC HARDWARE LOG GENERATOR ──
const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const fmtNow = () =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: LOCAL_TZ,
  }).format(new Date());

const BLOCK_LOG_POOL = [
  (n, idx) => `[MINE]   SHA-256 PoW solved · Nonce: ${Math.floor(Math.random()*999999)} · Block #${idx}`,
  (n, idx) => `[INGEST] Block #${idx} sealed by ${n.id.split('-')[0]}`,
  (n, idx) => `[BCAST]  ${n.id} → Broadcasting Block #${idx} to peer mesh`,
  (n, idx) => `[LEDGER] Block #${idx} written to distributed ledger ✓`,
  (n)      => `[TEMP]   ${n.id}: ${n.lastTemp?.toFixed(1)}°C | ${n.lastHum?.toFixed(1)}% RH`,
  (n)      => `[NET]    ${n.id} RSSI: ${n.rssi} · Latency: ${(Math.random()*0.5+0.05).toFixed(3)}ms`,
  (n, idx) => `[HASH]   SHA-256: ${Array.from({length:8},()=>Math.floor(Math.random()*16).toString(16)).join('')}... sealed`,
  (n)      => `[SYNC]   Merkle root verified · Peer acks from ${Math.ceil(Math.random()*3)+1} validators`,
  (n)      => `[TLS]    AES-256 session key rotated for ${n.id}`,
  (n)      => `[AUTH]   HMAC-SHA256 packet signature valid · ${n.id}`,
];

// ── MAKE REALISTIC BLOCK ──
let _globalBlockCounter = 0;
const makeNodeBlock = (node) => {
  _globalBlockCounter++;
  const temp = parseFloat((Math.max(18, Math.min(42, node.lastTemp + (Math.random()-0.5)*0.8))).toFixed(1));
  const hum  = parseFloat((Math.max(30, Math.min(80, node.lastHum  + (Math.random()-0.5)*1.2))).toFixed(1));
  return {
    index: _globalBlockCounter,
    nonce: Math.floor(Math.random() * 999999),
    hash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random()*16).toString(16)).join(''),
    timestamp: Date.now(),
    data: { temperature: temp, humidity: hum, node_id: node.id, virtual: true },
    _virtual: true,
    _nodeId: node.id,
    _temp: temp,
    _hum: hum,
  };
};

export const BreachProvider = ({ children }) => {
  // ── BREACH STATE (unchanged API) ──
  const [virtualBreach, setVirtualBreachState] = useState(false);
  const [breachedBlock, setBreachedBlock]       = useState(null);

  const setVirtualBreach = useCallback((active, blockIdx = null) => {
    setVirtualBreachState(active);
    setBreachedBlock(active ? blockIdx : null);
    if (active) {
      soundManager.startAlarm();  // continuous breach alarm
    }
  }, []);

  const clearBreach = useCallback(() => {
    setVirtualBreachState(false);
    setBreachedBlock(null);
    soundManager.repaired();    // triumphant restore fanfare
  }, []);

  // ── PAIRED NODE STATE ──
  const [pairedNodes, setPairedNodes] = useState([]);
  const [virtualBlocks, setVirtualBlocks] = useState([]);
  const [nodeSimLogs, setNodeSimLogs]     = useState([]);

  // Refs for stable interval access
  const pairedNodesRef  = useRef([]);
  const simIntervalRef  = useRef(null);
  pairedNodesRef.current = pairedNodes;

  // ── ADD A STRUCTURED LOG ENTRY ──
  const addNodeLog = useCallback((nodeId, msg, type = 'info') => {
    setNodeSimLogs(prev => [{
      id: Date.now() + Math.random(),
      time: fmtNow(),
      nodeId,
      msg,
      type,
    }, ...prev].slice(0, 60));
  }, []);

  // ── PAIR A NODE (starts hardware connection sequence) ──
  const pairNode = useCallback((nodeInfo) => {
    const node = {
      id: nodeInfo.id,
      mac: nodeInfo.mac || 'XX:XX:XX:XX:XX',
      type: nodeInfo.type || 'WiFi',
      rssi: nodeInfo.rssi || '-45 dBm',
      freq: nodeInfo.freq || '2.4GHz',
      pairedAt: Date.now(),
      status: 'Connecting',   // Connecting → Handshaking → Syncing → Live
      blocksMined: 0,
      lastTemp: parseFloat((22 + Math.random() * 6).toFixed(1)),
      lastHum:  parseFloat((48 + Math.random() * 12).toFixed(1)),
    };

    setPairedNodes(prev => [...prev.filter(n => n.id !== node.id), node]);

    // Realistic multi-phase hardware connection sequence
    addNodeLog(node.id, `[RADIO]  Acquiring signal · ${node.freq} · ${node.rssi}`, 'warn');

    setTimeout(() => {
      addNodeLog(node.id, `[DHCP]   IP lease obtained · Establishing encrypted tunnel...`, 'info');
      setPairedNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'Handshaking' } : n));
    }, 600);

    setTimeout(() => {
      addNodeLog(node.id, `[PKI]    ECC-256 ephemeral key pair generated`, 'info');
      addNodeLog(node.id, `[AUTH]   Hardware fingerprint verified · MAC: ${node.mac}`, 'info');
    }, 1400);

    setTimeout(() => {
      addNodeLog(node.id, `[SYNC]   Block headers syncing from genesis block #0...`, 'warn');
      setPairedNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'Syncing' } : n));
    }, 2200);

    setTimeout(() => {
      addNodeLog(node.id, `[READY]  ✓ ${node.id} is LIVE on SenseChain neural mesh`, 'success');
      addNodeLog(node.id, `[MINE]   Proof-of-Work engine started · Difficulty = 4`, 'success');
      setPairedNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: 'Live' } : n));
      soundManager.nodeConnected();  // 🟢 node is now live
    }, 3400);
  }, [addNodeLog]);

  // ── UNPAIR A NODE ──
  const unpairNode = useCallback((nodeId) => {
    addNodeLog(nodeId, `[DISC]   ${nodeId} gracefully disconnected from mesh`, 'warn');
    setPairedNodes(prev => prev.filter(n => n.id !== nodeId));
    soundManager.nodeDisconnected();  // 🔌 node removed
  }, [addNodeLog]);

  // ── GLOBAL SIMULATION INTERVAL (persists across page navigations) ──
  const liveCount = pairedNodes.filter(n => n.status === 'Live').length;

  useEffect(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    if (liveCount === 0) return;

    simIntervalRef.current = setInterval(() => {
      const live = pairedNodesRef.current.filter(n => n.status === 'Live');
      if (live.length === 0) return;

      // Round-robin: pick next node
      const node = live[_globalBlockCounter % live.length];

      // Update sensor state with realistic drift
      const newTemp = parseFloat((Math.max(18, Math.min(42, node.lastTemp + (Math.random()-0.5)*0.7))).toFixed(1));
      const newHum  = parseFloat((Math.max(30, Math.min(80, node.lastHum  + (Math.random()-0.5)*1.1))).toFixed(1));

      // Update node state
      setPairedNodes(prev => prev.map(n =>
        n.id === node.id
          ? { ...n, blocksMined: n.blocksMined + 1, lastTemp: newTemp, lastHum: newHum }
          : n
      ));

      // Generate block using updated sensor values
      const updatedNode = { ...node, lastTemp: newTemp, lastHum: newHum };
      const block = makeNodeBlock(updatedNode);
      setVirtualBlocks(prev => [...prev.slice(-99), block]);

      // ⛏ Block mined sound — play every 5th block to avoid spam
      if (_globalBlockCounter % 5 === 0) soundManager.blockMined();

      // Generate realistic log entry
      const logFn = BLOCK_LOG_POOL[Math.floor(Math.random() * BLOCK_LOG_POOL.length)];
      addNodeLog(node.id, logFn(updatedNode, block.index), 'info');
    }, 2000);

    return () => clearInterval(simIntervalRef.current);
  }, [liveCount, addNodeLog]); // restarts only when live node count changes

  // ── DERIVED VALUES (backward compat with Security page) ──
  const isSimulating  = liveCount > 0;
  const simBlockCount = virtualBlocks.length;
  const simNodeId     = pairedNodes.filter(n => n.status === 'Live').map(n => n.id).join(', ') || 'SENSE-NODE-01';

  // Legacy setSimState/clearSim (no-ops now, kept for backward compat)
  const setSimState = useCallback(() => {}, []);
  const clearSim    = useCallback(() => {}, []);

  return (
    <BreachContext.Provider value={{
      // Breach
      virtualBreach, breachedBlock, setVirtualBreach, clearBreach,
      // Simulation nodes
      pairedNodes, pairNode, unpairNode,
      // Live data streams
      virtualBlocks, nodeSimLogs,
      // Derived / legacy
      isSimulating, simBlockCount, simNodeId,
      setSimState, clearSim,
    }}>
      {children}
    </BreachContext.Provider>
  );
};

export const useBreach = () => useContext(BreachContext);
