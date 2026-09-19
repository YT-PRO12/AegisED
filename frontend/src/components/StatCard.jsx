export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "",
}) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-label">
        <span>{title}</span>
        {Icon && <Icon size={19} />}
      </div>
      <strong>{value ?? "—"}</strong>
      <p>{description}</p>
    </div>
  );
}
