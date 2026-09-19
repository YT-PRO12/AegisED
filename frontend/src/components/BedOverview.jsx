import { Link } from "react-router-dom";
import { BedDouble } from "lucide-react";
import { Panel } from "./UI";
export default function BedOverview({ beds = [] }) {
  const available = beds.filter((b) => b.status === "Available").length;
  return (
    <Panel
      title="Bed capacity"
      description={`${available} of ${beds.length} beds available`}
      action={
        <Link to="/beds" className="text-link">
          Manage →
        </Link>
      }
    >
      <div className="bed-mini-grid">
        {beds.map((b) => (
          <Link
            key={b.id}
            to="/beds"
            className={`bed-mini ${b.status.toLowerCase()}`}
            title={`${b.bed_number} · ${b.status}`}
            aria-label={`${b.bed_number} ${b.status}`}
          >
            <BedDouble size={21} />
            <span>{b.bed_number}</span>
          </Link>
        ))}
      </div>
      <div className="legend">
        <span>
          <i className="dot green" />
          Available
        </span>
        <span>
          <i className="dot blue" />
          Occupied
        </span>
        <span>
          <i className="dot amber" />
          Cleaning
        </span>
      </div>
    </Panel>
  );
}
