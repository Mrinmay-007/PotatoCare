import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const AuthContext = createContext(null);

function readUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Single source of truth for the logged-in user. Screens used to each re-read
// AsyncStorage on their own (Profile, Diagnose, Logbook).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const login = useCallback((data) => {
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
