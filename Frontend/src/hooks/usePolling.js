import { useEffect, useRef } from "react";

/**
 * Custom Hook: usePolling
 * A high-performance, visibility-aware interval hook for real-time data syncing.
 */
const usePolling = (callback, delay = 10000) => {
  const savedCallback = useRef();

  // ✅ Always keep the latest version of the callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // ✅ Set up the interval with Visibility API support
  useEffect(() => {
    // Guard: Exit if delay is null or false
    if (delay === null || delay === false) return;

    const tick = () => {
      // Only execute if the tab is currently active
      if (document.hidden) return;
      
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    // 1. Initial execution (Fetch data immediately on mount/update)
    tick();

    // 2. Setup the recursive interval
    const id = setInterval(tick, delay);

    // 3. Global Visibility Listener: 
    // Instantly trigger a refresh when the user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        tick();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 4. Clean up: Clear interval and remove listeners to prevent memory leaks
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [delay]); // Re-run only if the polling frequency changes
};

export default usePolling;