# Release and Rollback Decision Guide

AegisED already has deployment instructions and a release checklist. Use this guide to decide whether to deploy, pause, or roll back a change.

## Before deploying

- Confirm the target environment and branch; isolate staging from production.
- Ensure the current PR CI passed with source, JavaScript, Python, API and browser checks as applicable.
- Check whether migrations are backward compatible and whether an independent restore point exists.
- Record the deployment identifier and intended verification steps.
- Confirm secrets remain in the deployment platform, not the repository.

## After deploying

Check /api/health and /api/ready, authentication, intake, doctor assignment, bed allocation, treatment and discharge in a permitted non-production test environment. Review logs and latency for regressions.

## Rollback

If data integrity, authentication, or core emergency workflow is at risk, stop the rollout and follow the platform's supported rollback mechanism for application images. A code rollback may **not** reverse database schema or data changes. Do not attempt a destructive migration rollback without a verified data recovery plan.

Preserve incident evidence and document the deployed commit, rollback commit or version, observed symptoms and recovery verification.

## Cloud cost control

Do not provision AWS or other billable services during a documentation or CI-only change. Separate staging approvals from production release approvals.
