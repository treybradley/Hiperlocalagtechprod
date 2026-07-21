import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  ArrowLeft, Save, Check, Loader, Trash2, Copy, TrendingUp, Package, DollarSign, Leaf, Box,
  Activity, Percent, Scale,
} from 'lucide-react';
import type { FarmConfig } from '../../contexts/FarmConfigContext';
import { getTotalPlantsByCrop } from '../../contexts/FarmConfigContext';
import {
  getFinancialPlan,
  updateFinancialPlan,
  deleteFinancialPlan,
  type FinancialInputs,
  type FinancialPlan,
} from '../../../storage/operations/financialPlans';
import { CROP_MAP, CROP_CATEGORY_STYLES } from '../../data/crops';
import {
  fmtCurrency,
  formatPlanDate,
  describeSystemBlock,
  computeFinancialResults,
  DEFAULT_FINANCIAL_INPUTS,
  updateCropParamInConfig,
  getCropRevenueBreakdown,
  duplicateFinancialPlanFromData,
  normalizeFinancialInputs,
} from '../../utils/financialPlanHelpers';
import { ConfirmDialog } from './modals/ConfirmDialog';
import { StartupCostsEditor } from './StartupCostsEditor';

interface FinancialPlanDetailSectionProps {
  planId: string;
  onBack: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  onDuplicated: (planId: string) => void;
}

