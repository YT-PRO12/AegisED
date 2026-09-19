# Knowledge retrieval and optional RAG

## Scope and licensing

The source corpus consists of five project-authored operational manuals under `ml-service/knowledge/documents/`. The project authors dedicate these documentation texts to CC0-1.0. They explain software workflow, access, model limitations, metric definitions and startup. They are not external medical reference material and do not authorize medical guidance.

## Data path

Markdown text → heading-based sections → TF-IDF features → truncated SVD dense vectors → persistent local index → cosine similarity → top three supported sections → excerpts or optional language-model synthesis → source references.

Each source has a stable chunk ID, title, section, original path, text and license. The index is rebuilt when the document content hash changes. Model artifacts are trusted local files; do not replace them with untrusted pickles. The semantic representation is a small latent-semantic model fitted on the operational corpus, not a pretrained neural embedding model. Paraphrase coverage is therefore limited.

## Output modes

- `retrieval_only`: quotes actual source sections, without an LLM. This is the default, explicitly labelled in the UI.
- `rag`: a configured Ollama model synthesizes retrieved evidence. Returned claims must have known source IDs and exact supporting excerpts. This does not guarantee that each claim logically follows from its quote.
- `insufficient_context`: no acceptable context or a clinical advice request. It does not fabricate an answer.

LLM failure or invalid evidence returns retrieval-only output with a visible explanation. There is no fake LLM response.

## Enable generation

Install/run a trusted Ollama server and download an instruction model suitable for your hardware using its official setup instructions. Set `OLLAMA_URL` and `OLLAMA_MODEL` in the Python service's environment, then restart it. For Compose, the URL must be reachable from the ML container; localhost inside a container is not the host. Do not expose an unauthenticated Ollama server publicly.

The code calls the documented `/api/generate` route with `stream:false`, JSON format and temperature zero. See [Ollama API](https://docs.ollama.com/api/generate) and [structured outputs](https://docs.ollama.com/capabilities/structured-outputs). No real model was available here; live synthesis remains unverified. Contract tests cover invalid evidence and unavailable-provider fallback.

## Evaluation

`python evaluate_retrieval.py` runs ten author-written operational questions with expected chunk IDs. Recorded hit@3 is 1.0 and MRR@3 is 0.8833. The complete query/result pairs are in `reports/retrieval.json`. This is a small development regression set, not a held-out general-purpose benchmark. Expand it with unseen paraphrases, multi-topic queries, ambiguous questions, adversarial prompts and no-answer questions before broader use.
