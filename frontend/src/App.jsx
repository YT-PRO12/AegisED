import { lazy, Suspense, Component } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import ToastProvider from "./context/ToastProvider";
import { useAuth } from "./context/auth";
import AppLayout from "./layouts/AppLayout";
import { Loading, ErrorState } from "./components/UI";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Emergency = lazy(() => import("./pages/Emergency"));
const Patients = lazy(() => import("./pages/Patients"));
const Doctors = lazy(() => import("./pages/Doctors"));
const Beds = lazy(() => import("./pages/Beds"));
const Analytics = lazy(() => import("./pages/Analytics"));
const PatientDetail = lazy(() => import("./pages/PatientDetail"));
const DecisionSupport = lazy(() => import("./pages/DecisionSupport"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const Audit = lazy(() => import("./pages/Audit"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
function Role({ roles, children }) {
  const { can } = useAuth();
  return can(...roles) ? (
    children
  ) : (
    <div className="empty">
      <h1>Access restricted</h1>
      <p>This view is not available to your role.</p>
      <Link to="/dashboard" className="btn">
        Back to overview
      </Link>
    </div>
  );
}
class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <ErrorState
        message="Something went wrong in this view. Reload to recover."
        retry={() => window.location.reload()}
      />
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="emergency" element={<Emergency />} />
                  <Route path="patients" element={<Patients />} />
                  <Route path="patients/:id" element={<PatientDetail />} />
                  <Route path="doctors" element={<Doctors />} />
                  <Route path="beds" element={<Beds />} />
                  <Route
                    path="analytics"
                    element={
                      <Role roles={["ADMIN", "NURSE"]}>
                        <Analytics />
                      </Role>
                    }
                  />
                  <Route
                    path="decision-support"
                    element={
                      <Role roles={["ADMIN", "DOCTOR", "NURSE"]}>
                        <DecisionSupport />
                      </Role>
                    }
                  />
                  <Route path="knowledge" element={<Knowledge />} />
                  <Route
                    path="audit"
                    element={
                      <Role roles={["ADMIN"]}>
                        <Audit />
                      </Role>
                    }
                  />
                  <Route path="settings" element={<Settings />} />
                  <Route
                    path="*"
                    element={
                      <div className="empty">
                        <h1>Page not found</h1>
                        <Link to="/dashboard">Back to overview</Link>
                      </div>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
