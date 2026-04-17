import { createContext, useContext, useState, useCallback } from 'react';

const BreachContext = createContext({
  virtualBreach: false,
  breachedBlock: null,
  setVirtualBreach: () => {},
  clearBreach: () => {},
});

export const BreachProvider = ({ children }) => {
  const [virtualBreach, setVirtualBreachState] = useState(false);
  const [breachedBlock, setBreachedBlock]       = useState(null);

  const setVirtualBreach = useCallback((active, blockIdx = null) => {
    setVirtualBreachState(active);
    setBreachedBlock(active ? blockIdx : null);
  }, []);

  const clearBreach = useCallback(() => {
    setVirtualBreachState(false);
    setBreachedBlock(null);
  }, []);

  return (
    <BreachContext.Provider value={{ virtualBreach, breachedBlock, setVirtualBreach, clearBreach }}>
      {children}
    </BreachContext.Provider>
  );
};

export const useBreach = () => useContext(BreachContext);