function MetricCard({ label, value, sub, color = 'text-white', icon: Icon }: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-white/40" />
        <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl ${color}`}>{value}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

function EditableRow({ label, value, onChange, step = 100, prefix = '$', suffix = '' }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  prefix?: string;
  suffix?: string;
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
          className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-right text-sm text-white focus:outline-none focus:border-green-500/50"
        />
        {suffix && <span className="text-xs text-white/40">{suffix}</span>}
      </div>
    </div>
  );
}

export function FinancialPlanDetailSection({
  planId,
  onBack,
  onSaved,
  onDeleted,
  onDuplicated,
}: FinancialPlanDetailSectionProps) {
  const [planMeta, setPlanMeta] = useState<Pick<FinancialPlan, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [planName, setPlanName] = useState('');
  const [config, setConfig] = useState<FarmConfig | null>(null);
  const [inputs, setInputs] = useState<FinancialInputs>(DEFAULT_FINANCIAL_INPUTS);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    setLoading(true);
    getFinancialPlan(planId)
      .then(plan => {
        setPlanMeta({ id: plan.id, createdAt: plan.createdAt, updatedAt: plan.updatedAt });
        setPlanName(plan.name);
        setConfig(plan.config as FarmConfig);
        setInputs(normalizeFinancialInputs(plan.financialInputs));
        setSaveState('idle');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [planId]);

  const calc = useMemo(
    () => (config ? computeFinancialResults(config, inputs) : null),
    [config, inputs]
  );

  const totalPlantsByCrop = useMemo(
    () => (config ? getTotalPlantsByCrop(config.systemBlocks) : {}),
    [config]
  );
  const activeCropIds = Object.keys(totalPlantsByCrop);

  function patchInputs(patch: Partial<FinancialInputs>) {
    setInputs(prev => ({ ...prev, ...patch }));
    setSaveState('idle');
  }

  function patchCropParam(cropId: string, param: Parameters<typeof updateCropParamInConfig>[2]) {
    setConfig(prev => (prev ? updateCropParamInConfig(prev, cropId, param) : prev));
    setSaveState('idle');
  }

  async function handleSave() {
    if (!planMeta || !config || !planName.trim()) return;
    setSaveState('saving');
    try {
      const updated = await updateFinancialPlan(planMeta.id, {
        name: planName.trim(),
        config,
        results: calc!,
        financialInputs: inputs,
      });
      setPlanMeta({ id: updated.id, createdAt: updated.createdAt, updatedAt: updated.updatedAt });
      setSaveState('saved');
      onSaved();
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (e) {
      console.error('Failed to save plan:', e);
      alert('Failed to save plan. Please try again.');
      setSaveState('idle');
    }
  }

  async function handleDuplicate() {
    if (!config || !calc) return;
    setDuplicating(true);
    try {
      const copy = await duplicateFinancialPlanFromData(planName, config, inputs);
      onDuplicated(copy.id);
    } catch (e) {
      console.error('Failed to duplicate plan:', e);
      alert('Failed to duplicate plan. Please try again.');
    } finally {
      setDuplicating(false);
    }
  }

  async function handleDelete() {
    if (!planMeta) return;
    setDeleting(true);
    try {
      await deleteFinancialPlan(planMeta.id);
      setShowDeleteConfirm(false);
      onDeleted();
    } catch (e) {
      console.error('Failed to delete plan:', e);
      alert('Failed to delete plan. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
        <div className="flex items-center justify-center h-full text-white/60">Loading plan…</div>
      </div>
    );
  }

  if (!config || !calc || !planMeta) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-white/60">Plan not found</p>
          <button onClick={onBack} className="text-green-400 text-sm hover:text-green-300">← Back</button>
        </div>
      </div>
    );
  }

  const profitColor = calc.monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400';
  const paybackLabel = calc.paybackMonths
    ? calc.paybackMonths < 24
      ? `${fmtCurrency(calc.paybackMonths, 0)} months`
      : `${fmtCurrency(calc.paybackMonths / 12, 1)} years`
    : 'Not profitable yet';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-4 py-8 md:py-12 pt-20 md:pt-24">
        <div className="flex flex-col h-full gap-6 overflow-y-auto pl-0 pr-0 pt-[21px] pb-[96px]">

          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors w-fit text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Operations
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={planName}
                onChange={e => { setPlanName(e.target.value); setSaveState('idle'); }}
                className="w-full bg-transparent text-white tracking-tight text-[32px] focus:outline-none border-b border-transparent focus:border-green-500/40 pb-1"
              />
              <p className="text-white/40 text-sm mt-1">
                Updated {formatPlanDate(planMeta.updatedAt)} · Saved {formatPlanDate(planMeta.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-[18px] py-[9px] transition-all disabled:opacity-40"
                title="Create a copy of this plan"
              >
                {duplicating
                  ? <Loader className="w-4 h-4 text-white/60 animate-spin" />
                  : <Copy className="w-4 h-4 text-white/60" />}
                <span className="text-white/70 text-[12px] hidden sm:inline">Duplicate</span>
              </button>
              {saveState === 'idle' && (
                <button
                  onClick={handleSave}
                  disabled={!planName.trim()}
                  className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-[18px] py-[9px] transition-all disabled:opacity-40"
                >
                  <Save className="w-4 h-4 text-green-400" />
                  <span className="text-white text-[12px]">Save Changes</span>
                </button>
              )}
              {saveState === 'saving' && (
                <div className="flex items-center gap-2 text-white/40 text-sm px-3">
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving…
                </div>
              )}
              {saveState === 'saved' && (
                <div className="flex items-center gap-2 text-green-400 text-sm px-3">
                  <Check className="w-4 h-4" />
                  Saved!
                </div>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-white/40 hover:text-red-400 transition-colors"
                title="Delete plan"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Live metrics */}
          <div className="space-y-4">
            {/* Farm design (read-only — set in planner configurator) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Box className="w-4 h-4 text-green-400" />
                <h2 className="text-sm text-white/70 uppercase tracking-wider">Farm Design</h2>
              </div>
              {config.systemBlocks.length === 0 ? (
                <p className="text-sm text-white/40">No systems configured</p>
              ) : (
                <div className="space-y-3">
                  {config.systemBlocks.map(block => (
                    <div key={block.id} className="text-sm text-white/70 bg-white/3 rounded-lg px-3 py-2">
                      {describeSystemBlock(block)}
                    </div>
                  ))}
                  <div className="pt-2 space-y-1 text-xs text-white/40">
                    <div>Environment: {config.environment.replace('-', ' ')}</div>
                    <div>Lighting: {config.lighting}% · Automation: {config.automation}</div>
                  </div>
                </div>
              )}
              <p className="text-xs text-white/30 mt-4">
                To change system layout or crops, use the planner configurator and save again.
              </p>
            </div>

            <div>
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-3">Monthly P&amp;L</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Monthly Revenue" value={`$${fmtCurrency(calc.monthlyRevenue)}`} color="text-green-400" icon={DollarSign} />
                <MetricCard label="Monthly Costs" value={`$${fmtCurrency(calc.totalMonthlyOp)}`} sub="Operating only" icon={Activity} />
                <MetricCard label="Monthly Profit" value={`$${fmtCurrency(calc.monthlyProfit)}`} color={profitColor} icon={TrendingUp} />
                <MetricCard label="Gross Margin" value={`${fmtCurrency(calc.margin, 1)}%`} color={profitColor} icon={Percent} />
              </div>
            </div>
            <div>
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-3">Annual</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard label="Annual Revenue" value={`$${fmtCurrency(calc.annualRevenue)}`} color="text-green-400" icon={DollarSign} />
                <MetricCard label="Annual Costs" value={`$${fmtCurrency(calc.annualCosts)}`} sub="Operating × 12" icon={Activity} />
                <MetricCard label="Annual Profit" value={`$${fmtCurrency(calc.annualProfit)}`} color={profitColor} icon={TrendingUp} />
              </div>
            </div>
            <div>
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-3">Startup Investment &amp; Returns</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard
                  label="Startup Capital"
                  value={`$${fmtCurrency(calc.totalCapital)}`}
                  sub="Equipment + installation"
                  icon={Package}
                />
                <MetricCard label="ROI" value={`${fmtCurrency(calc.roi, 1)}%`} sub="Annual profit ÷ capital" color={profitColor} icon={TrendingUp} />
                <MetricCard label="Payback Period" value={paybackLabel} sub="Capital ÷ monthly profit" icon={Package} />
              </div>
            </div>
            <div>
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-3">Production</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                <MetricCard label="Monthly Yield" value={`${fmtCurrency(calc.monthlyYieldKg, 1)} kg`} icon={Scale} />
                <MetricCard label="Annual Yield" value={`${fmtCurrency(calc.annualYieldKg, 1)} kg`} icon={Scale} />
              </div>
            </div>
          </div>

          {/* Costs — startup capital & monthly operating */}
          <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-5">
            <h2 className="text-xs text-white/40 uppercase tracking-wider mb-4">Costs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 h-full">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm text-white/70 uppercase tracking-wider">Startup Capital</h3>
                </div>
                <p className="text-xs text-white/40 mb-4">
                  One-time upfront investment. Affects startup capital, ROI, and payback — not monthly operating costs.
                </p>
                <StartupCostsEditor
                  items={inputs.startupItems}
                  onChange={startupItems => patchInputs({ startupItems })}
                />
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <p className="text-xs text-amber-400/70">
                    → Payback {paybackLabel} · ROI {fmtCurrency(calc.roi, 1)}%
                  </p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 h-full">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm text-white/70 uppercase tracking-wider">Monthly Operating Costs</h3>
                </div>
                <p className="text-xs text-white/40 mb-4">
                  Recurring monthly expenses. Directly reduce monthly profit and annual operating costs.
                </p>
                <EditableRow label="Electricity" value={inputs.electricity} onChange={v => patchInputs({ electricity: v })} step={100} suffix="/mo" />
                <EditableRow label="Water" value={inputs.water} onChange={v => patchInputs({ water: v })} step={50} suffix="/mo" />
                <EditableRow label="Nutrients & supplies" value={inputs.nutrients} onChange={v => patchInputs({ nutrients: v })} step={100} suffix="/mo" />
                <EditableRow label="Labor" value={inputs.labor} onChange={v => patchInputs({ labor: v })} step={500} suffix="/mo" />
                <EditableRow label="Other (rent, misc.)" value={inputs.otherMonthly} onChange={v => patchInputs({ otherMonthly: v })} step={100} suffix="/mo" />
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Total monthly operating</span>
                    <span className="text-white font-medium">${fmtCurrency(calc.totalMonthlyOp)}/mo</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Annual operating costs</span>
                    <span className="text-white/60">${fmtCurrency(calc.annualCosts)}/yr</span>
                  </div>
                  <p className="text-xs text-white/40">
                    → Monthly profit after revenue: <span className={profitColor}>${fmtCurrency(calc.monthlyProfit)}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Editable production & pricing */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-4 h-4 text-green-400" />
              <h2 className="text-sm text-white/70 uppercase tracking-wider">Production & Pricing</h2>
            </div>
            <p className="text-xs text-white/40 mb-4">
              Revenue per crop = total plants/trays × yield × cycles/year × price/kg. The green figure is
              monthly revenue for <span className="text-white/60">all units of that crop combined</span>, not per plant.
            </p>
            {activeCropIds.length === 0 ? (
              <p className="text-sm text-white/40">No crops assigned</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCropIds.map(cropId => {
                  const cropDef = CROP_MAP[cropId];
                  if (!cropDef) return null;
                  const p = config.cropParams[cropId];
                  const total = totalPlantsByCrop[cropId] ?? 0;
                  const style = CROP_CATEGORY_STYLES[cropDef.category];
                  const breakdown = getCropRevenueBreakdown(total, p);
                  return (
                    <div key={cropId} className="bg-white/3 border border-white/8 rounded-xl p-4">
                      <div className="mb-3 pb-3 border-b border-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded-full border text-xs ${style}`}>
                              {cropDef.name}
                            </span>
                            <p className="text-xs text-white/40 mt-1.5">
                              {total} {cropDef.unitLabel}{total !== 1 ? 's' : ''} in farm design
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-white/40 uppercase tracking-wider">
                              All {total} {cropDef.unitLabel}s
                            </p>
                            <p className="text-lg text-green-400">
                              ${fmtCurrency(breakdown.monthlyRev)}/mo
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-lg bg-white/3 px-3 py-2 text-[11px] text-white/50 leading-relaxed space-y-0.5">
                          <p>
                            {total} {cropDef.unitLabel}s × {p.yieldPerUnitPerCycle} kg/{cropDef.unitLabel}/cycle
                            × {p.cyclesPerYear} cycles/yr
                            {p.lossRate > 0 ? ` × ${100 - p.lossRate}% after loss` : ''}
                          </p>
                          <p>
                            = {fmtCurrency(breakdown.monthlyKg, 1)} kg/mo harvested
                            × ${fmtCurrency(p.pricePerKg)}/kg
                            → <span className="text-green-400/80">${fmtCurrency(breakdown.monthlyRev)}/mo</span>
                          </p>
                          {total > 0 && (
                            <p className="text-white/35 pt-0.5">
                              ≈ ${fmtCurrency(breakdown.perUnitMonthlyRev, 2)}/{cropDef.unitLabel}/mo
                              {' '}({fmtCurrency(breakdown.perUnitMonthlyKg, 2)} kg/{cropDef.unitLabel}/mo)
                            </p>
                          )}
                        </div>
                      </div>
                      <EditableRow
                        label={`Yield/${cropDef.unitLabel}/cycle`}
                        value={p.yieldPerUnitPerCycle}
                        onChange={v => patchCropParam(cropId, { yieldPerUnitPerCycle: v })}
                        step={0.01}
                        prefix=""
                        suffix="kg"
                      />
                      <EditableRow
                        label="Cycles per year"
                        value={p.cyclesPerYear}
                        onChange={v => patchCropParam(cropId, { cyclesPerYear: v })}
                        step={1}
                        prefix=""
                        suffix=""
                      />
                      <EditableRow
                        label="Price per kg"
                        value={p.pricePerKg}
                        onChange={v => patchCropParam(cropId, { pricePerKg: v })}
                        step={10}
                        suffix="/kg"
                      />
                      <EditableRow
                        label="Harvest loss"
                        value={p.lossRate}
                        onChange={v => patchCropParam(cropId, { lossRate: v })}
                        step={1}
                        prefix=""
                        suffix="%"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete financial plan?"
        description={`"${planName}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete plan"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
