import { useEffect, useRef } from 'react';

const useWebsocket = (onMessage) => {
  const ws = useRef(null);

  const connect = () => {
    ws.current = new WebSocket("ws://127.0.0.1:8000/ws");

    ws.current.onopen = () => console.log("📡 SenseChain WS Linked");
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.current.onclose = () => {
      console.log("🔌 WS Disconnected. Retrying in 3s...");
      setTimeout(connect, 3000);
    };

    ws.current.onerror = (err) => {
      console.error("WS Error:", err);
      ws.current.close();
    };
  };

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, []);

  return ws.current;
};

export default useWebsocket;