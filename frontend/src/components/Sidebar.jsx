import { NavLink } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Users,
  Stethoscope,
  BedDouble,
  ChartNoAxesCombined,
  BrainCircuit,
  BookOpen,
  ShieldCheck,
  Settings,
  HeartPulse,
  X,
} from "lucide-react";
import { useAuth } from "../context/auth";
export default function Sidebar({ open, onClose }) {
  const { can } = useAuth();
  const groups = [
    [
      "WORKSPACE",
      [
        [LayoutDashboard, "Overview", "/dashboard"],
        [Activity, "Emergency operations", "/emergency"],
        [Users, "Patients", "/patients"],
        [Stethoscope, "Doctors", "/doctors"],
        [BedDouble, "Beds & capacity", "/beds"],
        ...(can("ADMIN", "NURSE")
          ? [[ChartNoAxesCombined, "Analytics", "/analytics"]]
          : []),
      ],
    ],
    [
      "INTELLIGENCE",
      [
        ...(can("ADMIN", "DOCTOR", "NURSE")
          ? [[BrainCircuit, "Decision support", "/decision-support"]]
          : []),
        [BookOpen, "Knowledge assistant", "/knowledge"],
      ],
    ],
    [
      "ADMINISTRATION",
      [
        ...(can("ADMIN") ? [[ShieldCheck, "Audit trail", "/audit"]] : []),
        [Settings, "Settings", "/settings"],
      ],
    ],
  ];
  return (
    <>
      {open && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <NavLink to="/dashboard" className="brand" onClick={onClose}>
          <span className="brand-icon">
            <HeartPulse size={23} />
          </span>
          <span>
            CareFlow<span className="brand-ai"> AI</span>
            <small>EMERGENCY OPERATIONS</small>
          </span>
        </NavLink>
        <button
          className="mobile-close icon-btn"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="workspace-chip">
          <span className="workspace-dot" />
          <div>
            Demonstration workspace<small>Synthetic patient records</small>
          </div>
        </div>
        <nav>
          {groups.map(([name, links]) => (
            <div className="nav-group" key={name}>
              <p>{name}</p>
              {links.map(([Icon, label, url]) => (
                <NavLink
                  key={url}
                  to={url}
                  onClick={onClose}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <ShieldCheck size={18} />
          <div>
            Human-led care<small>AI supports. You decide.</small>
          </div>
        </div>
      </aside>
    </>
  );
}
