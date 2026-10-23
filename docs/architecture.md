# Architecture and scope — Alcovia assessment

## Purpose
An interactive GTM, revenue, campaign, and student progress reporting prototype, using **synthetic data only**.

## Explicit assignment scope
- Revenue targets, program vs workshop split, signups, unpaid invoices and trial renewal visibility.
- Leads across qualification, discovery attendance, ambition interviews, architect sessions and paid signup.
- Campaign cost, CTR, approximate frequency, creative health, conversion and transparent action suggestions.
- Student activity coverage across daily, weekly, monthly, and quarterly cadences; activity completion, student pulse ratings, focus-study time, assessment and roadmap outcomes, cohort comparisons, and student-ID drill-down.
- Date filtering and drill-down examples.

## Source-of-truth proposal
- ClickUp: lead IDs, stage changes, activities (subject to data audit).
- Razorpay and finance reconciliation: captured payments, refunds, invoices.
- Meta Ads: ad spend, impressions, clicks, period-unique reach.
- Application: student engagement, activities, and outcomes, separated from sensitive wellness and wearable data.

## Safeguards
- Financial amounts in integer paise, converted to INR at presentation.
- Event timestamps and local reporting timezone must be specified consistently.
- Cohort conversion: leads acquired in the period and stages reached by report cutoff; open leads are not automatically counted as drop-offs.
- Demo frequency uses summed daily reach as an approximation; production must use deduplicated period-unique reach.
- Synthetic prices and revenue targets are **not actual company data**.
- A real deployment would require credentials, audit logs, access controls, consent for minor student data, data monitoring, and financial signoff.

## Student metric definitions in the prototype
- Quantity: completed activities divided by planned activities in the selected date range.
- Quality: average 1–5 post-activity student pulse rating for completed activities.
- Performance: average assessment and roadmap score for completed learning events.
- Review flag: illustrative threshold when activity completion is below 65% or learning outcomes are below 60%; a human mentor reviews before acting.
- Student rows use synthetic IDs only. These thresholds, scores, activities, and cohorts are demonstration assumptions.
