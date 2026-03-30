import { useEffect, useRef } from 'react';

const useWebsocket = (onMessage) => {
  const ws = useRef(null);
  const reconnectTimeout = useRef(null); // 👈 Reconnect logic ko manage karne ke liye

  const connect = () => {
    // ✅ Professional Way: Local ke liye ws aur Production ke liye wss automatic pick karega
    const WS_URL = import.meta.env.VITE_WS_URL || "wss://sensechain.onrender.com/ws";
    
    console.log(`🔌 Attempting to link Node: ${WS_URL}`);
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("📡 SenseChain Cloud WS Linked (Secure)");
    };
    
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (err) {
        console.error("❌ Failed to parse neural data:", err);
      }
    };

    ws.current.onclose = (e) => {
      // Normal closure (1000) par retry nahi karna
      if (e.code !== 1000) {
        console.warn("🔌 Node Disconnected. Re-mining connection in 5s...");
        
        // Purane kisi bhi timeout ko clear karo taaki multiple connections na bane
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 5000); 
      } else {
        console.log("💤 Connection closed normally.");
      }
    };

    ws.current.onerror = (err) => {
      console.error("⚠️ WS Handshake Error:", err);
      // Error par manually close karo taaki onclose wala retry logic trigger ho jaye
      if (ws.current) ws.current.close();
    };
  };

  useEffect(() => {
    connect();

    // Cleanup: Jab component band ho, toh connection aur timeout dono khatam karo
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.close(1000); 
      }
    };
  }, []);

  return ws.current;
};

export default useWebsocket;