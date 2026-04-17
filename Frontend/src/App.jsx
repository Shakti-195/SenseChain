import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useMemo, Suspense, lazy, useEffect, useRef, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BreachProvider } from "./context/BreachContext";
import API from "./services/api";
import { playSecurityBreachAlarm } from "./utils/audio";

// Components
import Header from "./components/Header";
import AIAssistant from "./components/AIAssistant";

// Pages
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
const UISettings = lazy(() => import("./pages/UISettings"));

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] font-bold text-slate-400 dark:text-blue-500">
      <div className="w-12 h-12 border-[3px] border-t-blue-600 border-slate-200 dark:border-blue-900 rounded-full animate-spin mb-5" />
      <p className="text-xs uppercase tracking-[0.3em]">Initializing Neural Link...</p>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppContent() {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  
  const [chainData, setChainData] = useState(() => ({
    chain: [],
    integrity: true,
    length: 0,
    lastUpdated: Date.now(), 
    connError: null,
    activeNodes: {} 
  }));

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const fallbackInterval = useRef(null);

  const fetchChain = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("/chain");
      const data = res.data || {};
      setChainData({
        chain: Array.isArray(data.chain) ? data.chain : [],
        integrity: data.integrity ?? true,
        length: data.length ?? (Array.isArray(data.chain) ? data.chain.length : 0),
        lastUpdated: Date.now(),
        connError: null,
        activeNodes: data.active_nodes ?? {}
      });
    } catch (error) {
      setChainData(prev => ({ ...prev, connError: "Node Offline" }));
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      if (fallbackInterval.current) {
        clearInterval(fallbackInterval.current);
        fallbackInterval.current = null;
      }
      return;
    }

    // Initial fallback fetch (for case websocket is blocked/unavailable)
    fetchChain();
    if (fallbackInterval.current) clearInterval(fallbackInterval.current);
    fallbackInterval.current = setInterval(fetchChain, 15000);

    const connectWS = () => {
      const isProd = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
      const renderWS = "wss://sensechain.onrender.com/ws";
      const localWS = "ws://127.0.0.1:8000/ws";
      const socketUrl = import.meta.env.VITE_WS_URL || (isProd ? renderWS : localWS);

      console.log(`📡 Attempting WebSocket Link: ${socketUrl}`);
      const socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        console.log(`%c📡 NEURAL LINK ESTABLISHED [${isProd ? 'CLOUD' : 'LOCAL'}]`, "color: #10b981; font-weight: bold;");
        setChainData(prev => ({ ...prev, connError: null }));
        fetchChain();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "UPDATE") {
            setChainData(prev => {
              if (prev.integrity === true && data.integrity === false) {
                 playSecurityBreachAlarm();
              }
              return {
                chain: data.chain || [],
                integrity: data.integrity,
                length: data.length || 0,
                lastUpdated: Date.now(), 
                connError: null,
                activeNodes: data.active_nodes || {}
              };
            });
          }
        } catch (err) {
          console.error("❌ Sync Error:", err);
        }
      };

      socket.onclose = () => {
        if (isAuthenticated) {
          ws.current = null;
          console.warn(`📡 Neural Link Severed: Re-connecting in 5s...`);
          setChainData(prev => ({ ...prev, connError: "Node Offline" }));
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(() => connectWS(), 5000);
        }
      };

      socket.onerror = () => socket.close();
      ws.current = socket;
    };

    connectWS();

    return () => {
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (fallbackInterval.current) clearInterval(fallbackInterval.current);
    };
  }, [isAuthenticated, token, fetchChain]);

  const sharedProps = useMemo(() => ({
    chain: chainData.chain,
    integrity: chainData.integrity,
    lastUpdated: chainData.lastUpdated, 
    connError: chainData.connError,
    chainHeight: chainData.length,
    activeNodes: chainData.activeNodes,
    refreshData: fetchChain
  }), [chainData, fetchChain]);

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
    <div className="flex flex-col h-screen w-screen bg-transparent overflow-hidden font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
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
              <Route path="/ui-settings" element={<PrivateRoute><UISettings /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <AIAssistant {...sharedProps} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BreachProvider>
        <Router>
          <AppContent />
        </Router>
      </BreachProvider>
    </AuthProvider>
  );
}