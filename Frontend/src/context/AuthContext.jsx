import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState({ email: null, name: null });
  const [loading, setLoading] = useState(true);

  // ✅ INITIALIZE AUTH: Rehydrates state from storage
  useEffect(() => {
    const storedToken = localStorage.getItem("sense_token");
    const email = localStorage.getItem("user_email");
    const name = localStorage.getItem("user_name");

    if (storedToken) {
      setToken(storedToken);
      setUser({ email, name });
    }

    // Small timeout to prevent layout shift during re-auth
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // ✅ LOGIN: Persistence + State Update
  const login = useCallback((newToken, email) => {
    if (!newToken) return;

    const derivedName = email
      ? email.split("@")[0].toUpperCase()
      : "AGENT_SENSE";

    localStorage.setItem("sense_token", newToken);
    localStorage.setItem("user_email", email);
    localStorage.setItem("user_name", derivedName);

    setToken(newToken);
    setUser({ email, name: derivedName });
  }, []);

  // ✅ LOGOUT: Global Cleanup
  const logout = useCallback(() => {
    // Clear all forensic data
    localStorage.removeItem("sense_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    
    setToken(null);
    setUser({ email: null, name: null });

    // Force redirect to login to clear all memory states
    window.location.replace("/login");
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
      {children}
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