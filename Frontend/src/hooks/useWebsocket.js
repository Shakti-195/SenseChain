import { useEffect, useRef } from 'react';

const useWebsocket = (onMessage) => {
  const ws = useRef(null);

  const connect = () => {
    // ✅ UPDATED FOR RENDER (wss used for secure connection)
    const WS_URL = "wss://sensechain.onrender.com/ws";
    
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("📡 SenseChain Cloud WS Linked (Secure)");
    };
    
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("Failed to parse WS data:", err);
      }
    };

    ws.current.onclose = (e) => {
      // e.code 1000 means normal closure, don't retry if manually closed
      if (e.code !== 1000) {
        console.log("🔌 WS Disconnected. Retrying in 5s...");
        setTimeout(connect, 5000); // 👈 5s delay for cloud stability
      }
    };

    ws.current.onerror = (err) => {
      console.error("WS Error Details:", err);
      ws.current.close();
    };
  };

  useEffect(() => {
    connect();
    // Cleanup: Close connection when component unmounts
    return () => {
      if (ws.current) {
        ws.current.close(1000); 
      }
    };
  }, []);

  return ws.current;
};

export default useWebsocket;