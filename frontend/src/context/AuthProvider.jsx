import { useState, useEffect } from "react";
import { AuthContext } from "./auth";
import { request, setCsrf } from "../services/api";
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    request("/auth/me")
      .then((r) => {
        if (active) {
          setUser(r.data.user);
          setCsrf(r.data.csrfToken);
        }
      })
      .catch((e) => {
        if (active && e.status !== 401) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const expired = () => {
      setUser(null);
      setCsrf("");
    };
    window.addEventListener("AegisED:expired", expired);
    return () => {
      active = false;
      window.removeEventListener("AegisED:expired", expired);
    };
  }, []);
  async function login(email, password) {
    const r = await request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setCsrf(r.data.csrfToken);
    setUser(r.data.user);
    setError("");
  }
  async function logout() {
    await request("/auth/logout", { method: "POST" });
    setCsrf("");
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        can: (...roles) => roles.includes(user?.role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

