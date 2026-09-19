import { useState } from "react";
import { BookOpen, ArrowUp, FileText, SearchCheck } from "lucide-react";
import { request } from "../services/api";
import { PageHeader, Panel } from "../components/UI";
export default function Knowledge() {
  const [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function ask(text) {
    setBusy(true);
    setError("");
    setQuestion(text);
    try {
      const r = await request("/knowledge", {
        method: "POST",
        body: { question: text },
      });
      setAnswer(r.data);
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
        title="Knowledge assistant"
        description="Operational answers, with the evidence alongside."
      />
      <div className="knowledge-layout">
        <div>
          <Panel
            title="Ask about CareFlow"
            description="Search workflow, roles, analytics definitions, and model limitations."
          >
            <div className="knowledge-intro">
              <span className="knowledge-orb">
                <BookOpen size={30} />
              </span>
              <h2>Find clarity in the documentation.</h2>
              <p>
                A focused assistant for how this prototype works. It does not
                provide clinical advice.
              </p>
              <div className="question-chips">
                {[
                  "How do I assign a bed to a case?",
                  "What happens when I discharge a patient?",
                  "Are model scores clinical confidence?",
                  "How is average waiting time calculated?",
                ].map((q) => (
                  <button key={q} disabled={busy} onClick={() => ask(q)}>
                    {q}
                    <ArrowUp size={14} />
                  </button>
                ))}
              </div>
            </div>
            <form
              className="question-form"
              onSubmit={(e) => {
                e.preventDefault();
                ask(question);
              }}
            >
              <textarea
                aria-label="Your question"
                placeholder="Ask an operational question…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                minLength={3}
                maxLength={500}
                rows={2}
              />
              <button
                className="btn primary"
                aria-label="Ask question"
                disabled={busy}
              >
                {busy ? "Searching…" : <ArrowUp size={20} />}
              </button>
            </form>
            {error && (
              <p className="form-error padded" role="alert">
                {error}
              </p>
            )}
          </Panel>
          {answer && (
            <Panel
              title={
                answer.mode === "insufficient_context"
                  ? "No supporting context"
                  : "Retrieved answer"
              }
              action={
                <span className="subtle-label">
                  {answer.mode === "rag"
                    ? "LLM + retrieval"
                    : answer.mode === "retrieval_only"
                      ? "Source excerpts"
                      : "Insufficient context"}
                </span>
              }
            >
              <div className="answer-text">
                {answer.answer.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {answer.limitation && (
                <div className="answer-note">
                  <SearchCheck size={17} />
                  <p>{answer.limitation}</p>
                </div>
              )}
            </Panel>
          )}
        </div>
        <div>
          <Panel
            title="Source library"
            description="Project-authored operational documentation"
          >
            <div className="source-list">
              {answer?.sources?.length
                ? answer.sources.map((s, i) => (
                    <details key={s.id} className="source-card" open={i === 0}>
                      <summary>
                        <FileText size={18} />
                        <div>
                          <small>SOURCE {i + 1}</small>
                          <strong>{s.title}</strong>
                          <span>{s.section}</span>
                        </div>
                      </summary>
                      <p>{s.text}</p>
                      <small>
                        {s.path} · {s.id}
                      </small>
                    </details>
                  ))
                : [
                    "Emergency workflow",
                    "Access and accountability",
                    "Decision support and limitations",
                    "Analytics definitions",
                    "Running CareFlow",
                  ].map((s) => (
                    <div className="source-placeholder" key={s}>
                      <FileText size={18} />
                      <span>{s}</span>
                    </div>
                  ))}
            </div>
            <p className="footnote">
              Source sections and document references appear with every
              supported answer. Local retrieval uses latent-semantic vectors and
              cosine similarity.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
