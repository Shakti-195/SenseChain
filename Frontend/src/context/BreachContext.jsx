import { createContext, useContext, useState, useCallback } from 'react';

const BreachContext = createContext({
  virtualBreach: false,
  breachedBlock: null,
  setVirtualBreach: () => {},
  clearBreach: () => {},
  // Simulation Lab state shared across pages
  isSimulating: false,
  simBlockCount: 0,
  simNodeId: 'SENSE-NODE-01',
  setSimState: () => {},
  clearSim: () => {},
});

export const BreachProvider = ({ children }) => {
  const [virtualBreach, setVirtualBreachState] = useState(false);
  const [breachedBlock, setBreachedBlock]       = useState(null);

  // Shared simulation state
  const [isSimulating, setIsSimulating]   = useState(false);
  const [simBlockCount, setSimBlockCount] = useState(0);
  const [simNodeId, setSimNodeId]         = useState('SENSE-NODE-01');

  const setVirtualBreach = useCallback((active, blockIdx = null) => {
    setVirtualBreachState(active);
    setBreachedBlock(active ? blockIdx : null);
  }, []);

  const clearBreach = useCallback(() => {
    setVirtualBreachState(false);
    setBreachedBlock(null);
  }, []);

  // Called by Dashboard Simulation Lab to sync state globally
  const setSimState = useCallback((simulating, blockCount, nodeId) => {
    setIsSimulating(simulating);
    setSimBlockCount(blockCount);
    if (nodeId !== undefined) setSimNodeId(nodeId);
  }, []);

  const clearSim = useCallback(() => {
    setIsSimulating(false);
    setSimBlockCount(0);
  }, []);

  return (
    <BreachContext.Provider value={{
      virtualBreach, breachedBlock, setVirtualBreach, clearBreach,
      isSimulating, simBlockCount, simNodeId, setSimState, clearSim,
    }}>
      {children}
    </BreachContext.Provider>
  );
};

export const useBreach = () => useContext(BreachContext);
