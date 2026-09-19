import { formatDate } from "../utils/format";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BrainCircuit, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/auth";
import { useToast } from "../context/toast";
import useResource from "../hooks/useResource";
import { request } from "../services/api";
import {
  PageHeader,
  Panel,
  Field,
  DataState,
  Modal,
  Empty,
} from "../components/UI";
import StatusBadge from "../components/StatusBadge";
const fields = [
  ["heartRate", "Heart rate", "bpm", 25, 250, 1],
  ["systolicBP", "Systolic blood pressure", "mmHg", 50, 250, 1],
  ["respiratoryRate", "Respiratory rate", "breaths/min", 5, 60, 1],
  ["temperature", "Temperature", "°C", 30, 43, 0.1],
  ["oxygenSaturation", "Oxygen saturation", "%", 50, 100, 0.1],
];
export default function DecisionSupport() {
  const [params] = useSearchParams();
  const [caseId, setCaseId] = useState(params.get("case") || ""),
    [prediction, setPrediction] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [review, setReview] = useState(null);
  const { can } = useAuth(),
    toast = useToast();
  const cases = useResource("/emergency-cases?status=Active&limit=100"),
    history = useResource("/ai/predictions"),
    model = useResource("/ai/model");
  const selected = cases.data?.find((c) => c.id === +caseId),
    result = prediction?.result;
  async function predict(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget),
      vitals = Object.fromEntries(fields.map(([key]) => [key, +f.get(key)]));
    try {
      const r = await request("/ai/predict", {
        method: "POST",
        body: { caseId: +caseId, vitals },
      });
      setPrediction(r.data);
      history.refresh();
      toast("Prediction recorded for human review");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function submitReview(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const r = await request(`/ai/predictions/${prediction.id}/review`, {
        method: "POST",
        body: {
          action: review,
          ...(review === "OVERRIDE"
            ? { priority: f.get("priority"), reason: f.get("reason") }
            : {}),
        },
      });
      setPrediction(r.data);
      setReview(null);
      history.refresh();
      cases.refresh();
      toast("Human review recorded");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="CAREFLOW INTELLIGENCE"
        title="AI decision support"
        description="A transparent suggestion. An accountable human decision."
      />
      <div className="info-box safety">
        <ShieldCheck size={21} />
        <div>
          <strong>Simulation, not clinical triage.</strong>
          <p>
            This model learned invented adult scenarios. Scores are uncalibrated
            and are not medical confidence. Suggestions never change priority
            without review.
          </p>
        </div>
      </div>
      <div className="two-columns ai-columns">
        <Panel
          title="Request a priority estimate"
          description="Select an active adult case and enter synthetic vitals"
        >
          <form className="form-body" onSubmit={predict}>
            <DataState resource={cases}>
              <Field label="Emergency case">
                <select
                  value={caseId}
                  onChange={(e) => {
                    setCaseId(e.target.value);
                    setPrediction(null);
                    setError("");
                  }}
                  required
                >
                  <option value="">Select an active case</option>
                  {cases.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.patient_name} · Case #{c.id} · {c.patient_age} years
                    </option>
                  ))}
                </select>
              </Field>
            </DataState>
            <div className="form-grid" key={caseId}>
              {fields.map(([key, label, unit, min, max, step]) => (
                <Field
                  key={key}
                  label={`${label} · ${unit}`}
                  name={key}
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  required
                  defaultValue={selected?.vitals?.[key] ?? ""}
                />
              ))}
            </div>
            {selected &&
              (selected.patient_age < 18 || selected.patient_age > 89) && (
                <p className="form-error">
                  This model supports ages 18–89 only.
                </p>
              )}
            {error && !review && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="btn primary"
              disabled={
                busy ||
                !caseId ||
                selected?.patient_age < 18 ||
                selected?.patient_age > 89
              }
            >
              <BrainCircuit size={17} />
              {busy ? "Evaluating…" : "Generate estimate"}
              <ArrowRight size={16} />
            </button>
          </form>
        </Panel>
        <Panel
          title="Estimate & review"
          description="Model output is saved before any human action"
        >
          {result ? (
            <div className="prediction-body">
              <div className="spread">
                <span>Suggested priority</span>
                <StatusBadge status={prediction.human_action} />
              </div>
              <h2 className="prediction-title">{result.predictedPriority}</h2>
              <p className="muted">
                {result.modelType.replaceAll("_", " ")} · {result.modelVersion}
              </p>
              <div className="score-list">
                {Object.entries(result.classScores).map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <div className="progress-track">
                      <div style={{ width: `${value * 100}%` }} />
                    </div>
                    <strong>{value.toFixed(3)}</strong>
                  </div>
                ))}
              </div>
              <small>Uncalibrated class scores, not clinical confidence.</small>
              <h3>Input sensitivity</h3>
              <p className="muted">
                Score change when one input is replaced with its training
                median. This is not a causal explanation.
              </p>
              <div className="sensitivity">
                {result.factors.slice(0, 3).map((f) => (
                  <div key={f.feature}>
                    <span>
                      {fields.find((v) => v[0] === f.feature)?.[1] || f.feature}
                    </span>
                    <strong>
                      {f.scoreDelta >= 0 ? "+" : ""}
                      {f.scoreDelta.toFixed(3)}
                    </strong>
                  </div>
                ))}
              </div>
              <p className="footnote">
                Recorded {formatDate(prediction.created_at)}
              </p>
              {can("ADMIN", "DOCTOR") &&
                prediction.human_action === "PENDING" && (
                  <div className="review-actions">
                    <button
                      className="btn primary"
                      onClick={() => {
                        setError("");
                        setReview("ACCEPT");
                      }}
                    >
                      <Check size={16} />
                      Accept suggestion
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setError("");
                        setReview("OVERRIDE");
                      }}
                    >
                      Override priority
                    </button>
                    <button
                      className="text-link"
                      onClick={() => {
                        setError("");
                        setReview("REVIEW");
                      }}
                    >
                      Mark reviewed
                    </button>
                  </div>
                )}
              {prediction.override_reason && (
                <p>Override reason: {prediction.override_reason}</p>
              )}
            </div>
          ) : (
            <div className="prediction-empty">
              <BrainCircuit size={45} />
              <h3>Ready when you are</h3>
              <p>
                Generate an estimate to inspect its inputs, model scores, and
                review options.
              </p>
            </div>
          )}
        </Panel>
      </div>
      <Panel
        title="Model evaluation"
        description="Measured on a held-out synthetic test set"
      >
        <DataState resource={model}>
          {model.data && (
            <>
              <div className="model-metrics">
                <div>
                  <small>Selected model</small>
                  <strong>
                    {model.data.selectedModel.replaceAll("_", " ")}
                  </strong>
                </div>
                <div>
                  <small>Test macro F1</small>
                  <strong>{model.data.test.macro_f1.toFixed(3)}</strong>
                </div>
                <div>
                  <small>Critical-class recall</small>
                  <strong>
                    {model.data.test.classification_report.Critical.recall.toFixed(
                      3,
                    )}
                  </strong>
                </div>
                <div>
                  <small>Test scenarios</small>
                  <strong>{model.data.split.test}</strong>
                </div>
              </div>
              <p className="footnote">
                {model.data.selection}. Synthetic performance does not establish
                clinical validity. Full results and methodology are included in
                the project model card.
              </p>
            </>
          )}
        </DataState>
      </Panel>
      <Panel
        title="Recent predictions"
        description="Latest 100 predictions accessible to your role"
      >
        <DataState resource={history}>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Suggestion</th>
                  <th>Human review</th>
                  <th>Created</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {history.data?.map((p) => (
                  <tr key={p.id}>
                    <td>{p.patient_name}</td>
                    <td>
                      <StatusBadge status={p.result.predictedPriority} />
                    </td>
                    <td>
                      <StatusBadge status={p.human_action} />
                    </td>
                    <td>{formatDate(p.created_at)}</td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => {
                          setPrediction(p);
                          setCaseId(String(p.case_id));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.data?.length === 0 && (
              <Empty
                title="No predictions yet"
                description="Your first saved estimate will appear here."
              />
            )}
          </div>
        </DataState>
      </Panel>
      {review && (
        <Modal
          title={
            review === "OVERRIDE"
              ? "Override suggestion"
              : "Confirm human review"
          }
          onClose={() => {
            if (!busy) setReview(null);
          }}
        >
          <form className="form-body" onSubmit={submitReview}>
            <p>
              {review === "ACCEPT"
                ? `Apply ${result.predictedPriority} to this case?`
                : review === "REVIEW"
                  ? "Record acknowledgement without changing priority."
                  : "Choose your priority and record the reason for the override."}
            </p>
            {review === "OVERRIDE" && (
              <>
                <Field label="Reviewed priority">
                  <select name="priority">
                    {["Stable", "Urgent", "Critical"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Override reason">
                  <textarea
                    name="reason"
                    required
                    minLength={5}
                    maxLength={1000}
                  />
                </Field>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setReview(null)}
              >
                Cancel
              </button>
              <button className="btn primary" disabled={busy}>
                Record review
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
