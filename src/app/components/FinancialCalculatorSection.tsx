import { useState, useMemo, useEffect } from 'react';
import {
  DollarSign, Package, Leaf, ChevronDown, ChevronUp, Save, Check, Loader,
  Pencil, Plus,
} from 'lucide-react';
import { useFarmConfig, getTotalPlantsByCrop } from '../contexts/FarmConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { CROP_MAP, CROP_CATEGORY_STYLES, SYSTEM_TYPE_LABELS } from '../data/crops';
import {
  saveFinancialPlan,
  updateFinancialPlan,
  getFinancialPlan,
  type FinancialInputs,
} from '../../storage/operations/financialPlans';
import {
  applyFinancialPlanToState,
  computeFinancialResults,
  DEFAULT_FINANCIAL_INPUTS,
  getCropRevenueBreakdown,
  normalizeFinancialInputs,
} from '../utils/financialPlanHelpers';
import { StartupCostsEditor } from './operations/StartupCostsEditor';

export type PlanLoadRequest =
  | { type: 'load'; planId: string }
  | { type: 'new' };

const FINANCIAL_DRAFT_KEY = 'hiperlocal-financial-draft';

function loadFinancialDraft(): FinancialInputs {
  try {
    const raw = localStorage.getItem(FINANCIAL_DRAFT_KEY);
    if (!raw) return normalizeFinancialInputs(DEFAULT_FINANCIAL_INPUTS);
    return normalizeFinancialInputs(JSON.parse(raw));
  } catch {
    return normalizeFinancialInputs(DEFAULT_FINANCIAL_INPUTS);
  }
}

