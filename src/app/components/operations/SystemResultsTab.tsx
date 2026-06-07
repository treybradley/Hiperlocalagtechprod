import { TrendingUp, Target, Calendar, Award, AlertCircle, Lightbulb, DollarSign, BarChart3, Clock } from 'lucide-react';
import { HydroponicSystem, GrowCycle } from '../../../storage/models';

interface SystemResultsTabProps {
  system: HydroponicSystem;
  cycles: GrowCycle[];
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SystemResultsTab({ system, cycles }: SystemResultsTabProps) {
  const completedCycles = cycles.filter(c => c.status === 'completed');
  const hasResults = completedCycles.length > 0;

  if (!hasResults) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-2xl flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-green-400/50" />
        </div>
        <h2 className="text-2xl text-white mb-3">No Results Yet</h2>
        <p className="text-white/60 mb-6">
          Complete your first grow cycle to see results and financial projections
        </p>
      </div>
    );
  }

  // ── Core actuals ────────────────────────────────────────────────────────────
  const totalHarvestKg = completedCycles.reduce((s, c) => s + (c.totalHarvestKg || 0), 0);
  const totalRevenue   = completedCycles.reduce((s, c) => s + (c.harvestRevenue || 0), 0);
  const totalCycleCost = completedCycles.reduce((s, c) => s + (c.cycleResults?.totalCost || 0), 0);
  const capitalCost    = system.operatingCosts.totalCapitalCost;
  const monthlyOpCost  = system.operatingCosts.monthlyOperatingCost;

  const avgCycleDays = completedCycles.reduce((s, c) => s + (c.cycleResults?.cycleDuration || 0), 0) / completedCycles.length;
  const avgCycleRevenue = totalRevenue / completedCycles.length;
  const avgCycleCost    = totalCycleCost / completedCycles.length || monthlyOpCost * (avgCycleDays / 30);

  const successRate = (completedCycles.length / Math.max(cycles.length, 1)) * 100;

  // ── Financial projections from actuals ──────────────────────────────────────
  // Cycles per year based on average duration
  const cyclesPerYear = avgCycleDays > 0 ? 365 / avgCycleDays : 0;

  // Annual projection
  const annualRevenue = avgCycleRevenue * cyclesPerYear;
  const annualOpCost  = monthlyOpCost * 12;
  const annualCycleCost = avgCycleCost * cyclesPerYear;
  const annualTotalCost = annualOpCost + annualCycleCost;
  const annualProfit  = annualRevenue - annualTotalCost;

  // Monthly P&L (average month)
  const monthlyRevenue  = annualRevenue / 12;
  const monthlyCost     = annualTotalCost / 12;
  const monthlyProfit   = monthlyRevenue - monthlyCost;

  // Payback period
  const paybackMonths = monthlyProfit > 0 ? capitalCost / monthlyProfit : null;
  const paybackYears  = paybackMonths ? paybackMonths / 12 : null;

  // Overall ROI on capital deployed so far
  const totalProfit = totalRevenue - capitalCost - totalCycleCost;
  const roi = capitalCost > 0 ? (totalProfit / capitalCost) * 100 : 0;

  // ── Best crop ───────────────────────────────────────────────────────────────
  const cropPerformance = completedCycles.reduce((acc, cycle) => {
    if (!cycle.totalHarvestKg) return acc;
    if (!acc[cycle.cropType]) acc[cycle.cropType] = { totalKg: 0, count: 0, revenue: 0 };
    acc[cycle.cropType].totalKg  += cycle.totalHarvestKg;
    acc[cycle.cropType].revenue  += cycle.harvestRevenue || 0;
    acc[cycle.cropType].count    += 1;
    return acc;
  }, {} as Record<string, { totalKg: number; count: number; revenue: number }>);

  const bestCrop = Object.entries(cropPerformance).sort((a, b) => b[1].revenue - a[1].revenue)[0];

  // ── Monthly P&L table (last 12 virtual months from cycle data) ──────────────
  // Build per-cycle monthly snapshots
  const monthlyRows: { label: string; revenue: number; cost: number; profit: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthlyRows.push({
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      revenue: monthlyRevenue,
      cost: monthlyCost,
      profit: monthlyProfit,
    });
  }

  return (
    <div className="space-y-6">

      {/* ── Top KPI row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-white/60">Total Harvest</span>
          </div>
          <div className="text-3xl text-white">{totalHarvestKg.toFixed(1)}<span className="text-base text-white/40 ml-1">kg</span></div>
          <div className="text-xs text-white/40 mt-1">{completedCycles.length} cycles completed</div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-xs text-white/60">Total Revenue</span>
          </div>
          <div className="text-3xl text-white">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-white/40 mt-1">${fmt(avgCycleRevenue)} avg/cycle</div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-400" />
            <span className="text-xs text-white/60">Avg Cycle</span>
          </div>
          <div className="text-3xl text-white">{avgCycleDays.toFixed(0)}<span className="text-base text-white/40 ml-1">days</span></div>
          <div className="text-xs text-white/40 mt-1">{cyclesPerYear.toFixed(1)} cycles/year potential</div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-green-400" />
            <span className="text-xs text-white/60">Success Rate</span>
          </div>
          <div className="text-3xl text-white">{successRate.toFixed(0)}<span className="text-base text-white/40 ml-1">%</span></div>
          <div className="text-xs text-white/40 mt-1">{completedCycles.length} of {cycles.length} cycles</div>
        </div>
      </div>

      {/* ── ROI + Payback hero ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Return on Investment</div>
              <div className="text-5xl text-green-400">{roi.toFixed(1)}<span className="text-2xl">%</span></div>
            </div>
            <TrendingUp className="w-10 h-10 text-green-400/30" />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div>
              <div className="text-xs text-white/40 mb-1">Capital Invested</div>
              <div className="text-white">${capitalCost.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Total Revenue</div>
              <div className="text-white">${totalRevenue.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Net Profit</div>
              <div className={totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}>${fmt(totalProfit)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/60 uppercase tracking-wider">Payback Period</span>
            </div>
            {paybackYears !== null ? (
              <>
                <div className="text-4xl text-white mb-1">
                  {paybackYears < 1 ? paybackMonths!.toFixed(1) : paybackYears.toFixed(1)}
                  <span className="text-lg text-white/40 ml-1">
                    {paybackYears < 1 ? 'mo' : 'yr'}
                  </span>
                </div>
                <div className="text-sm text-white/50">
                  {paybackYears < 1
                    ? `${paybackMonths!.toFixed(1)} months to break even`
                    : `${paybackYears.toFixed(1)} years (${paybackMonths!.toFixed(0)} mo)`}
                </div>
              </>
            ) : (
              <div className="text-white/40 text-sm">Insufficient data</div>
            )}
          </div>
          <div className="pt-4 border-t border-white/10">
            <div className="text-xs text-white/40 mb-1">Based on ${fmt(monthlyProfit)}/mo profit</div>
          </div>
        </div>
      </div>

      {/* ── Annual Projection ────────────────────────────────────────────────── */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <BarChart3 className="w-5 h-5 text-green-400" />
          <h3 className="text-lg text-white">Annual Projection</h3>
          <span className="text-xs text-white/40 ml-auto">Based on {cyclesPerYear.toFixed(1)} cycles/year @ current performance</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-white/40 mb-2">Annual Revenue</div>
            <div className="text-2xl text-green-400">${Math.round(annualRevenue).toLocaleString()}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-white/40 mb-2">Annual Costs</div>
            <div className="text-2xl text-white">${Math.round(annualTotalCost).toLocaleString()}</div>
            <div className="text-xs text-white/30 mt-1">Op: ${Math.round(annualOpCost).toLocaleString()} + Cycle: ${Math.round(annualCycleCost).toLocaleString()}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-white/40 mb-2">Annual Profit</div>
            <div className={`text-2xl ${annualProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${Math.round(annualProfit).toLocaleString()}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-white/40 mb-2">Profit Margin</div>
            <div className={`text-2xl ${annualProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {annualRevenue > 0 ? ((annualProfit / annualRevenue) * 100).toFixed(1) : '0'}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Monthly P&L ──────────────────────────────────────────────────────── */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <DollarSign className="w-5 h-5 text-green-400" />
          <h3 className="text-lg text-white">Monthly P&L</h3>
          <span className="text-xs text-white/40 ml-auto">Projected from actuals</span>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-5 p-4 bg-white/5 rounded-xl">
          <div>
            <div className="text-xs text-white/40 mb-1">Avg Monthly Revenue</div>
            <div className="text-xl text-green-400">${fmt(monthlyRevenue)}</div>
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1">Avg Monthly Cost</div>
            <div className="text-xl text-white">${fmt(monthlyCost)}</div>
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1">Avg Monthly Profit</div>
            <div className={`text-xl ${monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${fmt(monthlyProfit)}</div>
          </div>
        </div>

        {/* 12-month bar chart */}
        <div className="space-y-2">
          {monthlyRows.map((row) => {
            const maxVal = Math.max(...monthlyRows.map(r => r.revenue));
            const revenueWidth = maxVal > 0 ? (row.revenue / maxVal) * 100 : 0;
            const costWidth    = maxVal > 0 ? (row.cost    / maxVal) * 100 : 0;
            return (
              <div key={row.label} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-white/40 shrink-0">{row.label}</span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500/60 rounded-full transition-all" style={{ width: `${revenueWidth}%` }} />
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/40 rounded-full transition-all" style={{ width: `${costWidth}%` }} />
                  </div>
                </div>
                <span className={`w-20 text-right shrink-0 ${row.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${Math.round(row.profit).toLocaleString()}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-4 pt-2 text-xs text-white/30">
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-green-500/60 rounded-full inline-block" /> Revenue</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-red-500/40 rounded-full inline-block" /> Cost</span>
          </div>
        </div>
      </div>

      {/* ── Best Performing Crop ─────────────────────────────────────────────── */}
      {bestCrop && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-5 h-5 text-green-400" />
            <h3 className="text-lg text-white">Best Performing Crop</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-white/40 mb-1">Crop Type</div>
              <div className="text-xl text-white">{bestCrop[0]}</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Total Harvest</div>
              <div className="text-xl text-white">{bestCrop[1].totalKg.toFixed(1)} kg</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Cycles</div>
              <div className="text-xl text-white">{bestCrop[1].count}</div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Revenue</div>
              <div className="text-xl text-green-400">${bestCrop[1].revenue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hypothesis Validation ─────────────────────────────────────────────── */}
      {system.hypothesis && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg text-white">Hypothesis Validation</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-xs text-white/40 mb-2">Original Hypothesis</div>
              <p className="text-white">{system.hypothesis}</p>
            </div>

            {system.variables.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-xs text-white/40 mb-3">Variables Tested</div>
                <div className="space-y-2">
                  {system.variables.map((v, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-white/70">{v.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-green-400">{v.value}</span>
                        {v.controlValue && (
                          <>
                            <span className="text-white/40">vs</span>
                            <span className="text-white/60">{v.controlValue}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {system.results ? (
              <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${system.results.wouldRecommend ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {system.results.wouldRecommend
                      ? <Award className="w-5 h-5 text-green-400" />
                      : <AlertCircle className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white/60 mb-2">
                      {system.results.wouldRecommend ? 'Hypothesis Validated' : 'Hypothesis Not Validated'}
                    </div>
                    <p className="text-white">{system.results.keyFindings}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <p className="text-white/60 text-sm mb-2">Hypothesis validation pending</p>
                <p className="text-xs text-white/40">Continue collecting data across more cycles</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cycle Breakdown ───────────────────────────────────────────────────── */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg text-white mb-4">Cycle Performance Breakdown</h3>
        <div className="space-y-3">
          {completedCycles.map((cycle) => (
            <div key={cycle.id} className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white">{cycle.name}</div>
                  <div className="text-sm text-white/60">{cycle.cropType}</div>
                </div>
                {cycle.cycleResults && (
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    cycle.cycleResults.success
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {cycle.cycleResults.success ? 'Success' : 'Failed'}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <div className="text-xs text-white/40 mb-1">Harvest</div>
                  <div className="text-sm text-white">{cycle.totalHarvestKg?.toFixed(1) || 0} kg</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Duration</div>
                  <div className="text-sm text-white">{cycle.cycleResults?.cycleDuration || 0} days</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Revenue</div>
                  <div className="text-sm text-white">${cycle.harvestRevenue?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Cost</div>
                  <div className="text-sm text-white">${cycle.cycleResults?.totalCost?.toFixed(2) || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Profit Margin</div>
                  <div className="text-sm text-green-400">
                    {((cycle.cycleResults?.profitMargin || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              {cycle.cycleResults?.lessonsLearned && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-white/40 mb-1">Lessons Learned</div>
                  <p className="text-sm text-white/70">{cycle.cycleResults.lessonsLearned}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
