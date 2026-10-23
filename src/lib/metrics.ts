import { adDailyMetrics, campaigns, dateSequence, daysBetween, invoices, leads, monthlyTargets, payments, shiftDate, trialRenewals } from '../data/sampleData';
import type { Campaign, DateRange, ISODate, Lead, Payment } from '../types';

export const money = (paise: number): string =>
  `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
export const percentage = (numerator: number, denominator: number): number =>
  denominator ? Math.round((numerator / denominator) * 1_000) / 10 : 0;
export const within = (date: ISODate, range: DateRange): boolean => date >= range.start && date <= range.end;
export const reached = (date: ISODate | null, cutoff: ISODate): boolean => Boolean(date && date <= cutoff);
export const nextDay = (date: ISODate) => shiftDate(date, 1);

// Month targets are prorated for partial ranges. Actual finance targets must be confirmed with Alcovia.
export function targetForRange(range: DateRange): number {
  return dateSequence(range.start, range.end).reduce((sum, date) => {
    const target = monthlyTargets.find((month) => month.month === date.slice(0, 7));
    if (!target) return sum;
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return sum + target.amountPaise / daysInMonth;
  }, 0);
}

export function netPayment(payment: Payment): number {
  return payment.status === 'refunded' ? -payment.amountPaise : payment.amountPaise;
}

export function revenueForRange(range: DateRange) {
  const transactions = payments.filter((payment) => within(payment.date, range));
  const programPaise = transactions.filter((payment) => payment.category === 'program').reduce((total, payment) => total + netPayment(payment), 0);
  const workshopPaise = transactions.filter((payment) => payment.category === 'workshop').reduce((total, payment) => total + netPayment(payment), 0);
  const netPaise = programPaise + workshopPaise;
  const targetPaise = targetForRange(range);
  const acquired = leads.filter((lead) => within(lead.createdAt, range));
  const paid = acquired.filter((lead) => reached(lead.enrolledAt, range.end));
  const onboardingCount = leads.filter((lead) => lead.onboardedAt && within(lead.onboardedAt, range)).length;
  const unpaidInvoices = invoices.filter((invoice) => invoice.issuedAt <= range.end).reduce((total, invoice) => total + invoice.amountPaise - invoice.paidPaise, 0);
  const renewalCutoff = shiftDate(range.end, 30);
  const renewals = trialRenewals.filter((renewal) => !renewal.renewed && renewal.trialEndsAt > range.end && renewal.trialEndsAt <= renewalCutoff);
  return {
    programPaise, workshopPaise, netPaise, targetPaise,
    achievementPct: percentage(netPaise, targetPaise),
    totalCaptured: transactions.filter((payment) => payment.status === 'captured').length,
    totalRefunds: transactions.filter((payment) => payment.status === 'refunded').length,
    paidEnrollments: paid.length,
    trialEnrollments: paid.filter((lead) => lead.programType === 'trial').length,
    fullEnrollments: paid.filter((lead) => lead.programType === 'full').length,
    onboardingCount,
    unpaidInvoices,
    renewals: renewals.length,
  };
}

export const funnelStages = [
  { key: 'createdAt', name: 'Total leads' },
  { key: 'qualifiedAt', name: 'Qualified' },
  { key: 'discoveryScheduledAt', name: 'Discovery scheduled' },
  { key: 'discoveryAttendedAt', name: 'Discovery attended' },
  { key: 'ambitionAt', name: 'Ambition interview' },
  { key: 'architectAt', name: 'Architect session' },
  { key: 'enrolledAt', name: 'Paid enrollment' },
] as const;

export function funnelForRange(range: DateRange) {
  const cohort = leads.filter((lead) => within(lead.createdAt, range));
  const counts = funnelStages.map(({ key, name }) => ({
    name,
    count: cohort.filter((lead) => key === 'createdAt' || reached(lead[key], range.end)).length,
  }));
  const scheduled = counts[2].count;
  const attended = counts[3].count;
  const paid = counts[6].count;
  const organic = cohort.filter((lead) => lead.source === 'organic').length;
  const closed = cohort.filter((lead) => reached(lead.enrolledAt, range.end));
  const journeyDays = closed.length ? Math.round(closed.reduce((acc, lead) => acc + daysBetween(lead.createdAt, lead.enrolledAt!), 0) / closed.length * 10) / 10 : null;
  return {
    counts,
    leadCount: cohort.length,
    qualified: counts[1].count,
    scheduled, attended, organic, paid,
    leadQualificationPct: percentage(counts[1].count, cohort.length),
    discoveryShowPct: percentage(attended, scheduled),
    leadToPaidPct: percentage(paid, cohort.length),
    journeyDays,
  };
}

export function dailyRevenue(range: DateRange) {
  return dateSequence(range.start, range.end).map((date) => {
    const todays = payments.filter((payment) => payment.date === date);
    return {
      date: date.slice(5),
      program: Math.round(todays.filter((payment) => payment.category === 'program').reduce((sum, p) => sum + netPayment(p), 0) / 100),
      workshop: Math.round(todays.filter((payment) => payment.category === 'workshop').reduce((sum, p) => sum + netPayment(p), 0) / 100),
    };
  });
}

export interface CampaignSummary {
  id: string;
  name: string;
  creative: string;
  spendPaise: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctrPct: number;
  frequencyApprox: number;
  qualified: number;
  paid: number;
  cplPaise: number | null;
  action: string;
  reason: string;
}

export function campaignForRange(range: DateRange): CampaignSummary[] {
  const cohort = leads.filter((lead) => within(lead.createdAt, range) && lead.source === 'meta');
  return campaigns.map((campaign: Campaign) => {
    const rows = adDailyMetrics.filter((row) => row.campaignId === campaign.id && within(row.date, range));
    const spendPaise = rows.reduce((sum, row) => sum + row.spendPaise, 0);
    const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
    const reach = rows.reduce((sum, row) => sum + row.reach, 0);
    const clicks = rows.reduce((sum, row) => sum + row.linkClicks, 0);
    const attributed = cohort.filter((lead) => lead.campaignId === campaign.id);
    const qualified = attributed.filter((lead: Lead) => reached(lead.qualifiedAt, range.end)).length;
    const paid = attributed.filter((lead) => reached(lead.enrolledAt, range.end)).length;
    const ctrPct = percentage(clicks, impressions);
    // Aggregated daily unique reach is not cross-day deduplicated. Show as approximation only.
    const frequencyApprox = reach ? Math.round(impressions / reach * 10) / 10 : 0;
    const cplPaise = qualified ? Math.round(spendPaise / qualified) : null;
    let action = 'Monitor';
    let reason = 'Continue observing funnel quality and conversion.';
    if (frequencyApprox >= 3 && ctrPct < 1.2) {
      action = 'Refresh'; reason = 'Frequency ≥3 and link CTR <1.2%; test new creatives.';
    } else if (qualified >= 5 && paid >= 3 && ctrPct >= 1.5 && cplPaise !== null && cplPaise < 300_000) {
      action = 'Scale candidate'; reason = 'Healthy CTR, qualified leads and paid conversions; validate economics before scaling.';
    } else if (qualified >= 5 && paid < 2) {
      action = 'Investigate'; reason = 'Lead volume is present, but observed paid conversions are limited.';
    }
    return { id: campaign.id, name: campaign.name, creative: campaign.creative, spendPaise, impressions, reach, clicks, ctrPct, frequencyApprox, qualified, paid, cplPaise, action, reason };
  });
}

export function overallAdSpend(range: DateRange) {
  return campaignForRange(range).reduce((sum, campaign) => sum + campaign.spendPaise, 0);
}

export function campaignByName(id: string) {
  return campaigns.find((c) => c.id === id)?.name ?? id;
}
