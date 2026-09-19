import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";
import { Loading, SafetyNote } from "../components/UI";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
export default function AppLayout() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="workspace">
        <Navbar onMenu={() => setOpen(true)} />
        <main id="main-content">
          <Outlet />
          <SafetyNote />
        </main>
      </div>
    </div>
  );
}
