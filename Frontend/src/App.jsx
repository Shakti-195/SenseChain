import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useMemo, Suspense, lazy, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Components
import Header from "./components/Header";
import AIAssistant from "./components/AIAssistant";

// Pages (Original Lazy Imports Kept)
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const OtpVerification = lazy(() => import("./pages/OtpVerification"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Security = lazy(() => import("./pages/Security"));
const Analytics = lazy(() => import("./pages/Analytics"));
const NodeSettings = lazy(() => import("./pages/NodeSettings"));
const About = lazy(() => import("./pages/About"));
const UplinkTerminal = lazy(() => import("./pages/UplinkTerminal"));

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] font-black text-blue-500 uppercase tracking-[0.5em] animate-pulse">
      <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-900/20 rounded-full animate-spin mb-6" />
      Verifying Neural Link...
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppContent() {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  
  const [chainData, setChainData] = useState({
    chain: [],
    integrity: true,
    length: 0,
    lastUpdated: Date.now(), 
    connError: null,
    activeNodes: {} 
  });

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  useEffect(() => {
    // Only connect if user is logged in
    if (!isAuthenticated || !token) {
      if (ws.current) ws.current.close();
      return;
    }

    const connectWS = () => {
      // ✅ SMART PRODUCTION DETECTION (Fixed for Vercel/Render)
      const isProd = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
      
      const envWS = import.meta.env.VITE_WS_URL;
      const renderWS = "wss://sensechain.onrender.com/ws";
      const localWS = "ws://127.0.0.1:8000/ws";

      // Final URL logic: Env variable first, then Smart Switch
      const socketUrl = envWS || (isProd ? renderWS : localWS);

      console.log(`📡 Attempting WebSocket Link: ${socketUrl}`);
      
      const socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        const color = isProd ? "#10b981" : "#3b82f6";
        console.log(`%c📡 NEURAL LINK ESTABLISHED [${isProd ? 'CLOUD' : 'LOCAL'}]`, `color: ${color}; font-weight: bold;`);
        setChainData(prev => ({ ...prev, connError: null }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "UPDATE") {
            setChainData({
              chain: data.chain || [],
              integrity: data.integrity,
              length: data.length || 0,
              lastUpdated: Date.now(), 
              connError: null,
              activeNodes: data.active_nodes || {}
            });
          }
        } catch (err) {
          console.error("❌ Sync Error:", err);
        }
      };

      socket.onclose = (e) => {
        // Only attempt reconnect if still authenticated to prevent memory leaks
        if (isAuthenticated) {
          console.warn(`📡 Neural Link Severed: ${e.reason || 'Backend node sleeping'}. Re-connecting...`);
          setChainData(prev => ({ ...prev, connError: "Node Offline", lastUpdated: Date.now() }));
          
          // Clear any existing timeout before setting a new one
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(() => connectWS(), 5000); 
        }
      };

      socket.onerror = (err) => {
        console.error("📡 WebSocket Link Failure.");
        socket.close();
      };

      ws.current = socket;
    };

    connectWS();

    // Cleanup logic
    return () => { 
      if (ws.current) ws.current.close(); 
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [isAuthenticated, token]);

  const sharedProps = useMemo(() => ({
    chain: chainData.chain,
    integrity: chainData.integrity,
    lastUpdated: chainData.lastUpdated, 
    connError: chainData.connError,
    chainHeight: chainData.length,
    activeNodes: chainData.activeNodes,
    refreshData: () => console.log("System Auto-Sync Active") 
  }), [chainData]);

  if (authLoading) return null;

  if (!isAuthenticated) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F8FAFC] dark:bg-[#020617] overflow-hidden font-sans antialiased text-slate-900 transition-colors duration-500 hud-grid hud-scanline">
      <Header {...sharedProps} title="SenseChain Hub" />
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <main className="flex-1 overflow-y-auto relative custom-scrollbar bg-transparent">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-full p-20 animate-pulse">
              <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"/>
              <p className="font-black text-slate-400 uppercase tracking-widest italic text-[10px]">Synchronizing Terminal...</p>
            </div>
          }>
            <Routes>
              <Route path="/" element={<PrivateRoute><Dashboard {...sharedProps} /></PrivateRoute>} />
              <Route path="/provisioning" element={<PrivateRoute><UplinkTerminal {...sharedProps} /></PrivateRoute>} />
              <Route path="/security" element={<PrivateRoute><Security {...sharedProps} /></PrivateRoute>} />
              <Route path="/analytics" element={<PrivateRoute><Analytics {...sharedProps} /></PrivateRoute>} />
              <Route path="/node-settings" element={<PrivateRoute><NodeSettings {...sharedProps} /></PrivateRoute>} />
              <Route path="/about" element={<PrivateRoute><About {...sharedProps} /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {/* Passing numeric timestamp to Assistant too if needed */}
      <AIAssistant {...sharedProps} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}