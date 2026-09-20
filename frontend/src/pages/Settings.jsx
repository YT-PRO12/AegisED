import { useState } from "react";
import { Plus, LockKeyhole, UserRound } from "lucide-react";
import { useAuth } from "../context/auth";
import { useToast } from "../context/toast";
import useResource from "../hooks/useResource";
import { request } from "../services/api";
import { PageHeader, Panel, DataState, Field, Modal } from "../components/UI";
function UserAdmin() {
  const users = useResource("/users"),
    doctors = useResource("/doctors?limit=100");
  const [open, setOpen] = useState(false),
    [role, setRole] = useState("NURSE"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const toast = useToast();
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await request("/users", {
        method: "POST",
        body: {
          name: f.get("name"),
          email: f.get("email"),
          password: f.get("password"),
          role,
          ...(role === "DOCTOR" ? { doctorId: +f.get("doctorId") } : {}),
        },
      });
      setOpen(false);
      users.refresh();
      toast("Staff account created");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title="Staff accounts"
      description="Accounts and their assigned roles"
      action={
        <button
          className="btn"
          onClick={() => {
            setError("");
            setOpen(true);
          }}
        >
          <Plus size={16} />
          Create account
        </button>
      }
    >
      <DataState resource={users}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Linked doctor</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.doctor_id || "â€”"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
      {open && (
        <Modal title="Create staff account" onClose={() => setOpen(false)}>
          <form className="form-body" onSubmit={create}>
            <Field label="Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field
              label="Initial password (12+ characters)"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
            <Field label="Role">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {["NURSE", "DOCTOR", "RECEPTION", "ADMIN"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            {role === "DOCTOR" && (
              <Field label="Linked doctor">
                <select name="doctorId" required defaultValue="">
                  <option value="" disabled>
                    Choose a doctor
                  </option>
                  {doctors.data?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                className="btn"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button className="btn primary" disabled={busy}>
                Create account
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Panel>
  );
}
export default function Settings() {
  const { user, can } = useAuth();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const toast = useToast();
  async function change(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await request("/auth/password", {
        method: "POST",
        body: {
          currentPassword: f.get("current"),
          newPassword: f.get("password"),
        },
      });
      toast("Password changed. Sign in again.");
      window.dispatchEvent(new Event("AegisED:expired"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your account, access, and workspace."
      />
      <div className="two-columns">
        <Panel title="Your profile" action={<UserRound size={19} />}>
          <div className="detail-pairs">
            <div>
              <span>Name</span>
              <strong>{user.name}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{user.email}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{user.role}</strong>
            </div>
            <div>
              <span>Workspace</span>
              <strong>Educational prototype</strong>
            </div>
          </div>
        </Panel>
        <Panel
          title="Change password"
          description="Changing your password signs out all sessions."
          action={<LockKeyhole size={19} />}
        >
          <form className="form-body" onSubmit={change}>
            <Field
              label="Current password"
              name="current"
              type="password"
              autoComplete="current-password"
              required
            />
            <Field
              label="New password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn primary" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        </Panel>
      </div>
      {can("ADMIN") && <UserAdmin />}
    </>
  );
}

