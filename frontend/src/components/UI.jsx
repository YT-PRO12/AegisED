import { useEffect, useRef, useId, cloneElement } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  Inbox,
} from "lucide-react";
export function PageHeader({
  eyebrow = "EMERGENCY DEPARTMENT",
  title,
  description,
  children,
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Loading() {
  return (
    <div className="skeleton-grid" aria-label="Loading" role="status">
      {[1, 2, 3].map((i) => (
        <div className="skeleton" key={i} />
      ))}
      <span className="sr-only">Loading records</span>
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={20} />
      <div>
        <strong>We couldn’t load this view</strong>
        <p>{message}</p>
      </div>
      {retry && (
        <button className="btn" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Empty({
  title = "No records found",
  description = "Try another filter or create a new record.",
}) {
  return (
    <div className="empty">
      <Inbox size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="panel-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-btn"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({ label, children, ...props }) {
  const generatedId = useId();
  const id = props.id || generatedId;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children ? cloneElement(children, { id }) : <input {...props} id={id} />}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Search records…",
}) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function Pagination({ pagination, onPage }) {
  if (!pagination) return null;
  return (
    <div className="pagination">
      <span>
        {pagination.total} records · Page {pagination.page} of{" "}
        {Math.max(1, pagination.pages)}
      </span>
      <div>
        <button
          className="icon-btn"
          aria-label="Previous page"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          <ArrowLeft size={17} />
        </button>
        <button
          className="icon-btn"
          aria-label="Next page"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onPage(pagination.page + 1)}
        >
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
export function DataState({ resource, children }) {
  return resource.loading ? (
    <Loading />
  ) : resource.error ? (
    <ErrorState message={resource.error} retry={resource.refresh} />
  ) : (
    children
  );
}
export function SafetyNote() {
  return (
    <div className="safety-note">
      <AlertCircle size={16} />
      <span>
        Educational prototype · Synthetic data only · Human decisions remain
        authoritative
      </span>
    </div>
  );
}
