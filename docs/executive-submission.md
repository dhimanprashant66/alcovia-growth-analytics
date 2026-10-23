# Alcovia — Product, Systems & Analytics Lead

## Executive approach

I would build a reliable measurement and delivery foundation while improving student outcomes and giving the team a clear operating rhythm. I would start with a short audit of the app, student and revenue workflows, and available data; confirm metric definitions and owners; then deliver a useful GTM reporting MVP while validating the highest-value student problems. Subsequent releases would be based on observed usage and outcome data.

**Planning assumption:** the Product Lead, one Full Stack Engineer, and one Process/Systems Designer are available full-time. This is an explicit capacity assumption to validate at kickoff. The plan keeps discovery, GTM reporting, student analytics, and app improvements in one prioritized backlog, with one accountable owner per outcome.

## Problem 1 — Student app adoption

The brief reports 20 students using the app in the last 45 days and 11–17 active in a typical week. The reported average session duration of 2.15 minutes and proposed 30-minute target require validation: the measurement window, eligible users, session definition, and business rationale should be confirmed before accepting that target. I would optimize for useful student activity and learning progress, not time in the app by itself.

First, I would audit the activation and repeat-use journey, review event data by feature, and interview a small set of students and mentors. The initial questions are whether students know what to do next, whether Study and Wellness features solve a recurring need, and what makes Home and Realm more compelling. I would then test small changes such as a clear first-week study plan, a short guided focus session, a visible next step after a session, and timely mentor nudges. These are hypotheses to test, not assumed solutions.

Success measures would include onboarding completion, first meaningful study activity, weekly active students, study-plan completion, repeat use, and student-reported usefulness. D7/D30 retention and session duration would be supporting diagnostics. I would compare cohorts where possible, inspect qualitative feedback, and avoid drawing strong conclusions from a small sample.

## Problem 2 — GTM and revenue dashboard

The working prototype brings revenue, lead-funnel, campaign, and decision views into one interface. It supports reporting-period and custom-date filters, campaign and revenue CSV exports, and uses clearly labelled synthetic values. Its sample revenue model separates program and workshop collections, reflects refunds, and shows outstanding invoices as of period end. Campaign recommendations are transparent heuristics for human review.

For production, I would first confirm data ownership and definitions with the relevant teams: CRM or ClickUp for lead stages, the finance source of record for captures, refunds, invoices and renewals, and Meta Ads for spend, impressions, clicks and period-unique reach. I would reconcile totals with finance before using the dashboard for decisions. The prototype's summed daily reach is only an approximation of frequency; production reporting should use deduplicated period reach. No live integrations are included in the current demo.

## Problem 3 — Product and systems delivery

Each initiative should start with a measurable outcome, pass a problem-validation and readiness gate, ship in small increments, and be reviewed after release.

| Stage | Main work | Accountable owner and gate |
|---|---|---|
| Set the outcome | Define the OKR, baseline, target, cohort, guardrail, owner, date, and source. | Product Lead: stakeholders agree on the outcome and measurement. |
| Validate the problem | Review data and workflows, map the journey, talk to students or operators, and document assumptions and constraints. | Product Lead + Process Designer: evidence supports a specific problem. |
| Shape the work | Compare options, surface dependencies, estimate effort, write stories and acceptance criteria, and define events and success metrics. | Product Lead prioritizes; Engineer confirms feasibility; team agrees scope. |
| Build and review | Deliver a thin end-to-end slice in a short cycle, track risks and blockers, and demonstrate working software. | Engineer owns implementation; Product Lead accepts against the user need. |
| Test and release | Verify journeys, edge cases, access, data capture, and support steps; begin with a controlled pilot and rollback plan. | Engineer + Process Designer verify; Product Lead authorizes rollout. |
| Measure and decide | Review outcomes and feedback, then continue, improve, expand, or stop. Record the decision and owner for follow-up. | Product Lead makes an evidence-based decision with the team. |

