import type { AdDailyMetric, Campaign, Invoice, ISODate, Lead, MonthlyTarget, Payment } from '../types';

// Demonstration data ONLY. Deterministic and unrelated to actual Alcovia student, sales, or payment records.
export const DEMO_AS_OF: ISODate = '2026-10-17';
export const DEMO_START: ISODate = '2026-09-01';
export const WORKSHOP_SEAT_PRICE_PAISE = 399_900; // ₹3,999 given in assignment brief.
export const TRIAL_PRICE_PAISE = 1_200_000; // Synthetic assumption: ₹12,000.
export const FULL_PRICE_PAISE = 3_500_000; // Synthetic assumption: ₹35,000.

export const campaigns: Campaign[] = [
  { id: 'c1', name: 'Career Discovery', category: 'program', creative: 'Explore future careers' },
  { id: 'c2', name: 'Parent Awareness', category: 'program', creative: 'Parent guide video' },
  { id: 'c3', name: 'Weekend Workshop', category: 'workshop', creative: 'Workshop invitation' },
  { id: 'c4', name: 'Personal Roadmap', category: 'program', creative: 'Build your roadmap' },
];

const MS_DAY = 86_400_000;
const utcDay = (date: ISODate) => Date.parse(`${date}T00:00:00Z`);
export function shiftDate(date: ISODate, days: number): ISODate {
  return new Date(utcDay(date) + days * MS_DAY).toISOString().slice(0, 10) as ISODate;
}
export function daysBetween(start: ISODate, end: ISODate): number {
  return Math.round((utcDay(end) - utcDay(start)) / MS_DAY);
}
export function dateSequence(start: ISODate, end: ISODate): ISODate[] {
  if (start > end) return [];
  return Array.from({ length: daysBetween(start, end) + 1 }, (_, i) => shiftDate(start, i));
}
const observableDate = (date: ISODate | null) => date && date <= DEMO_AS_OF ? date : null;
const span = daysBetween(DEMO_START, DEMO_AS_OF) + 1;

export const leads: Lead[] = Array.from({ length: 350 }, (_, index) => {
  const id = index + 1;
  const createdAt = shiftDate(DEMO_START, (id * 17 + Math.floor(id / 7)) % span);
  const source = id % 11 === 0 ? 'organic' : id % 13 === 0 ? 'referral' : 'meta';
  const campaignId = source === 'meta' ? campaigns[id % campaigns.length].id : null;
  const qualified = id % 5 !== 0;
  const scheduled = qualified && id % 9 !== 0;
  const attended = scheduled && id % 4 !== 0;
  const ambition = attended && id % 6 !== 0;
  const architect = ambition && id % 7 !== 0;
  const enrolled = architect && id % 3 !== 0;
  const enrolledAt = enrolled ? observableDate(shiftDate(createdAt, 8)) : null;
  return {
    id: `L-${String(id).padStart(4, '0')}`,
    createdAt,
    source,
    campaignId,
    qualifiedAt: qualified ? observableDate(shiftDate(createdAt, 1)) : null,
    discoveryScheduledAt: scheduled ? observableDate(shiftDate(createdAt, 2)) : null,
    discoveryAttendedAt: attended ? observableDate(shiftDate(createdAt, 3)) : null,
    ambitionAt: ambition ? observableDate(shiftDate(createdAt, 4)) : null,
    architectAt: architect ? observableDate(shiftDate(createdAt, 6)) : null,
    enrolledAt,
    onboardedAt: enrolledAt ? observableDate(shiftDate(enrolledAt, 2)) : null,
    programType: enrolledAt ? (id % 4 === 0 ? 'trial' : 'full') : null,
  };
});

export const payments: Payment[] = [
  ...leads.filter((lead) => lead.enrolledAt).map((lead, index) => ({
    id: `P-${String(index + 1).padStart(4, '0')}`,
    date: lead.enrolledAt!,
    amountPaise: lead.programType === 'trial' ? TRIAL_PRICE_PAISE : FULL_PRICE_PAISE,
    category: 'program' as const,
    status: 'captured' as const,
    leadId: lead.id,
    programType: lead.programType!,
  })),
  ...Array.from({ length: 100 }, (_, index) => {
    const id = index + 1;
    return {
      id: `W-${String(id).padStart(4, '0')}`,
      date: shiftDate(DEMO_START, (id * 11) % span),
      amountPaise: WORKSHOP_SEAT_PRICE_PAISE,
      category: 'workshop' as const,
      status: 'captured' as const,
    };
  }),
  // Standalone refund entries, not duplicate captures. Net collections = captured - refunded.
  { id: 'R-0001', date: '2026-10-07', amountPaise: WORKSHOP_SEAT_PRICE_PAISE, category: 'workshop', status: 'refunded' },
  { id: 'R-0002', date: '2026-09-18', amountPaise: TRIAL_PRICE_PAISE, category: 'program', status: 'refunded' },
];

export const invoices: Invoice[] = leads
  .filter((lead) => lead.architectAt && !lead.enrolledAt && lead.createdAt <= '2026-10-10')
  .slice(0, 20)
  .map((lead, index) => ({
    id: `INV-${String(index + 1).padStart(3, '0')}`,
    leadId: lead.id,
    issuedAt: lead.architectAt!,
    dueAt: shiftDate(lead.architectAt!, 14),
    amountPaise: FULL_PRICE_PAISE,
    paidPaise: index % 5 === 0 ? 700_000 : 0,
  }));

export const adDailyMetrics: AdDailyMetric[] = dateSequence(DEMO_START, DEMO_AS_OF).flatMap((date, day) =>
  campaigns.map((campaign, i) => {
    const impressions = 2100 + (day * 57 + i * 151) % 950;
    const frequency = [2.1, 3.7, 2.6, 2.0][i];
    const ctr = [2.1, 0.85, 1.65, 1.3][i] / 100;
    return {
      date,
      campaignId: campaign.id,
      impressions,
      reach: Math.round(impressions / frequency),
      linkClicks: Math.round(impressions * ctr),
      spendPaise: (1250 + i * 270 + day % 4 * 90) * 100,
    };
  }),
);

export const monthlyTargets: MonthlyTarget[] = [
  { month: '2026-09', amountPaise: 1_100_000 * 100 },
  { month: '2026-10', amountPaise: 1_350_000 * 100 },
];

export const trialRenewals = [
  { studentId: 'ST-901', trialEndsAt: '2026-10-19' as ISODate, renewed: false },
  { studentId: 'ST-902', trialEndsAt: '2026-10-23' as ISODate, renewed: false },
  { studentId: 'ST-903', trialEndsAt: '2026-10-31' as ISODate, renewed: true },
  { studentId: 'ST-904', trialEndsAt: '2026-11-05' as ISODate, renewed: false },
  { studentId: 'ST-905', trialEndsAt: '2026-11-14' as ISODate, renewed: false },
];
