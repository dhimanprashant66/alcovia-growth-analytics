-- Proposed SQL examples. Replace dates with actual requested reporting period.
-- No real data attached; all datasets in the React prototype are synthetic.
-- 1. Monthly net captured collections with category split.
SELECT date_trunc('month', p.processed_at)::date AS report_month,
       o.category,
       SUM(CASE WHEN p.event_type = 'capture' THEN p.amount_paise ELSE -p.amount_paise END) / 100.0 AS net_revenue_inr
FROM payments p
JOIN orders o ON o.id = p.order_id
WHERE p.processed_at >= TIMESTAMPTZ '2026-09-01 00:00:00+05:30'
  AND p.processed_at < TIMESTAMPTZ '2026-11-01 00:00:00+05:30'
GROUP BY 1, 2 ORDER BY 1, 2;

-- 2. Acquisition-cohort funnel: first qualifying event per lead through cutoff.
WITH cohort AS (
  SELECT id, source, campaign_id, created_at FROM leads
  WHERE created_at >= TIMESTAMPTZ '2026-10-01 00:00:00+05:30'
    AND created_at < TIMESTAMPTZ '2026-10-18 00:00:00+05:30'
), stage_flags AS (
  SELECT c.id, c.source,
         BOOL_OR(e.stage = 'qualified') AS qualified,
         BOOL_OR(e.stage = 'discovery_scheduled') AS discovery_scheduled,
         BOOL_OR(e.stage = 'discovery_attended') AS discovery_attended,
         BOOL_OR(e.stage = 'ambition_interview') AS ambition_interview,
         BOOL_OR(e.stage = 'architect_session') AS architect_session,
         BOOL_OR(e.stage = 'paid') AS paid
  FROM cohort c LEFT JOIN lead_stage_events e
    ON e.lead_id = c.id AND e.occurred_at < TIMESTAMPTZ '2026-10-18 00:00:00+05:30'
  GROUP BY c.id, c.source
)
SELECT COUNT(*) AS total_leads,
       COUNT(*) FILTER (WHERE qualified) AS qualified_leads,
       COUNT(*) FILTER (WHERE discovery_scheduled) AS discovery_scheduled,
       COUNT(*) FILTER (WHERE discovery_attended) AS discovery_attended,
       COUNT(*) FILTER (WHERE ambition_interview) AS ambition_interviews,
       COUNT(*) FILTER (WHERE architect_session) AS architect_sessions,
       COUNT(*) FILTER (WHERE paid) AS paid_enrollments,
       COUNT(*) FILTER (WHERE source = 'organic') AS organic_leads
FROM stage_flags;

-- 3. Past-due invoices and unpaid balances as of a cutoff. For partial invoice
-- payments, allocate verified payment records to invoices; refunds require a policy.
WITH invoice_balances AS (
  SELECT i.id, i.due_at, i.amount_paise,
         COALESCE(SUM(CASE WHEN p.event_type = 'capture' THEN p.amount_paise ELSE -p.amount_paise END),0) AS net_paid_paise
  FROM invoices i
  LEFT JOIN payments p ON p.invoice_id = i.id AND p.processed_at < TIMESTAMPTZ '2026-10-18 00:00:00+05:30'
  WHERE i.issued_at < TIMESTAMPTZ '2026-10-18 00:00:00+05:30'
  GROUP BY i.id
)
SELECT id, GREATEST(0, amount_paise - net_paid_paise) / 100.0 AS unpaid_inr,
       (due_at < TIMESTAMPTZ '2026-10-18 00:00:00+05:30') AS is_overdue
FROM invoice_balances
WHERE amount_paise > net_paid_paise ORDER BY unpaid_inr DESC;

-- 4. Campaign CTR, cost per qualified Meta lead and frequency approximation.
-- For real reporting, use Meta's period-unique reach instead of summed daily reach.
WITH daily_ads AS (
 SELECT campaign_id, SUM(spend_paise) AS spend_paise,
        SUM(impressions) AS impressions, SUM(link_clicks) AS link_clicks,
        SUM(reach) AS summed_daily_reach
 FROM ad_daily_metrics
 WHERE report_date BETWEEN DATE '2026-10-01' AND DATE '2026-10-17'
 GROUP BY campaign_id
), acquired_qualified AS (
 SELECT l.campaign_id, COUNT(DISTINCT l.id) AS qualified_leads
 FROM leads l
 WHERE l.source = 'meta'
   AND l.created_at >= TIMESTAMPTZ '2026-10-01 00:00:00+05:30'
   AND l.created_at < TIMESTAMPTZ '2026-10-18 00:00:00+05:30'
   AND EXISTS (SELECT 1 FROM lead_stage_events e WHERE e.lead_id = l.id
         AND e.stage = 'qualified' AND e.occurred_at < TIMESTAMPTZ '2026-10-18 00:00:00+05:30')
 GROUP BY l.campaign_id
)
SELECT c.name, a.spend_paise / 100.0 AS spend_inr,
       ROUND(100.0 * a.link_clicks / NULLIF(a.impressions,0), 2) AS link_ctr_pct,
       ROUND(1.0 * a.impressions / NULLIF(a.summed_daily_reach,0), 2) AS approx_frequency,
       COALESCE(q.qualified_leads,0) AS qualified_leads,
       ROUND(a.spend_paise / 100.0 / NULLIF(q.qualified_leads,0),2) AS cost_per_qualified_lead_inr
FROM daily_ads a JOIN campaigns c ON c.id = a.campaign_id
LEFT JOIN acquired_qualified q ON q.campaign_id = c.id;

