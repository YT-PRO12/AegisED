export default function StatusBadge({ status }) {
  const tone =
    {
      Critical: "red",
      Urgent: "amber",
      Stable: "green",
      Waiting: "amber",
      Assigned: "blue",
      "In Treatment": "teal",
      Completed: "purple",
      Discharged: "muted",
      Available: "green",
      Busy: "amber",
      Occupied: "blue",
      Cleaning: "amber",
      "Off Duty": "muted",
      PENDING: "amber",
      ACCEPT: "green",
      OVERRIDE: "purple",
      REVIEW: "blue",
    }[status] || "muted";
  return (
    <span className={`badge badge-${tone}`}>
      <i />
      {status}
    </span>
  );
}
