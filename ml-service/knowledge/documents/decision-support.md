# Decision support and limitations

## Synthetic model
The priority model is trained on a reproducible synthetic adult dataset. Its labels are invented simulation categories, not medical ground truth. The pipeline compares a majority baseline, logistic regression, decision tree and random forest. Selection uses validation macro F1 and the selected model is evaluated once on a held-out test set. These metrics measure the synthetic simulator, not clinical safety or effectiveness.

## Human review and overrides
An AI prediction never changes case priority by itself. It remains Pending until an authorized user reviews it. Accept applies the suggested priority. Override requires a chosen priority and a recorded reason. Review records acknowledgement without changing priority. Only the latest pending prediction can be reviewed, and discharged cases are read-only.

## Model scores and explanations
Class scores are uncalibrated model probabilities and must not be described as clinical confidence or a patient's risk of disease. Feature sensitivity replaces one input with its training median and observes the score change. It is a local sensitivity probe, not a causal explanation. The live model accepts complete vital fields only, for ages eighteen through eighty-nine.

## Knowledge assistant scope
The knowledge assistant searches project-authored operational documentation. It cannot diagnose, prescribe, recommend medication doses, or provide emergency medical instructions. Local mode displays retrieved excerpts and references. An optional language model can synthesize supported operational answers when configured. Always check the cited document and treat retrieved content as evidence rather than authority.
