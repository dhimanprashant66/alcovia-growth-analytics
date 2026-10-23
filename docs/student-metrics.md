# Student progress reporting design

The student dashboard is a synthetic prototype. Its sample IDs and values are invented; no Alcovia student records or integrations are included.

## Metric definitions

| Lens | Definition | Interpretation |
|---|---|---|
| Activity completion | Completed planned activity events divided by planned, missed, and completed events; cancelled events are excluded. | Delivery and participation volume, reported by activity and cadence. |
| Experience quality | Mean 1–5 pulse rating attached to completed activities with a response. | Report alongside response coverage so non-response is visible and ratings are not treated as representative by default. |
| Learning outcome | Mean 0–100 assessment or roadmap score for completed activities configured to capture an outcome. | Review over time against each student's starting point and agreed program goals. |
| Focus study time | Sum of completed focused study minutes. | A supporting measure; do not optimize time alone or equate it with learning. |

The prototype uses illustrative follow-up thresholds of less than 65% activity completion or less than 60% learning outcome. These are not validated program standards. A missing learning outcome should appear as **data pending**, not as a positive progress signal. A human mentor reviews flags and decides what support is appropriate.

## Capture and reporting flow

1. Record a planned activity with a pseudonymous student ID, activity type, cadence, and planned date.
2. Record completion or missed status from the app or the owning operational workflow. Cancelled opportunities do not count against completion.
3. Capture pulse ratings and outcomes only where appropriate and clearly defined; keep consent and identity mapping in the controlled student service.
4. Validate required IDs, dates, status, source event IDs, and allowed score ranges before the reporting sync.
5. Aggregate by date range, activity, cadence, cohort, and student role. Give mentors an ID-level view and program leads an aggregate cohort view.

## Proposed implementation gates

- **Days 1–30:** Confirm source systems, definitions, consent, retention, access roles, and baseline data quality.
- **Days 31–60:** Instrument priority app events, connect approved activity sources, and pilot cohort and mentor views with synthetic or approved test data.
- **Days 61–90:** Review completeness, usefulness, and workload; adjust metric definitions and automate only reliable feeds. Expand access after the review gate.

The PostgreSQL student tables and query examples in `database/` are proposed design artifacts. They have not been applied to a production system.
