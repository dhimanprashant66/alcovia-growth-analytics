import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, CalendarDays, CheckCircle2,
  BookOpenCheck, ChevronDown, CircleAlert, Clock3, Database, Download, Filter, GraduationCap,
  HeartPulse, LayoutDashboard, Megaphone, RefreshCw, Search, SearchCheck, ShieldCheck,
  Target, TrendingUp, Users, Wallet,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { DEMO_AS_OF, DEMO_START, payments, shiftDate } from './data/sampleData';
import { studentAnalytics } from './data/studentData';
import {
  campaignForRange, dailyRevenue, funnelForRange, money,
  overallAdSpend, percentage, revenueForRange,
} from './lib/metrics';
import type { DateRange, ISODate } from './types';
import type { Cadence } from './data/studentData';

type View = 'overview' | 'revenue' | 'funnel' | 'campaigns' | 'decisions' | 'students';
type Period = 'seven' | 'thirty' | 'october' | 'september' | 'custom';

const PAGES: { key: View; label: string; Icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Executive overview', Icon: LayoutDashboard },
  { key: 'revenue', label: 'Revenue & renewals', Icon: Wallet },
  { key: 'funnel', label: 'Lead funnel', Icon: Filter },
  { key: 'campaigns', label: 'Campaign performance', Icon: Megaphone },
  { key: 'decisions', label: 'RCA & decisions', Icon: SearchCheck },
  { key: 'students', label: 'Student analytics', Icon: GraduationCap },
];
const PERIODS: { value: Period; label: string }[] = [
  { value: 'seven', label: 'Last 7 days' },
  { value: 'thirty', label: 'Last 30 days' },
  { value: 'october', label: 'October to date' },
  { value: 'september', label: 'September 2026' },
  { value: 'custom', label: 'Custom range' },
];
const TONE = ['#1d6358', '#e1b96c', '#8aa5a0', '#adc3b8'];
const formatShort = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const formatPercent = (n: number) => `${n.toFixed(1)}%`;
const tipMoney = (value: number | undefined) => `₹${Number(value ?? 0).toLocaleString('en-IN')}`;

function getRange(period: Period): DateRange {
  if (period === 'seven') return { start: shiftDate(DEMO_AS_OF, -6), end: DEMO_AS_OF };
  if (period === 'thirty') return { start: shiftDate(DEMO_AS_OF, -29), end: DEMO_AS_OF };
  if (period === 'september') return { start: '2026-09-01', end: '2026-09-30' };
  return { start: '2026-10-01', end: DEMO_AS_OF };
}