The Product Lead owns outcomes, discovery, priorities, stakeholder decisions, and measurement. The Full Stack Engineer owns technical design, application changes, instrumentation, integrations, and technical quality. The Process/Systems Designer owns workflow mapping, operating definitions, data-entry design, SOPs, and process testing. The team maintains one backlog, a weekly delivery review, a regular stakeholder demo, and a visible decision and risk log.

## Problem 4 — Student progress dashboard

The prototype demonstrates daily, weekly, monthly, and quarterly activity views, cohort comparison, an ID-only student table, filters, and CSV export. It uses synthetic student IDs and values. The production dashboard should measure three distinct dimensions:

| Lens | Core measure | Example evidence |
|---|---|---|
| Quantity | Completed planned activities divided by planned activities; cancelled activities excluded. | Study sessions, routine check-ins, quizzes, mentor meetings, workshops, roadmap reviews. |
| Quality | Average post-activity pulse rating, shown with its response coverage. | Student pulse and, where useful, structured mentor feedback. |
| Performance | Progress in assessment and roadmap outcomes over time. | Quiz results, milestones achieved, and progress against the student's starting point. |

The app should be the source for app activity. During discovery, I would confirm the source of record for assessments, workshops, and mentor activities. Capture a pseudonymous student ID, activity type, cadence, planned date, status, and only the relevant rating or outcome. Use a short structured form for offline activity, and automate approved source syncs to avoid duplicate entry. Validate IDs, dates, status, score ranges, duplicates, and pulse response coverage before reporting.

Mentors need a role-restricted student view to prepare follow-up; program leads need aggregate cohort and activity views. A progress flag should prompt a human review, never an automatic decision. Student identity mapping and consent records should stay in a controlled student service. Sensitive wellness and wearable data should be excluded from general dashboards unless a specific, consented use case and access policy are approved.

## 30/60/90-day execution plan

| Period | Focus | Exit gate |
|---|---|---|
| Days 1–30 — November (assuming a 1 November start) | Audit app and workflows; interview students and operators; validate sources and definitions; establish baselines; deliver GTM dashboard MVP with synthetic or approved sample data; prepare student event and privacy design. | Owners, metric definitions, source access, baseline limits, and first priorities agreed. |
| Days 31–60 — December | Instrument priority events; pilot GTM data sync and reconciliation; test targeted app improvements; build the student progress MVP and structured capture workflows. | QA, access controls, data-quality checks, and user acceptance pass for a limited pilot. |
| Days 61–90 — January | Review pilot outcomes and workload; improve workflows and dashboards; automate only reliable feeds; decide which app and analytics changes to expand, revise, or stop. | Evidence reviewed; scale decisions and next-quarter OKRs approved. |

## Team operating and success measures

The Product Lead maintains the prioritized backlog and OKRs, resolves cross-functional decisions, and shares a concise weekly status covering outcomes, delivery, risks, and decisions needed. The Engineer and Process Designer own estimates and delivery tasks within their areas. Work is accepted only when its user need, acceptance criteria, data capture, QA evidence, owner, and post-release measure are clear.

Initial targets should be set after the first data audit. Measures should include meaningful student activation and repeat study behavior; revenue and funnel reconciliation; data completeness and freshness; release quality and escaped defects; activity completion; pulse response coverage; and student learning progress. The student cohort is small, so pilot results may be directional; combine quantitative trends with student and mentor feedback before scaling.

## Submission assets and current status

- GTM and Student Analytics prototype: implemented with synthetic data; local production build and metric smoke checks pass.
- PostgreSQL schema and example KPI queries: proposed artifacts, not applied to a live database.
- Two importable n8n starter workflow exports are included: a ClickUp webhook normalization preview and a synthetic student review-queue demo. They are inactive and not connected to production systems. GitHub publication and public dashboard deployment remain to be completed and verified.
- Before submission, replace pending links with verified repository and live-dashboard URLs. Do not present sample data or the prototype as a live Alcovia integration.
