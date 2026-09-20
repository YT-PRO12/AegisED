import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  Activity,
  Users,
} from "lucide-react";
import { useAuth } from "../context/auth";
import { Field, Loading } from "../components/UI";
export default function Login() {
  const { user, login, loading, error: initialError } = useAuth();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (loading) return <Loading />;
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await login(f.get("email"), f.get("password"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-story">
        <div className="brand">
          <span className="brand-icon">
            <HeartPulse />
          </span>
          <span>AegisED</span>
        </div>
        <div className="login-pitch">
          <span className="eyebrow">CLARITY WHEN IT MATTERS</span>
          <h1>
            Every patient.
            <br />
            Every resource.
            <br />
            <em>One clear view.</em>
          </h1>
          <p>
            A connected workspace for emergency operations, thoughtful decision
            support, and accountable care.
          </p>
          <div className="login-features">
            <span>
              <Activity size={19} /> Connected workflows
            </span>
            <span>
              <Users size={19} /> Role-aware access
            </span>
            <span>
              <ShieldCheck size={19} /> Human-led decisions
            </span>
          </div>
        </div>
        <small>PORTFOLIO PROTOTYPE · SYNTHETIC DATA ONLY</small>
      </div>
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <span className="eyebrow">YOUR OPERATIONS WORKSPACE</span>
          <h2>Welcome back.</h2>
          <p>Sign in to your AegisED account.</p>
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@AegisED.demo"
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={1}
            required
          />
          {(error || initialError) && (
            <p className="form-error" role="alert">
              {error || initialError}
            </p>
          )}
          <button className="btn primary full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in to workspace"}
            <ArrowRight size={17} />
          </button>
          <div className="login-note">
            <ShieldCheck size={18} />
            <span>
              Demo accounts are created by the seed command. Your generated
              credentials are in <code>backend/.demo-credentials</code>.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

