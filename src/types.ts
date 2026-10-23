export type ISODate = `${number}-${number}-${number}`;
export type ProgramType = 'trial' | 'full';
export type PaymentCategory = 'program' | 'workshop';
export type LeadSource = 'meta' | 'organic' | 'referral';

export interface Campaign {
  id: string;
  name: string;
  category: 'program' | 'workshop';
  creative: string;
}

export interface Lead {
  id: string;
  createdAt: ISODate;
  source: LeadSource;
  campaignId: string | null;
  qualifiedAt: ISODate | null;
  discoveryScheduledAt: ISODate | null;
  discoveryAttendedAt: ISODate | null;
  ambitionAt: ISODate | null;
  architectAt: ISODate | null;
  enrolledAt: ISODate | null;
  onboardedAt: ISODate | null;
  programType: ProgramType | null;
}

export interface Payment {
  id: string;
  date: ISODate;
  amountPaise: number;
  category: PaymentCategory;
  status: 'captured' | 'refunded';
  leadId?: string;
  programType?: ProgramType;
}

export interface Invoice {
  id: string;
  leadId: string;
  issuedAt: ISODate;
  dueAt: ISODate;
  amountPaise: number;
  paidPaise: number;
}

export interface AdDailyMetric {
  date: ISODate;
  campaignId: string;
  impressions: number;
  reach: number;
  linkClicks: number;
  spendPaise: number;
}

export interface MonthlyTarget {
  month: string;
  amountPaise: number;
}

export interface DateRange {
  start: ISODate;
  end: ISODate;
}