-- 5. Student activity quantity and quality by activity/cadence.
-- $1 is the inclusive start date; $2 is the exclusive end date.
-- Cancelled opportunities are removed from the planned denominator.
SELECT ac.name AS activity,
       ac.cadence,
       COUNT(*) FILTER (WHERE e.status <> 'cancelled') AS planned,
       COUNT(*) FILTER (WHERE e.status = 'completed') AS completed,
       ROUND(100.0 * COUNT(*) FILTER (WHERE e.status = 'completed') /
             NULLIF(COUNT(*) FILTER (WHERE e.status <> 'cancelled'), 0), 1) AS completion_pct,
       ROUND(AVG(e.pulse_rating) FILTER (WHERE e.status = 'completed'), 2) AS average_pulse_rating,
       ROUND(100.0 * COUNT(*) FILTER (WHERE e.status = 'completed' AND e.pulse_rating IS NOT NULL) /
             NULLIF(COUNT(*) FILTER (WHERE e.status = 'completed'), 0), 1) AS pulse_response_pct
FROM student_activity_events e
JOIN activity_catalog ac ON ac.id = e.activity_id
WHERE e.planned_at >= $1::date AND e.planned_at < $2::date
  AND e.status <> 'cancelled'
GROUP BY ac.id, ac.name, ac.cadence
ORDER BY CASE ac.cadence WHEN 'daily' THEN 1 WHEN 'weekly' THEN 2 WHEN 'monthly' THEN 3 ELSE 4 END,
         ac.name;

-- 6. Weekly completion and student experience trend.
SELECT date_trunc('week', e.planned_at)::date AS week_start,
       ROUND(100.0 * COUNT(*) FILTER (WHERE e.status = 'completed') /
             NULLIF(COUNT(*) FILTER (WHERE e.status <> 'cancelled'), 0), 1) AS completion_pct,
       ROUND(AVG(e.pulse_rating) FILTER (WHERE e.status = 'completed'), 2) AS average_pulse_rating,
       ROUND(100.0 * COUNT(*) FILTER (WHERE e.status = 'completed' AND e.pulse_rating IS NOT NULL) /
             NULLIF(COUNT(*) FILTER (WHERE e.status = 'completed'), 0), 1) AS pulse_response_pct
FROM student_activity_events e
WHERE e.planned_at >= $1::date AND e.planned_at < $2::date
  AND e.status <> 'cancelled'
GROUP BY 1 ORDER BY 1;

-- 7. Cohort learning outcomes: completed assessments and roadmap milestones only.
SELECT c.name AS cohort,
       COUNT(DISTINCT s.id) AS students_with_learning_events,
       ROUND(AVG(e.outcome_score), 1) AS average_learning_outcome_pct
FROM student_activity_events e
JOIN activity_catalog ac ON ac.id = e.activity_id AND ac.captures_outcome
JOIN students s ON s.id = e.student_id
JOIN student_cohorts c ON c.id = s.cohort_id
WHERE e.planned_at >= $1::date AND e.planned_at < $2::date
  AND e.status = 'completed' AND e.outcome_score IS NOT NULL
  AND s.active_from < $2::date AND (s.active_to IS NULL OR s.active_to >= $1::date)
GROUP BY c.id, c.name ORDER BY c.name;

-- 8. Student review queue. These demo review thresholds require local validation
-- with the program team; this query suggests follow-up and does not automate decisions.
WITH per_student AS (
  SELECT s.id AS student_id, c.name AS cohort,
         COUNT(*) FILTER (WHERE e.status <> 'cancelled') AS planned,
         COUNT(*) FILTER (WHERE e.status = 'completed') AS completed,
         ROUND(100.0 * COUNT(*) FILTER (WHERE e.status = 'completed') /
               NULLIF(COUNT(*) FILTER (WHERE e.status <> 'cancelled'), 0), 1) AS completion_pct,
         ROUND(AVG(e.pulse_rating) FILTER (WHERE e.status = 'completed'), 2) AS average_pulse_rating,
         ROUND(100.0 * COUNT(*) FILTER (WHERE e.status = 'completed' AND e.pulse_rating IS NOT NULL) /
               NULLIF(COUNT(*) FILTER (WHERE e.status = 'completed'), 0), 1) AS pulse_response_pct,
         ROUND(AVG(e.outcome_score) FILTER (WHERE e.status = 'completed' AND ac.captures_outcome), 1) AS average_learning_outcome_pct,
         COALESCE(SUM(e.focus_minutes) FILTER (WHERE e.status = 'completed'), 0) AS focus_minutes
  FROM students s
  JOIN student_cohorts c ON c.id = s.cohort_id
  LEFT JOIN student_activity_events e
    ON e.student_id = s.id AND e.planned_at >= $1::date AND e.planned_at < $2::date
   AND e.status <> 'cancelled'
  LEFT JOIN activity_catalog ac ON ac.id = e.activity_id
  WHERE s.active_from < $2::date AND (s.active_to IS NULL OR s.active_to >= $1::date)
  GROUP BY s.id, c.name
)
SELECT student_id, cohort, planned, completed, completion_pct,
       average_pulse_rating, pulse_response_pct, average_learning_outcome_pct, focus_minutes,
       CASE WHEN completion_pct < 65 THEN 'review'
            WHEN average_learning_outcome_pct IS NULL THEN 'insufficient_data'
            WHEN average_learning_outcome_pct < 60 THEN 'review'
            ELSE 'on_track' END AS suggested_review_status
FROM per_student
WHERE planned > 0
ORDER BY CASE WHEN completion_pct < 65 OR average_learning_outcome_pct < 60 THEN 0
              WHEN average_learning_outcome_pct IS NULL THEN 2
              ELSE 1 END,
         completion_pct ASC, student_id;
