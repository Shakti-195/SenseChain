import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState({ email: null, name: null });
  const [loading, setLoading] = useState(true);

  // ✅ LOGOUT: Global Cleanup (Moved up for use in useEffect)
  const logout = useCallback(() => {
    // Clear all forensic data
    localStorage.removeItem("sense_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    
    setToken(null);
    setUser({ email: null, name: null });

    // window.location.replace is good for clearing sensitive state memory
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }, []);

  // ✅ INITIALIZE AUTH: Rehydrates state from storage
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem("sense_token");
      const email = localStorage.getItem("user_email");
      const name = localStorage.getItem("user_name");

      if (storedToken) {
        setToken(storedToken);
        setUser({ email, name });
      }
      setLoading(false);
    };

    initializeAuth();

    // ✅ Tab Sync Logic: Logout in one tab reflects in others
    const handleStorageChange = (e) => {
      if (e.key === "sense_token" && !e.newValue) {
        logout();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [logout]);

  // ✅ LOGIN: Persistence + State Update
  const login = useCallback((newToken, email) => {
    if (!newToken) return;

    // Derived name logic with safety
    const derivedName = email 
      ? email.split("@")[0].toUpperCase() 
      : "AGENT_SENSE";

    localStorage.setItem("sense_token", newToken);
    localStorage.setItem("user_email", email || "");
    localStorage.setItem("user_name", derivedName);

    setToken(newToken);
    setUser({ email, name: derivedName });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {!loading && children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};