interface FinancialCalculatorSectionProps {
  isActive: boolean;
  planLoadRequest?: PlanLoadRequest | null;
  onPlanLoadHandled?: () => void;
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

function applyFinancialInputs(
  inputs: FinancialInputs,
  setInputs: (inputs: FinancialInputs) => void
) {
  setInputs(normalizeFinancialInputs(inputs));
}

export function FinancialCalculatorSection({
  isActive,
  planLoadRequest,
  onPlanLoadHandled,
}: FinancialCalculatorSectionProps) {
  const { config, updateCropParam, replaceConfig } = useFarmConfig();
  const { session, openAuthModal } = useAuth();
  const draft = loadFinancialDraft();

  const [inputs, setInputs] = useState<FinancialInputs>(draft);
  const [showResults, setShowResults]   = useState(false);
  const [saveState, setSaveState]       = useState<'idle' | 'naming' | 'saving' | 'saved'>('idle');
  const [planName, setPlanName]         = useState('');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  function patchInputs(patch: Partial<FinancialInputs>) {
    setInputs(prev => ({ ...prev, ...patch }));
  }

  useEffect(() => {
    localStorage.setItem(FINANCIAL_DRAFT_KEY, JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    if (!isActive || !planLoadRequest) return;

    async function handlePlanLoad() {
      if (planLoadRequest!.type === 'new') {
        setEditingPlanId(null);
        setPlanName('');
        setSaveState('idle');
      } else {
        try {
          const plan = await getFinancialPlan(planLoadRequest!.planId);
          applyFinancialPlanToState(plan, replaceConfig, (loaded) => {
            applyFinancialInputs(loaded, setInputs);
          });
          setEditingPlanId(plan.id);
          setPlanName(plan.name);
          setSaveState('idle');
        } catch (e) {
          console.error('Failed to load financial plan:', e);
        }
      }
      onPlanLoadHandled?.();
    }

    handlePlanLoad();
  }, [isActive, planLoadRequest]);

  // Derive total plants per crop from all system blocks
  const totalPlantsByCrop = useMemo(
    () => getTotalPlantsByCrop(config.systemBlocks),
    [config.systemBlocks]
  );

  // Crops that appear in at least one system block
  const activeCropIds = Object.keys(totalPlantsByCrop);

  const calc = useMemo(
    () => computeFinancialResults(config, inputs),
    [inputs, config]
  );

  function handleStartNewPlan() {
    setEditingPlanId(null);
    setPlanName('');
    setSaveState('idle');
  }

  async function doSave() {
    if (!planName.trim()) return;
    if (!session) {
      openAuthModal(() => doSave());
      return;
    }
    setSaveState('saving');
    const payload = {
      name: planName.trim(),
      config,
      results: calc,
      financialInputs: inputs,
    };
    try {
      if (editingPlanId) {
        await updateFinancialPlan(editingPlanId, payload);
      } else {
        const created = await saveFinancialPlan(payload);
        setEditingPlanId(created.id);
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (e) {
      console.error('Error saving financial plan:', e);
      setSaveState('naming');
    }
  }

  function handleStartSave(asNew = false) {
    const start = () => {
      if (asNew) {
        setEditingPlanId(null);
        setPlanName('My Farm Plan');
      } else {
        setPlanName(editingPlanId ? planName || 'My Farm Plan' : 'My Farm Plan');
      }
      setSaveState('naming');
    };
    if (!session) {
      openAuthModal(start);
      return;
    }
    start();
  }

  const profitColor = calc.monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400';
  const profitBg    = calc.monthlyProfit >= 0
    ? 'from-green-500/20 to-green-500/5 border-green-500/30'
    : 'from-red-500/20 to-red-500/5 border-red-500/30';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className={`relative h-full max-w-7xl mx-auto px-4 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>

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
          <div className="flex-1 overflow-y-auto space-y-4 pt-[81px] pb-24">
            <div className="pb-2">
              <h2 className="text-white font-thin tracking-tight text-3xl pt-3">
                Financial Model
                <span className="text-white/40 ml-3 text-xl">Calculator</span>
              </h2>
              <p className="text-white/40 text-xs mt-1">Enter your real numbers — results update live</p>
              {editingPlanId && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-xs text-green-400">
                    <Pencil className="w-3 h-3" />
                    Editing: {planName}
                  </span>
                  <button
                    onClick={handleStartNewPlan}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    Start fresh
                  </button>
                </div>
              )}
            </div>

            {!session && (
              <div className="bg-white/3 border border-white/8 rounded-2xl px-5 py-4 text-sm text-white/40">
                Sign in to save plans. View and manage saved plans in Operations.
              </div>
            )}

            {/* Costs — startup capital & monthly operating */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white/60 uppercase tracking-wider">Startup Capital</span>
                    <span className="ml-auto text-sm text-white">${fmt(calc.totalCapital)}</span>
                  </div>
                  <StartupCostsEditor
                    items={inputs.startupItems}
                    onChange={startupItems => patchInputs({ startupItems })}
                  />
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-white/60 uppercase tracking-wider">Monthly Operating Costs</span>
                    <span className="ml-auto text-sm text-white">${fmt(calc.totalMonthlyOp)}/mo</span>
                  </div>
                  <InputRow label="Electricity"         value={inputs.electricity}  onChange={v => patchInputs({ electricity: v })}  step={100} prefix="$" suffix="/mo" />
                  <InputRow label="Water"               value={inputs.water}        onChange={v => patchInputs({ water: v })}         step={50}  prefix="$" suffix="/mo" />
                  <InputRow label="Nutrients & supplies" value={inputs.nutrients}    onChange={v => patchInputs({ nutrients: v })}    step={100} prefix="$" suffix="/mo" />
                  <InputRow label="Labor"               value={inputs.labor}        onChange={v => patchInputs({ labor: v })}         step={500} prefix="$" suffix="/mo" />
                  <InputRow label="Other (rent, misc.)" value={inputs.otherMonthly} onChange={v => patchInputs({ otherMonthly: v })} step={100} prefix="$" suffix="/mo" />
                </div>
              </div>
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
                const breakdown = getCropRevenueBreakdown(total, p);
                const style    = CROP_CATEGORY_STYLES[cropDef.category];
                return (
                  <div key={cropId} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="mb-4 pb-3 border-b border-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Leaf className="w-4 h-4 text-green-400 shrink-0" />
                          <div>
                            <span className={`px-2 py-0.5 rounded-full border text-xs ${style}`}>{cropDef.name}</span>
                            <p className="text-xs text-white/30 mt-1">{total} {cropDef.unitLabel}s in farm design</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">All {total} {cropDef.unitLabel}s</p>
                          <p className="text-sm text-green-400">${fmt(breakdown.monthlyRev)}/mo</p>
                        </div>
                      </div>
                      <div className="mt-2 rounded-lg bg-white/3 px-3 py-2 text-[11px] text-white/50 leading-relaxed space-y-0.5">
                        <p>
                          {total} × {p.yieldPerUnitPerCycle} kg/cycle × {p.cyclesPerYear} cycles/yr
                          {p.lossRate > 0 ? ` × ${100 - p.lossRate}% after loss` : ''}
                          {' '}= {fmt(breakdown.monthlyKg, 1)} kg/mo × ${fmt(p.pricePerKg)}/kg
                        </p>
                        {total > 0 && (
                          <p className="text-white/35">
                            ≈ ${fmt(breakdown.perUnitMonthlyRev, 2)}/{cropDef.unitLabel}/mo
                          </p>
                        )}
                      </div>
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

            {/* Save Plan */}
            <div className="flex flex-wrap items-center gap-3">
              {saveState === 'idle' && (
                <>
                  <button
                    onClick={handleStartSave}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full text-sm hover:bg-green-500/25 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {editingPlanId ? 'Update plan' : 'Save this plan'}
                  </button>
                  {editingPlanId && (
                    <button
                      onClick={() => handleStartSave(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-full text-sm hover:bg-white/10 hover:text-white transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Save as new
                    </button>
                  )}
                </>
              )}

              {saveState === 'naming' && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') doSave(); }}
                    placeholder="Plan name…"
                    className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                    autoFocus
                  />
                  <button
                    onClick={doSave}
                    disabled={!planName.trim()}
                    className="px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-40 transition-all"
                  >
                    Save
                  </button>
                  <button onClick={() => setSaveState('idle')} className="text-white/30 hover:text-white/60 text-xs px-2">cancel</button>
                </div>
              )}

              {saveState === 'saving' && (
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving plan…
                </div>
              )}

              {saveState === 'saved' && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  Plan saved!
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Results (desktop) */}
          <div className="hidden sm:flex w-80 flex-col gap-4 overflow-y-auto pt-6 pb-24">
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
