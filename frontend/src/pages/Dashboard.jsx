import { Link } from "react-router-dom";
import {
  Users,
  Activity,
  BedDouble,
  Stethoscope,
  Plus,
  RefreshCw,
  ArrowUpRight,
  BrainCircuit,
} from "lucide-react";
import { useAuth } from "../context/auth";
import useResource from "../hooks/useResource";
import { PageHeader, Panel, DataState } from "../components/UI";
import StatCard from "../components/StatCard";
import PatientQueue from "../components/PatientQueue";
import BedOverview from "../components/BedOverview";
import { VolumeChart } from "../components/Charts";
export default function Dashboard() {
  const { can } = useAuth();
  const stats = useResource("/dashboard/stats", 30000),
    queue = useResource(
      "/emergency-cases?status=Waiting&sort=priority&limit=6",
      30000,
    ),
    beds = useResource("/beds?limit=100", 30000),
    analytics = useResource(
      can("ADMIN", "NURSE") ? "/analytics?days=7" : null,
      30000,
    );
  const s = stats.data || {};
  return (
    <>
      <PageHeader
        title="Department overview"
        description="A clearer picture of your department, at a glance."
      >
        <button
          className="btn"
          onClick={() => {
            stats.refresh();
            queue.refresh();
            beds.refresh();
            analytics.refresh();
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
        {can("ADMIN", "NURSE", "RECEPTION") && (
          <Link className="btn primary" to="/emergency?new=1">
            <Plus size={17} />
            New case
          </Link>
        )}
      </PageHeader>
      <div className="context-strip">
        <span>
          <i className="dot green" />
          Database-backed operations
        </span>
        <span>
          Updates every 30 seconds ·{" "}
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <DataState resource={stats}>
        <div className="stats-grid">
          <StatCard
            title="Registered patients"
            value={s.totalPatients}
            description="All patient records"
            icon={Users}
          />
          <StatCard
            title="Active emergencies"
            value={s.emergencyCases}
            description={`${s.waitingPatients ?? 0} waiting for assignment`}
            icon={Activity}
            tone="accent"
          />
          <StatCard
            title="Available beds"
            value={s.availableBeds}
            description="Ready for allocation"
            icon={BedDouble}
          />
          <StatCard
            title="Available doctors"
            value={s.availableDoctors}
            description="Ready for assignment"
            icon={Stethoscope}
          />
        </div>
      </DataState>
      <div className="overview-grid">
        <Panel
          title="Emergency activity"
          description={
            can("ADMIN", "NURSE")
              ? "Arrivals over the last 7 days · UTC"
              : "Current department priority distribution"
          }
          action={
            can("ADMIN", "NURSE") ? (
              <Link className="text-link" to="/analytics">
                Explore analytics <ArrowUpRight size={14} />
              </Link>
            ) : null
          }
        >
          {can("ADMIN", "NURSE") ? (
            <DataState resource={analytics}>
              <VolumeChart data={analytics.data?.trend || []} />
            </DataState>
          ) : (
            <p className="padded muted">
              Aggregate department totals. Your patient lists show only assigned
              cases.
            </p>
          )}
          <div className="priority-strip">
            {[
              ["Critical", s.criticalCases, "red"],
              ["Urgent", s.urgentCases, "amber"],
              ["Stable", s.stableCases, "green"],
            ].map(([label, value, tone]) => (
              <div key={label}>
                <span>
                  <i className={`dot ${tone}`} />
                  {label}
                </span>
                <strong>{value ?? "—"}</strong>
                <small>active cases</small>
              </div>
            ))}
          </div>
        </Panel>
        <DataState resource={beds}>
          <BedOverview beds={beds.data || []} />
        </DataState>
      </div>
      <DataState resource={queue}>
        <PatientQueue patients={queue.data || []} />
      </DataState>
      <div className="insight-banner">
        <div className="insight-icon">
          <BrainCircuit size={26} />
        </div>
        <div>
          <h3>Decision support with a human in the loop</h3>
          <p>
            Explore synthetic priority estimates, see contributing inputs, and
            record your review.
          </p>
        </div>
        <Link
          to={
            can("ADMIN", "DOCTOR", "NURSE") ? "/decision-support" : "/knowledge"
          }
          className="btn"
        >
          Explore intelligence
          <ArrowUpRight size={15} />
        </Link>
      </div>
    </>
  );
}
