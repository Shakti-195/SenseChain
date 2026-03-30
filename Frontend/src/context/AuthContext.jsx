import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState({ email: null, name: null });
  const [loading, setLoading] = useState(true);

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
  }, []);

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

  // ✅ LOGOUT: Global Cleanup
  const logout = useCallback(() => {
    // Clear all forensic data
    localStorage.clear(); // 👈 Professional way to wipe everything
    
    setToken(null);
    setUser({ email: null, name: null });

    // window.location.replace uses a hard reload to clear React state memory
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