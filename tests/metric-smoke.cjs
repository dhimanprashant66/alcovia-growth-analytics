/* After compiling metrics/data to CommonJS in a temporary validation directory, run this with Node. */
const assert = require('node:assert/strict');
const metrics = require('./lib/metrics.js');
const sample = require('./data/sampleData.js');
const range = { start: '2026-10-01', end: '2026-10-17' };
const revenue = metrics.revenueForRange(range);
const funnel = metrics.funnelForRange(range);
const campaigns = metrics.campaignForRange(range);
assert.equal(revenue.netPaise, revenue.programPaise + revenue.workshopPaise, 'revenue breakdown reconciliation');
assert(revenue.targetPaise > 0, 'target must be positive');
assert(revenue.netPaise > 0, 'demo collected revenue must be positive');
assert(funnel.counts.every((item, i, arr) => i === 0 || item.count <= arr[i-1].count), 'funnel progression must be monotonic');
assert.equal(funnel.counts[0].count, funnel.leadCount, 'lead cohort count');
assert.equal(campaigns.length, sample.campaigns.length, 'campaign count');
assert(campaigns.every((c) => c.ctrPct >= 0 && c.ctrPct <= 100), 'CTR valid');
assert(sample.payments.every((p) => p.amountPaise >= 0), 'nonnegative payment amounts');
console.log('PASS: 8 dashboard metric smoke checks');
console.log({ netRevenue: metrics.money(revenue.netPaise), cohortLeads: funnel.leadCount, paid: funnel.paid, campaignDecisions: campaigns.map(c => c.action) });
