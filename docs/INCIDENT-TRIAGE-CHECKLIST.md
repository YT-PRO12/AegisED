# Operations incident triage

This document concerns the software demonstration and is **not** clinical advice.

1. Record deployment version, timestamp, failing API route and request correlation identifier without copying patient details.
2. Distinguish configuration, availability, authorization and persistence incidents.
3. Confirm whether a transaction completed or rolled back before retrying assignment actions.
4. Preserve redacted application logs and status results for investigation.
5. Verify resolution against synthetic records in a disposable environment before release.
6. Escalate any suspected real-data disclosure immediately using the documented security response process.

Do not publish raw authentication tokens, patient records, or production database exports. See [incident response](INCIDENT_RESPONSE.md) and [testing](TESTING.md).
