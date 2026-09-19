import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { ToastContext } from "./toast";
export default function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <ToastContext.Provider value={setMessage}>
      {children}
      {message && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {message}
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
