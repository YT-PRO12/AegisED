import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "../context/auth";
import { useToast } from "../context/toast";
export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth(),
    toast = useToast(),
    [search, setSearch] = useState("");
  const navigate = useNavigate(),
    location = useLocation();
  const title =
    {
      dashboard: "Overview",
      emergency: "Emergency operations",
      patients: "Patients",
      doctors: "Doctors",
      beds: "Beds & capacity",
      analytics: "Analytics",
      "decision-support": "Decision support",
      knowledge: "Knowledge assistant",
      audit: "Audit trail",
      settings: "Settings",
    }[location.pathname.split("/")[1]] || "Workspace";
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          className="icon-btn menu-button"
          aria-label="Open navigation"
          onClick={onMenu}
        >
          <Menu size={21} />
        </button>
        <span>Workspace</span>
        <ChevronRight size={13} />
        <strong>{title}</strong>
      </div>
      <div className="topbar-right">
        <form
          className="global-search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate("/patients?search=" + encodeURIComponent(search));
          }}
        >
          <Search size={16} />
          <input
            aria-label="Search patients globally"
            placeholder="Find a patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <Link to="/settings" className="user-chip">
          <span className="avatar">
            {user.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span>
            {user.name}
            <small>{user.role.toLowerCase()}</small>
          </span>
        </Link>
        <button
          title="Sign out"
          aria-label="Sign out"
          className="icon-btn"
          onClick={() => logout().catch((e) => toast(e.message))}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
