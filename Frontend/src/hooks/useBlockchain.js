import { useState, useCallback, useRef, useEffect } from "react";
import API from "../services/api";
import usePolling from "./usePolling";

/**
 * Custom Hook: useBlockchain
 * Handles real-time synchronization of the SenseChain ledger and integrity status.
 */
const useBlockchain = (token) => {
  const [chain, setChain] = useState([]);
  const [integrity, setIntegrity] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connError, setConnError] = useState(null);
  
  // Refs to track state without triggering re-renders
  const isFetching = useRef(false);

  const fetchData = useCallback(async () => {
    // 1. Guard: Don't fetch if no token, tab is hidden, or already fetching
    if (!token || document.hidden || isFetching.current) return;

    isFetching.current = true;
    let isMounted = true;

    try {
      // 2. Fetch Blockchain Ledger
      const chainRes = await API.get("/chain");
      const newChain = chainRes.data?.chain || [];

      if (isMounted) {
        setChain(Array.isArray(newChain) ? newChain : []);
        setConnError(null);
        setLastUpdated(new Date());
      }

      // 3. Nested Integrity Check (Independent of Chain Fetch)
      try {
        const integrityRes = await API.get("/validate_integrity");
        const status = integrityRes.data?.status;

        if (isMounted) {
          // Robust status mapping
          const isSecure = 
            status === true || 
            (typeof status === 'string' && 
              ["secure", "healthy", "valid"].includes(status.toLowerCase())
            );
          
          setIntegrity(isSecure);
        }
      } catch (intErr) {
        // If integrity endpoint specifically fails (e.g., 400 Tamper)
        if (isMounted) setIntegrity(false);
      }

    } catch (err) {
      // 4. Handle Node Connectivity Issues
      if (isMounted) {
        setConnError("SenseChain Node Offline");
        // Keep existing chain data visible but marked as stale/error
      }
    } finally {
      isFetching.current = false;
      // Cleanup function to prevent setting state on unmounted components
      return () => { isMounted = false; };
    }
  }, [token]);

  // ✅ SMART POLLING: Triggers every 10 seconds
  usePolling(fetchData, 10000);

  // ✅ MANUAL REFRESH: Exposes the internal fetch with extra logic
  const refreshData = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    chain,
    integrity,
    lastUpdated,
    connError,
    refreshData,
    isScanning: isFetching.current // Useful for UI "Scanning..." indicators
  };
};

export default useBlockchain;