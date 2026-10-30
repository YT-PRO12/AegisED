# Assignment concurrency review

Emergency resource allocation must preserve this invariant: one available doctor or bed cannot be assigned to two active emergency cases.

## Transaction review

1. Begin a transaction before reading the candidate resource.
2. Lock the relevant resource row before confirming availability.
3. Validate the case state and permission scope within the same transaction.
4. Persist resource and case updates together, with an audit event.
5. Roll back the full operation on any error; never leave an orphaned assignment.

Native PostgreSQL integration and two-contender tests are the acceptance gates. PGlite tests are useful for application behavior but do not establish native multi-connection locking.

This document records expected behavior, not a newly completed concurrency run. See [testing](TESTING.md) and [transaction audit](AUDIT.md).
