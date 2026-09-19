# A five-minute interview demonstration

1. **Overview (30 seconds):** Explain that the counts, queue, bed states and chart come from stored synthetic records. Refresh once. Show that the UI labels this as an educational prototype.
2. **One complete workflow (90 seconds):** Register a synthetic patient; create a case; assign an available doctor and bed; start and complete treatment; discharge. Open the timeline and show resources becoming available. Mention transactions, locks and database constraints.
3. **Data and analytics (45 seconds):** Select a date range. Explain arrival cohorts, waiting-time sample counts and the difference between current occupancy and historical utilization.
4. **Decision support (60 seconds):** Generate an adult synthetic estimate. Explain the model version and why class scores are not clinical confidence. Override with a reason and show the audit event.
5. **Knowledge (30 seconds):** Ask how a bed is allocated. Open the cited source section. State whether the current mode is retrieval-only or actual configured LLM synthesis.
6. **Engineering evidence (45 seconds):** Show the tests, model card, native PostgreSQL CI and deployment guide. Clearly distinguish local verification from unexecuted hosting checks.

Do not input real patient information. Be ready to explain one controller, one transaction, one model metric and one limitation without reading a script.
