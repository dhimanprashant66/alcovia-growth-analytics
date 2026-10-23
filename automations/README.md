# n8n workflow starter exports

These are importable starter workflows for the assignment. They are inactive and use synthetic/demo payloads; no Alcovia accounts, credentials, production endpoints, or live database writes are configured.

| Export | Purpose | Status |
|---|---|---|
| `exports/clickup-lead-webhook-starter.json` | Receives a ClickUp-style task webhook, validates the task ID, maps a small set of fields, and returns a normalized preview for review. | Importable starter; database upsert intentionally not connected. |
| `exports/student-progress-review-demo.json` | Applies demonstration completion/outcome thresholds to synthetic pseudonymous records and emits a human-review queue. | Importable and self-contained demo. |

## Import and test

1. In n8n, choose **Workflows → Import from File** and select one JSON export.
2. For the student demo, select **Test workflow**. It needs no credentials and returns three synthetic review rows.
3. For the ClickUp starter, configure the webhook in a non-production workspace and send a test payload with a `task.id`. Confirm the ClickUp field names, source values, campaign IDs, and stage mapping with the data owner before using the output downstream.
4. Keep both workflows inactive until the required authentication, access controls, source mappings, database credentials, error handling, and reconciliation checks have been configured and reviewed.

The ClickUp webhook starter does not verify ClickUp request signatures and does not write to PostgreSQL. Add verified authentication and an idempotent transaction before any production use. The student thresholds (65% completion and 60% outcome) are demo-only; a flag requests human review and must never trigger an automatic student decision.
