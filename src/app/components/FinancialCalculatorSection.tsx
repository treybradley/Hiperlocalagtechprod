import { useState, useMemo } from 'react';
import { DollarSign, Package, Leaf, ChevronDown, ChevronUp } from 'lucide-react';
import { useFarmConfig, getTotalPlantsByCrop } from '../contexts/FarmConfigContext';
import { CROPS, CROP_MAP, CROP_CATEGORY_STYLES, SYSTEM_TYPE_LABELS } from '../data/crops';

interface FinancialCalculatorSectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function InputRow({ label, value, onChange, step = 100, prefix = '$', suffix = '' }: {
  label: string; value: number; onChange: (v: number) => void;
  step?: number; prefix?: string; suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/60 shrink-0">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {prefix && <span className="text-xs text-white/40">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          step={step}
          onKeyDown={e => e.stopPropagation()}
          className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-right text-sm text-white focus:outline-none focus:border-green-500/50"
        />
        {suffix && <span className="text-xs text-white/40">{suffix}</span>}
      </div>
    </div>
  );
}

export function FinancialCalculatorSection({ isActive }: FinancialCalculatorSectionProps) {
  const { config, updateCropParam } = useFarmConfig();

  const [systemCost, setSystemCost]     = useState(45000);
  const [installCost, setInstallCost]   = useState(8000);
  const [electricity, setElectricity]   = useState(3200);
  const [water, setWater]               = useState(400);
  const [nutrients, setNutrients]       = useState(1800);
  const [labor, setLabor]               = useState(8000);
  const [otherMonthly, setOtherMonthly] = useState(1000);
  const [showResults, setShowResults]   = useState(false);

  // Derive total plants per crop from all system blocks
  const totalPlantsByCrop = useMemo(
    () => getTotalPlantsByCrop(config.systemBlocks),
    [config.systemBlocks]
  );

  // Crops that appear in at least one system block
  const activeCropIds = Object.keys(totalPlantsByCrop);

  const calc = useMemo(() => {
    const totalCapital    = systemCost + installCost;
    const totalMonthlyOp  = electricity + water + nutrients + labor + otherMonthly;
    const annualCosts     = totalMonthlyOp * 12;

    let totalMonthlyRevenue = 0;
    let totalAnnualYieldKg  = 0;

    const perCrop = activeCropIds.map(cropId => {
      const p          = config.cropParams[cropId];
      const totalUnits = totalPlantsByCrop[cropId] ?? 0;
      const annualYield  = totalUnits * p.yieldPerUnitPerCycle * p.cyclesPerYear * (1 - p.lossRate / 100);
      const monthlyYield = annualYield / 12;
      const monthlyRev   = monthlyYield * p.pricePerKg;
      totalMonthlyRevenue += monthlyRev;
      totalAnnualYieldKg  += annualYield;
      return { cropId, totalUnits, monthlyRev, annualYield };
    });

    const annualRevenue  = totalMonthlyRevenue * 12;
    const monthlyProfit  = totalMonthlyRevenue - totalMonthlyOp;
    const annualProfit   = monthlyProfit * 12;
    const paybackMonths  = monthlyProfit > 0 ? totalCapital / monthlyProfit : null;
    const roi            = totalCapital > 0 ? (annualProfit / totalCapital) * 100 : 0;
    const margin         = totalMonthlyRevenue > 0 ? (monthlyProfit / totalMonthlyRevenue) * 100 : 0;

    return {
      totalCapital, totalMonthlyOp, monthlyRevenue: totalMonthlyRevenue,
      annualRevenue, monthlyProfit, annualProfit, annualCosts,
      paybackMonths, roi, margin,
      annualYieldKg: totalAnnualYieldKg,
      monthlyYieldKg: totalAnnualYieldKg / 12,
      perCrop,
    };
  }, [systemCost, installCost, electricity, water, nutrients, labor, otherMonthly,
      config.cropParams, activeCropIds, totalPlantsByCrop]);

  const profitColor = calc.monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400';
  const profitBg    = calc.monthlyProfit >= 0
    ? 'from-green-500/20 to-green-500/5 border-green-500/30'
    : 'from-red-500/20 to-red-500/5 border-red-500/30';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>

        {/* Mobile: sticky results bar */}
        <div className="sm:hidden mb-4">
          <button
            onClick={() => setShowResults(v => !v)}
            className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3 mt-20"
          >
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-white/40">Monthly</div>
                <div className={`text-lg ${profitColor}`}>${fmt(calc.monthlyProfit)}</div>
              </div>
              <div>
                <div className="text-xs text-white/40">ROI</div>
                <div className={`text-lg ${profitColor}`}>{fmt(calc.roi, 1)}%</div>
              </div>
              <div>
                <div className="text-xs text-white/40">Payback</div>
                <div className="text-lg text-white">{calc.paybackMonths ? `${fmt(calc.paybackMonths, 0)}mo` : '—'}</div>
              </div>
            </div>
            {showResults ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
          </button>
          {showResults && (
            <div className="mt-2 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <ResultsContent calc={calc} profitColor={profitColor} profitBg={profitBg} fmt={fmt} />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row h-full gap-6 overflow-hidden">

          {/* LEFT: Inputs */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pt-12 pb-24">
            <div className="pb-2">
              <h2 className="text-white font-thin tracking-tight text-3xl pt-3">
                Financial Model
                <span className="text-white/40 ml-3 text-xl">Calculator</span>
              </h2>
              <p className="text-white/40 text-xs mt-1">Enter your real numbers — results update live</p>
            </div>

            {/* Capital */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-white/60 uppercase tracking-wider">Startup Capital</span>
                <span className="ml-auto text-sm text-white">${fmt(calc.totalCapital)}</span>
              </div>
              <InputRow label="System / equipment cost" value={systemCost}  onChange={setSystemCost}  step={1000} />
              <InputRow label="Installation & setup"    value={installCost} onChange={setInstallCost} step={500}  />
            </div>

            {/* Operating */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-red-400" />
                <span className="text-xs text-white/60 uppercase tracking-wider">Monthly Operating Costs</span>
                <span className="ml-auto text-sm text-white">${fmt(calc.totalMonthlyOp)}/mo</span>
              </div>
              <InputRow label="Electricity"         value={electricity}  onChange={setElectricity}  step={100} prefix="$" suffix="/mo" />
              <InputRow label="Water"               value={water}        onChange={setWater}         step={50}  prefix="$" suffix="/mo" />
              <InputRow label="Nutrients & supplies" value={nutrients}    onChange={setNutrients}    step={100} prefix="$" suffix="/mo" />
              <InputRow label="Labor"               value={labor}        onChange={setLabor}         step={500} prefix="$" suffix="/mo" />
              <InputRow label="Other (rent, misc.)" value={otherMonthly} onChange={setOtherMonthly} step={100} prefix="$" suffix="/mo" />
            </div>

            {/* System summary */}
            {config.systemBlocks.length > 0 && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-2">
                <div className="text-xs text-white/30 uppercase tracking-wider mb-3">System configuration (from Configurator)</div>
                {config.systemBlocks.map(block => {
                  const totalUnits = block.cropAllocations.reduce((s, a) => s + a.unitCount, 0);
                  return (
                    <div key={block.id} className="flex items-center gap-2 text-xs">
                      <span className="text-white/60">{totalUnits}× {SYSTEM_TYPE_LABELS[block.systemType]}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-white/40">
                        {block.cropAllocations.map(a => {
                          const crop = CROP_MAP[a.cropId];
                          return `${a.plantsPerUnit * a.unitCount} ${crop?.name ?? a.cropId}`;
                        }).join(', ') || 'no crops assigned'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Per-crop production */}
            {activeCropIds.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-white/40 text-sm">No crops assigned to any system. Go to the Configurator slide to set up your systems.</p>
              </div>
            ) : (
              activeCropIds.map(cropId => {
                const cropDef  = CROP_MAP[cropId];
                if (!cropDef) return null;
                const p        = config.cropParams[cropId];
                const total    = totalPlantsByCrop[cropId] ?? 0;
                const entry    = calc.perCrop.find(pc => pc.cropId === cropId);
                const style    = CROP_CATEGORY_STYLES[cropDef.category];
                return (
                  <div key={cropId} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Leaf className="w-4 h-4 text-green-400" />
                      <span className={`px-2 py-0.5 rounded-full border text-xs ${style}`}>{cropDef.name}</span>
                      <span className="text-xs text-white/30 ml-1">{total} {cropDef.unitLabel}s total</span>
                      <span className="ml-auto text-sm text-green-400">${fmt(entry?.monthlyRev ?? 0)}/mo</span>
                    </div>
                    <InputRow
                      label={`Yield per ${cropDef.unitLabel}/cycle (kg)`}
                      value={p.yieldPerUnitPerCycle}
                      onChange={v => updateCropParam(cropId, { yieldPerUnitPerCycle: v })}
                      step={0.01} prefix="" suffix="kg"
                    />
                    <InputRow
                      label="Cycles per year"
                      value={p.cyclesPerYear}
                      onChange={v => updateCropParam(cropId, { cyclesPerYear: v })}
                      step={1} prefix="" suffix="cycles"
                    />
                    <InputRow
                      label="Price per kg"
                      value={p.pricePerKg}
                      onChange={v => updateCropParam(cropId, { pricePerKg: v })}
                      step={10} prefix="$" suffix="/kg"
                    />
                    <InputRow
                      label="Harvest loss"
                      value={p.lossRate}
                      onChange={v => updateCropParam(cropId, { lossRate: v })}
                      step={1} prefix="" suffix="%"
                    />
                  </div>
                );
              })
            )}

            {/* Aggregate summary */}
            {activeCropIds.length > 0 && (
              <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-white/40 mb-1">Annual yield (all crops)</div>
                  <div className="text-white">{fmt(calc.annualYieldKg, 1)} kg</div>
                </div>
                <div>
                  <div className="text-white/40 mb-1">Monthly yield</div>
                  <div className="text-white">{fmt(calc.monthlyYieldKg, 1)} kg</div>
                </div>
                <div>
                  <div className="text-white/40 mb-1">Annual revenue</div>
                  <div className="text-green-400">${fmt(calc.annualRevenue)}</div>
                </div>
                <div>
                  <div className="text-white/40 mb-1">Annual costs</div>
                  <div className="text-white">${fmt(calc.annualCosts)}</div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Results (desktop) */}
          <div className="hidden sm:flex w-80 flex-col gap-4 overflow-y-auto pt-[138px] pb-24">
            <ResultsContent calc={calc} profitColor={profitColor} profitBg={profitBg} fmt={fmt} />
          </div>

        </div>
      </div>
    </div>
  );
}

interface CalcResult {
  totalCapital: number; totalMonthlyOp: number; monthlyRevenue: number; annualRevenue: number;
  monthlyProfit: number; annualProfit: number; annualCosts: number; paybackMonths: number | null;
  roi: number; margin: number; monthlyYieldKg: number; annualYieldKg: number;
}

function ResultsContent({ calc, profitColor, profitBg, fmt }: {
  calc: CalcResult;
  profitColor: string;
  profitBg: string;
  fmt: (n: number, d?: number) => string;
}) {
  return (
    <>
      <div className={`bg-gradient-to-br ${profitBg} border rounded-2xl p-5`}>
        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Monthly Profit</div>
        <div className={`text-4xl ${profitColor}`}>${fmt(calc.monthlyProfit)}</div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
          <div><div className="text-white/40 mb-1">Revenue</div><div className="text-green-400">${fmt(calc.monthlyRevenue)}</div></div>
          <div><div className="text-white/40 mb-1">Costs</div><div className="text-white">${fmt(calc.totalMonthlyOp)}</div></div>
          <div><div className="text-white/40 mb-1">Margin</div><div className={profitColor}>{fmt(calc.margin, 1)}%</div></div>
          <div><div className="text-white/40 mb-1">Annual profit</div><div className={profitColor}>${fmt(calc.annualProfit)}</div></div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Return on Investment</div>
        <div className={`text-4xl ${profitColor}`}>{fmt(calc.roi, 1)}<span className="text-xl">%</span></div>
        <div className="text-xs text-white/40 mt-2">On ${fmt(calc.totalCapital)} capital</div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Payback Period</div>
        {calc.paybackMonths !== null && calc.paybackMonths > 0 ? (
          <>
            <div className="text-4xl text-white">
              {calc.paybackMonths < 24 ? fmt(calc.paybackMonths, 0) : fmt(calc.paybackMonths / 12, 1)}
              <span className="text-xl text-white/40 ml-1">{calc.paybackMonths < 24 ? 'mo' : 'yr'}</span>
            </div>
            <div className="text-xs text-white/40 mt-2">
              {calc.paybackMonths < 24
                ? `${fmt(calc.paybackMonths / 12, 1)} years`
                : `${fmt(calc.paybackMonths, 0)} months`}
            </div>
          </>
        ) : (
          <div className="text-white/40">{calc.monthlyProfit <= 0 ? 'Not profitable yet' : '—'}</div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="text-xs text-white/50 uppercase tracking-wider mb-4">Annual Projection</div>
        <div className="space-y-3">
          {[
            { label: 'Revenue', value: calc.annualRevenue,            color: 'bg-green-500/60' },
            { label: 'Costs',   value: calc.annualCosts,              color: 'bg-red-500/40'   },
            { label: 'Profit',  value: Math.abs(calc.annualProfit),   color: calc.annualProfit >= 0 ? 'bg-green-400' : 'bg-red-400' },
          ].map(row => {
            const max = Math.max(calc.annualRevenue, calc.annualCosts);
            const pct = max > 0 ? (row.value / max) * 100 : 0;
            return (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">{row.label}</span>
                  <span className={row.label === 'Profit' ? (calc.annualProfit >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white'}>
                    ${fmt(row.value)}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full">
                  <div className={`h-full ${row.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