function Stat({ title, value, footer, Icon }: { title: string; value: string; footer: string; Icon: typeof Wallet }) {
  return <div className="stat-card">
    <div className="stat-header"><span>{title}</span><Icon size={18} aria-hidden="true" /></div>
    <div className="stat-value">{value}</div>
    <div className="stat-footer">{footer}</div>
  </div>;
}
function Section({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="section-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>{children}</section>;
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>;
}
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: ReadonlyArray<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="custom-tooltip"><strong>{label}</strong>{payload.map((p, i) => <div key={i}><span className="legend-dot" style={{ background: p.color }} />{p.name}: {tipMoney(p.value)}</div>)}</div>;
}
function asCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  return [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n');
}
function downloadText(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [view, setView] = useState<View>('overview');
  const [period, setPeriod] = useState<Period>('thirty');
  const [range, setRange] = useState<DateRange>(() => getRange('thirty'));
  const [menuOpen, setMenuOpen] = useState(false);
  const [studentCohort, setStudentCohort] = useState('All cohorts');
  const [studentCadence, setStudentCadence] = useState<Cadence | 'All cadences'>('All cadences');
  const [studentSearch, setStudentSearch] = useState('');
  const revenue = useMemo(() => revenueForRange(range), [range]);
  const funnel = useMemo(() => funnelForRange(range), [range]);
  const campaigns = useMemo(() => campaignForRange(range), [range]);
  const series = useMemo(() => dailyRevenue(range), [range]);
  const adSpend = useMemo(() => overallAdSpend(range), [range]);
  const studentData = useMemo(() => studentAnalytics(range, studentCohort, studentCadence), [range, studentCohort, studentCadence]);
  const visibleStudents = useMemo(() => studentData.rows.filter((row) => row.studentId.toLowerCase().includes(studentSearch.trim().toLowerCase())), [studentData.rows, studentSearch]);
  const paidWorkshopSeats = useMemo(() => payments.filter((p) => p.category === 'workshop' && p.status === 'captured' && p.date >= range.start && p.date <= range.end).length, [range]);
  const canExport = view === 'campaigns' || view === 'revenue' || view === 'students';
  const periodLabel = `${formatShort(range.start)} – ${formatShort(range.end)}, 2026`;

  const changePeriod = (next: Period) => {
    setPeriod(next);
    if (next !== 'custom') setRange(getRange(next));
  };
  const changeDate = (key: 'start' | 'end', value: string) => {
    if (!value || value < DEMO_START || value > DEMO_AS_OF) return;
    setPeriod('custom');
    setRange((current) => {
      const newRange = { ...current, [key]: value as ISODate };
      if (newRange.start > newRange.end) newRange[key === 'start' ? 'end' : 'start'] = value as ISODate;
      return newRange;
    });
  };
  const exportCurrent = () => {
    const rows = view === 'students'
      ? visibleStudents.map((s) => ({ Student_ID: s.studentId, Cohort: s.cohort, Planned_activities: s.planned, Completed_activities: s.completed, Completion_percent: s.completionPct, Experience_rating: s.quality?.toFixed(1) ?? 'N/A', Focus_minutes: s.focusMinutes, Learning_outcome_percent: s.outcome?.toFixed(1) ?? 'N/A' }))
      : view === 'campaigns'
      ? campaigns.map((c) => ({ Campaign: c.name, Spend_INR: c.spendPaise / 100, CTR_percent: c.ctrPct, Frequency_approx: c.frequencyApprox, Qualified: c.qualified, Paid: c.paid, Action: c.action }))
      : series.map((s) => ({ Date_MM_DD: s.date, Program_INR: s.program, Workshop_INR: s.workshop }));
    downloadText(`alcovia-demo-${view}-${range.start}-${range.end}.csv`, asCsv(rows));
  };

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'expanded' : ''}`}>
      <div className="brand"><div className="brand-icon">A<span>.</span></div><div><strong>ALCOVIA</strong><small>GROWTH INTELLIGENCE</small></div></div>
      <div className="sidebar-caption">WORKSPACE</div>
      <nav className="nav-items" aria-label="Dashboard sections">
        {PAGES.map(({ key, label, Icon }) => <button key={key} type="button" className={`nav-link ${view === key ? 'active' : ''}`} onClick={() => { setView(key); setMenuOpen(false); }}>
          <Icon size={18} aria-hidden="true" /><span>{label}</span>
        </button>)}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-status"><ShieldCheck size={19}/><div><strong>Prototype workspace</strong><span>Static, synthetic dataset</span></div></div>
      <div className="sidebar-foot">Assessment demo · v0.2</div>
    </aside>
    <main className="main-area">
      <div className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen((prev) => !prev)} type="button">Menu <ChevronDown size={16}/></button><span>Product, Systems & Analytics / {view === 'students' ? 'Student success' : 'GTM'}</span><div className="top-right"><span className="top-dot"/>Demo mode</div></div>
      <div className="main-content">
        <div className="heading-row"><div><div className="eyebrow">ALCOVIA / PRODUCT & GROWTH</div><h1>{PAGES.find((p) => p.key === view)?.label}</h1><p>Business clarity through measurable, accountable decisions.</p></div><span className="date-chip"><CalendarDays size={16}/>{periodLabel}</span></div>
        <div className="demo-banner"><CircleAlert size={19}/><div><strong>Demonstration data only.</strong> This prototype contains no real Alcovia leads, payments, campaign or student records. Sample program prices, targets, and decision thresholds are assumptions.</div></div>
        <div className="filters"><div className="filter-label"><Filter size={17}/><strong>Reporting period</strong></div><select aria-label="Reporting period" value={period} onChange={(e) => changePeriod(e.target.value as Period)}>{PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select><label>From <input type="date" min={DEMO_START} max={DEMO_AS_OF} value={range.start} onChange={(e) => changeDate('start', e.target.value)}/></label><label>To <input type="date" min={DEMO_START} max={DEMO_AS_OF} value={range.end} onChange={(e) => changeDate('end', e.target.value)}/></label>{canExport && <button type="button" className="export-button" onClick={exportCurrent}><Download size={16}/> Export CSV</button>}</div>

        {view === 'overview' && <>
          <div className="stats-grid">
            <Stat title="Net revenue collected" value={money(revenue.netPaise)} footer="Captured payments less refunds" Icon={Wallet}/>
            <Stat title="Target achievement" value={`${revenue.achievementPct.toFixed(1)}%`} footer={`Vs ${money(revenue.targetPaise)} prorated demo target`} Icon={Target}/>
            <Stat title="Qualified leads" value={funnel.qualified.toLocaleString('en-IN')} footer={`${funnel.leadQualificationPct}% of acquired leads`} Icon={Users}/>
            <Stat title="Paid enrollments" value={String(funnel.paid)} footer={`${funnel.leadToPaidPct}% of acquisition cohort`} Icon={GraduationCap}/>
          </div>
          <div className="two-panels">
            <Section title="Revenue collection trend" subtitle="Payments by transaction date · INR">
              <div className="chart-holder"><ResponsiveContainer width="100%" height="100%"><AreaChart data={series} margin={{ top: 12, right: 14, bottom: 0, left: 0 }}><defs><linearGradient id="programFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1d6358" stopOpacity={0.22}/><stop offset="100%" stopColor="#1d6358" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0eb"/><XAxis dataKey="date" tick={{ fontSize: 11, fill: '#80918d' }} minTickGap={22}/><YAxis tick={{ fontSize: 11, fill: '#80918d' }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}/><Tooltip content={<ChartTooltip/>}/><Legend/><Area type="monotone" dataKey="program" name="Program" stroke="#1d6358" fill="url(#programFill)" strokeWidth={2}/><Area type="monotone" dataKey="workshop" name="Workshop" stroke="#d6ab5a" fill="#d6ab5a" fillOpacity={0.13} strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
            </Section>
            <Section title="Revenue breakdown" subtitle="By collected payment category">
              <div className="pie-holder"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: 'Programs', value: Math.max(0, revenue.programPaise) }, { name: 'Workshops', value: Math.max(0, revenue.workshopPaise) }]} dataKey="value" nameKey="name" innerRadius={66} outerRadius={101} paddingAngle={3}><Cell fill={TONE[0]}/><Cell fill={TONE[1]}/></Pie><Tooltip formatter={(value) => money(Number(value))}/><Legend/></PieChart></ResponsiveContainer></div>
            </Section>
          </div>
          <div className="three-panels">
            <MiniAction title="Discovery attendance" value={`${funnel.discoveryShowPct}%`} detail="Of discovery calls scheduled in selected cohort" Icon={CheckCircle2}/>
            <MiniAction title="Ad spend" value={money(adSpend)} detail="Meta demonstration campaign metrics" Icon={Megaphone}/>
            <MiniAction title="Organic leads" value={`${funnel.organic}`} detail="Acquired in the reporting period" Icon={TrendingUp}/>
          </div>
        </>}

        {view === 'revenue' && <>
          <div className="stats-grid"><Stat title="Net collections" value={money(revenue.netPaise)} footer="Net of recorded refunds" Icon={Wallet}/><Stat title="Program revenue" value={money(revenue.programPaise)} footer="Trial + full program" Icon={TrendingUp}/><Stat title="Workshop revenue" value={money(revenue.workshopPaise)} footer={`${paidWorkshopSeats} gross paid workshop seats`} Icon={Activity}/><Stat title="Unpaid invoices" value={money(revenue.unpaidInvoices)} footer="Outstanding balance as of period end*" Icon={CircleAlert}/></div>
          <div className="two-panels"><Section title="Revenue by day" subtitle="Collected payments — includes refund adjustments"><div className="chart-holder"><ResponsiveContainer width="100%" height="100%"><BarChart data={series}><CartesianGrid vertical={false} stroke="#edf0eb"/><XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={25}/><YAxis tickFormatter={(v: number) => `${Math.round(v/1000)}k`} tick={{ fontSize: 11 }}/><Tooltip content={<ChartTooltip/>}/><Legend/><Bar name="Program" dataKey="program" stackId="a" fill="#1d6358" radius={[0,0,0,0]}/><Bar name="Workshop" dataKey="workshop" stackId="a" fill="#d6ab5a" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div></Section>
          <Section title="Enrollment and renewal snapshot" subtitle="Enrollment cohort acquired in period"><InfoRow label="Three-month trial signups" value={String(revenue.trialEnrollments)}/><InfoRow label="Full-program signups" value={String(revenue.fullEnrollments)}/><InfoRow label="Students onboarded during period" value={String(revenue.onboardingCount)}/><InfoRow label="Trial renewals due in next 30 days" value={String(revenue.renewals)}/><InfoRow label="Recorded refunds" value={String(revenue.totalRefunds)}/><p className="fine-print">*Outstanding invoice balances are shown as of the period end. Trial renewals are from a separate synthetic cohort. The actual reporting policy should be agreed with finance.</p></Section></div>
        </>}

        {view === 'funnel' && <>
          <div className="stats-grid"><Stat title="Acquired leads" value={String(funnel.leadCount)} footer="Based on creation date" Icon={Users}/><Stat title="Qualification rate" value={`${funnel.leadQualificationPct}%`} footer="Qualified ÷ total leads" Icon={Target}/><Stat title="Discovery show-up" value={`${funnel.discoveryShowPct}%`} footer="Attended ÷ scheduled" Icon={CheckCircle2}/><Stat title="Lead to paid" value={`${funnel.leadToPaidPct}%`} footer="Paid by reporting cutoff" Icon={Wallet}/></div>
          <Section title="Conversion through the student enrollment journey" subtitle="Leads acquired in selected range; later stages counted only through the selected end date"><div className="funnel-stack">{funnel.counts.map((item, i) => <div key={item.name} className="funnel-row"><div><strong>{item.name}</strong><span>{i > 0 ? `${percentage(item.count, funnel.counts[i-1].count)}% from prior stage` : 'Acquisition cohort'}</span></div><div className="funnel-track"><div className="funnel-fill" style={{ width: `${percentage(item.count, Math.max(1, funnel.leadCount))}%`, opacity: 1 - i * 0.075 }} /></div><strong>{item.count}</strong></div>)}</div></Section>
          <div className="three-panels"><MiniAction title="Organic leads" value={String(funnel.organic)} detail="Non-paid source category" Icon={Users}/><MiniAction title="Paid enrollments" value={String(funnel.paid)} detail="Distinct program enrollments" Icon={GraduationCap}/><MiniAction title="Average journey" value={funnel.journeyDays === null ? 'N/A' : `${funnel.journeyDays} days`} detail="Acquisition to payment; completed journeys only" Icon={CalendarDays}/></div>
        </>}

        {view === 'campaigns' && <>
          <div className="stats-grid"><Stat title="Meta spend" value={money(adSpend)} footer="Paid campaigns in period" Icon={Wallet}/><Stat title="Attributed qualified leads" value={String(campaigns.reduce((sum, c) => sum + c.qualified, 0))} footer="Campaign-associated demo leads" Icon={Users}/><Stat title="Link clicks" value={campaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString('en-IN')} footer="Meta link-click records" Icon={Activity}/><Stat title="Blended cost / qualified lead" value={money(Math.round(adSpend / Math.max(1, campaigns.reduce((sum,c) => sum+c.qualified, 0))))} footer="Meta spend ÷ qualified attributed leads" Icon={Target}/></div>
          <Section title="Campaign effectiveness" subtitle="Campaign metrics and decisions are derived from sample daily records"><div className="table-scroll"><table className="data-table"><thead><tr><th>Campaign</th><th>Spend</th><th>Link CTR</th><th>Frequency*</th><th>Qualified</th><th>Paid</th><th>Cost / QL</th><th>Decision</th></tr></thead><tbody>{campaigns.map((c) => <tr key={c.id}><td><strong>{c.name}</strong><small>{c.creative}</small></td><td>{money(c.spendPaise)}</td><td>{formatPercent(c.ctrPct)}</td><td>{c.frequencyApprox.toFixed(1)}×</td><td>{c.qualified}</td><td>{c.paid}</td><td>{c.cplPaise === null ? 'N/A' : money(c.cplPaise)}</td><td><span className={`status ${c.action.toLowerCase().replaceAll(' ', '-')}`}>{c.action}</span></td></tr>)}</tbody></table></div><p className="fine-print">*Frequency is an approximation calculated from summed daily reach, which is not deduplicated across days. Real Meta period reach should replace this in production. Landing-page analytics will be added once a source/metric is validated.</p></Section>
        </>}

        {view === 'decisions' && <>
          <div className="stats-grid"><Stat title="Recommended reviews" value={String(campaigns.length)} footer="Rule-based, not AI generated" Icon={SearchCheck}/><Stat title="Refresh candidates" value={String(campaigns.filter((c) => c.action === 'Refresh').length)} footer="Frequency and CTR signals" Icon={RefreshCw}/><Stat title="Scale candidates" value={String(campaigns.filter((c) => c.action === 'Scale candidate').length)} footer="Requires human economics validation" Icon={TrendingUp}/><Stat title="Needs investigation" value={String(campaigns.filter((c) => c.action === 'Investigate').length)} footer="Check funnel and qualification" Icon={CircleAlert}/></div>
          <div className="recommendations">{campaigns.map((c) => <div key={c.id} className="recommendation"><div className="rec-icon">{c.action === 'Refresh' ? <RefreshCw size={21}/> : c.action === 'Scale candidate' ? <TrendingUp size={21}/> : <Activity size={21}/>}</div><div><div className="rec-heading"><h2>{c.name}</h2><span className={`status ${c.action.toLowerCase().replaceAll(' ', '-')}`}>{c.action}</span></div><p>{c.reason}</p><small>Evidence: CTR {formatPercent(c.ctrPct)} · frequency ~{c.frequencyApprox}× · qualified leads {c.qualified} · paid {c.paid}</small></div><ArrowRight size={18} className="rec-arrow"/></div>)}</div>
          <div className="policy-note"><Database size={20}/><p>These example decision rules are transparent heuristics, not instructions to automatically change live budgets. Before any real scale/pause decisions, validate unit economics, cohort maturity, attribution, ad-level reach and confidence in the source data.</p></div>
        </>}

        {view === 'students' && <>
          <div className="student-scope"><div><strong>Student tracking workspace</strong><span>Performance across delivery volume, experience quality, and learning outcomes.</span></div><span className="synthetic-pill"><ShieldCheck size={14}/> Synthetic records · ID-only view</span></div>
          <div className="student-filters">
            <label>Cohort<select value={studentCohort} onChange={(e) => setStudentCohort(e.target.value)}><option>All cohorts</option><option>Cohort A</option><option>Cohort B</option><option>Cohort C</option></select></label>
            <label>Activity cadence<select value={studentCadence} onChange={(e) => setStudentCadence(e.target.value as Cadence | 'All cadences')}><option>All cadences</option><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option></select></label>
            <label className="student-search"><Search size={16}/><input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search student ID" aria-label="Search student ID"/></label>
          </div>
          <div className="stats-grid">
            <Stat title="Active students" value={String(studentData.activeStudents)} footer="Completed at least one activity" Icon={Users}/>
            <Stat title="Activity completion" value={`${studentData.activityCompletionPct}%`} footer={`${studentData.records.filter((r) => r.completed).length.toLocaleString('en-IN')} completed of ${studentData.records.length.toLocaleString('en-IN')} planned`} Icon={CheckCircle2}/>
            <Stat title="Experience quality" value={studentData.averageQuality === null ? 'N/A' : `${studentData.averageQuality.toFixed(1)} / 5`} footer={`Average post-activity rating · ${studentData.qualityResponsePct ?? 0}% response coverage`} Icon={HeartPulse}/>
            <Stat title="Learning outcomes" value={studentData.averageOutcome === null ? 'N/A' : `${Math.round(studentData.averageOutcome)}%`} footer={`${studentData.riskStudents} students need a progress review`} Icon={BookOpenCheck}/>
          </div>
          <div className="two-panels">
            <Section title="Weekly activity and experience trend" subtitle="Completion is completed ÷ planned activities; quality is a 1–5 student pulse score.">
              <div className="chart-holder"><ResponsiveContainer width="100%" height="100%"><LineChart data={studentData.weeklyTrend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0eb"/><XAxis dataKey="week" tick={{ fontSize: 10, fill: '#80918d' }} minTickGap={20}/><YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10, fill: '#80918d' }} tickFormatter={(v: number) => `${v}%`}/><YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 10, fill: '#80918d' }}/><Tooltip/><Legend/><Line yAxisId="left" type="monotone" dataKey="completionPct" name="Activity completion" stroke="#1d6358" strokeWidth={2.5} dot={false}/><Line yAxisId="right" type="monotone" dataKey="quality" name="Experience rating" stroke="#d6ab5a" strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer></div>
            </Section>
            <Section title="Cohort learning progress" subtitle="Mean assessment and milestone score by cohort.">
              {studentData.cohortSummaries.length ? <div className="cohort-list">{studentData.cohortSummaries.map((cohort) => <div className="cohort-card" key={cohort.cohort}><div className="cohort-head"><strong>{cohort.cohort}</strong><span>{cohort.students} students</span></div><div className="cohort-score"><span>Activity completion</span><strong>{Math.round(cohort.completionPct)}%</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, cohort.completionPct)}%` }}/></div><div className="cohort-score"><span>Learning outcome</span><strong>{Math.round(cohort.outcome)}%</strong></div><div className="progress-track outcome"><span style={{ width: `${Math.min(100, cohort.outcome)}%` }}/></div></div>)}</div> : <p className="no-results">No student activity in this selection.</p>}
            </Section>
          </div>
          <div className="two-panels student-lower">
            <Section title="Program delivery and experience" subtitle="Planned opportunities, completion rate, and feedback by activity.">
              {studentData.activitySummaries.length ? <div className="table-scroll"><table className="data-table student-activity-table"><thead><tr><th>Activity</th><th>Cadence</th><th>Completed / planned</th><th>Completion</th><th>Quality / 5</th></tr></thead><tbody>{studentData.activitySummaries.map((item) => <tr key={item.activity}><td><strong>{item.activity}</strong></td><td>{item.cadence}</td><td>{item.completed} / {item.planned}</td><td><span className={`completion-tag ${item.completionPct < 65 ? 'needs-attention' : ''}`}>{item.completionPct}%</span></td><td>{item.quality === null ? 'N/A' : item.quality.toFixed(1)}</td></tr>)}</tbody></table></div> : <p className="no-results">No activities match the selected filters.</p>}
            </Section>
            <Section title="Student progress review" subtitle="Use the list to guide mentor follow-up; thresholds are demo assumptions.">
              <div className="table-scroll"><table className="data-table student-progress-table"><thead><tr><th>Student</th><th>Cohort</th><th>Completion</th><th>Pulse</th><th>Learning</th><th>Review</th></tr></thead><tbody>{visibleStudents.map((student) => { const needsReview = student.completionPct < 65 || (student.outcome !== null && student.outcome < 60); const dataPending = student.outcome === null; return <tr key={student.studentId}><td><strong>{student.studentId}</strong><small>{student.focusMinutes ? `${Math.round(student.focusMinutes / 60 * 10) / 10} focus hrs` : 'No focus data'}</small></td><td>{student.cohort}</td><td>{student.completionPct}%</td><td>{student.quality === null ? 'N/A' : `${student.quality.toFixed(1)} / 5`}</td><td>{student.outcome === null ? 'N/A' : `${Math.round(student.outcome)}%`}</td><td><span className={`status ${needsReview ? 'refresh' : dataPending ? 'data-pending' : 'scale-candidate'}`}>{needsReview ? 'Review' : dataPending ? 'Data pending' : 'On track'}</span></td></tr>; })}</tbody></table>{visibleStudents.length === 0 && <p className="no-results">No student IDs match your search.</p>}</div>
            </Section>
          </div>
          <div className="policy-note"><Clock3 size={19}/><p>Metric definitions: quantity = completed ÷ planned activities; quality = average student pulse rating from completed activities; learning progress = average quiz and roadmap score. In production, restrict student-level access by role, collect only required data, and keep sensitive wellness or wearable data out of general dashboards.</p></div>
        </>}
        <footer className="footer">Prototype version 0.2 · Reference reporting cutoff: 17 Oct 2026 · All business records synthetic · No live integrations <span>Alcovia Product, Systems & Analytics Lead assessment</span></footer>
      </div>
    </main>
  </div>;
}

function MiniAction({ title, value, detail, Icon }: { title: string; value: string; detail: string; Icon: typeof Wallet }) {
  return <div className="mini-action"><div className="mini-icon"><Icon size={19}/></div><div><span>{title}</span><strong>{value}</strong><small>{detail}</small></div><ArrowDownRight size={18} className="mini-arrow"/></div>;
}

