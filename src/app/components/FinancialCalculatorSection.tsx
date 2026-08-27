import { useState, useMemo, useEffect } from 'react';
import {
  DollarSign, Package, Leaf, ChevronDown, ChevronUp, Save, Check, Loader,
  Pencil, Plus, BarChart3,
} from 'lucide-react';
import { useFarmConfig, getTotalPlantsByCrop } from '../contexts/FarmConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
import { SectionLabel } from './SectionLabel';

export type PlanLoadRequest =
  | { type: 'load'; planId: string }
  | { type: 'new' };

/** v2 bumps reset stale drafts so signed-out demo defaults stay profitable. */
const FINANCIAL_DRAFT_KEY = 'hiperlocal-financial-draft-v2';

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
  const { t } = useLanguage();
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
        setPlanName(t('financialCalculator.defaultPlanName'));
      } else {
        setPlanName(editingPlanId ? planName || t('financialCalculator.defaultPlanName') : t('financialCalculator.defaultPlanName'));
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
      <div className={`relative h-full max-w-7xl mx-auto px-4 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>

        <div className="flex flex-col lg:flex-row h-full min-h-0 gap-6 overflow-hidden">

          {/* LEFT: Inputs */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-24 pt-32 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex flex-col gap-4 md:gap-6">
              <SectionLabel icon={BarChart3} label={t('nav.financial')} />
              <div className="pb-2">
                <h2 className="text-white font-thin tracking-tight text-3xl">
                  {t('financialCalculator.title')}
                  <span className="text-white/40 ml-3 text-xl">{t('financialCalculator.subtitle')}</span>
                </h2>
                <p className="text-white/40 text-xs mt-1">{t('financialCalculator.description')}</p>
                {editingPlanId && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-xs text-green-400">
                      <Pencil className="w-3 h-3" />
                      {t('financialCalculator.editing')} {planName}
                    </span>
                    <button
                      onClick={handleStartNewPlan}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      {t('financialCalculator.startFresh')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!session && (
              <div className="bg-white/3 border border-white/8 rounded-2xl px-5 py-4 text-sm text-white/40">
                {t('financialCalculator.signInPrompt')}
              </div>
            )}

            {/* Costs — startup capital & monthly operating */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white/60 uppercase tracking-wider">{t('financialCalculator.startupCapital')}</span>
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
                    <span className="text-xs text-white/60 uppercase tracking-wider">{t('financialCalculator.monthlyOperating')}</span>
                    <span className="ml-auto text-sm text-white">${fmt(calc.totalMonthlyOp)}{t('common.perMo')}</span>
                  </div>
                  <InputRow label={t('financialCalculator.electricity')}  value={inputs.electricity}  onChange={v => patchInputs({ electricity: v })}  step={100} prefix="$" suffix={t('common.perMo')} />
                  <InputRow label={t('financialCalculator.water')}        value={inputs.water}        onChange={v => patchInputs({ water: v })}         step={50}  prefix="$" suffix={t('common.perMo')} />
                  <InputRow label={t('financialCalculator.nutrients')}    value={inputs.nutrients}    onChange={v => patchInputs({ nutrients: v })}    step={100} prefix="$" suffix={t('common.perMo')} />
                  <InputRow label={t('financialCalculator.labor')}        value={inputs.labor}        onChange={v => patchInputs({ labor: v })}         step={500} prefix="$" suffix={t('common.perMo')} />
                  <InputRow label={t('financialCalculator.otherMonthly')} value={inputs.otherMonthly} onChange={v => patchInputs({ otherMonthly: v })} step={100} prefix="$" suffix={t('common.perMo')} />
                </div>
            </div>

            {/* System summary */}
            {config.systemBlocks.length > 0 && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-2">
                <div className="text-xs text-white/30 uppercase tracking-wider mb-3">{t('financialCalculator.systemConfig')}</div>
                {config.systemBlocks.map(block => {
                  const totalUnits = block.cropAllocations.reduce((s, a) => s + a.unitCount, 0);
                  const systemTypeKey = `systemTypes.${block.systemType}`;
                  const translatedSystemLabel = t(systemTypeKey);
                  const systemLabel = translatedSystemLabel === systemTypeKey
                    ? SYSTEM_TYPE_LABELS[block.systemType]
                    : translatedSystemLabel;
                  return (
                    <div key={block.id} className="flex items-center gap-2 text-xs">
                      <span className="text-white/60">{totalUnits}× {systemLabel}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-white/40">
                        {block.cropAllocations.map(a => {
                          const crop = CROP_MAP[a.cropId];
                          return `${a.plantsPerUnit * a.unitCount} ${crop?.name ?? a.cropId}`;
                        }).join(', ') || t('financialCalculator.noCropsAssigned')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Per-crop production */}
            {activeCropIds.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-white/40 text-sm">{t('financialCalculator.noCropsEmpty')}</p>
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
                            <p className="text-xs text-white/30 mt-1">{total} {cropDef.unitLabel}s {t('financialCalculator.inFarmDesign')}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('financialCalculator.allUnits')} {total} {cropDef.unitLabel}s</p>
                          <p className="text-sm text-green-400">${fmt(breakdown.monthlyRev)}{t('common.perMo')}</p>
                        </div>
                      </div>
                      <div className="mt-2 rounded-lg bg-white/3 px-3 py-2 text-[11px] text-white/50 leading-relaxed space-y-0.5">
                        <p>
                          {total} × {p.yieldPerUnitPerCycle} {t('common.kg')}/{t('financialCalculator.cycles')} × {p.cyclesPerYear} {t('financialCalculator.cycles')}/{t('common.yr')}
                          {p.lossRate > 0 ? ` × ${100 - p.lossRate}% ${t('financialCalculator.afterLoss')}` : ''}
                          {' '}= {fmt(breakdown.monthlyKg, 1)} {t('common.kg')}/{t('common.mo')} × ${fmt(p.pricePerKg)}{t('common.perKg')}
                        </p>
                        {total > 0 && (
                          <p className="text-white/35">
                            ≈ ${fmt(breakdown.perUnitMonthlyRev, 2)}/{cropDef.unitLabel}/{t('common.mo')}
                          </p>
                        )}
                      </div>
                    </div>
                    <InputRow
                      label={t('financialCalculator.yieldPerCycle', { unit: cropDef.unitLabel })}
                      value={p.yieldPerUnitPerCycle}
                      onChange={v => updateCropParam(cropId, { yieldPerUnitPerCycle: v })}
                      step={0.01} prefix="" suffix={t('common.kg')}
                    />
                    <InputRow
                      label={t('financialCalculator.cyclesPerYear')}
                      value={p.cyclesPerYear}
                      onChange={v => updateCropParam(cropId, { cyclesPerYear: v })}
                      step={1} prefix="" suffix={t('financialCalculator.cycles')}
                    />
                    <InputRow
                      label={t('financialCalculator.pricePerKg')}
                      value={p.pricePerKg}
                      onChange={v => updateCropParam(cropId, { pricePerKg: v })}
                      step={10} prefix="$" suffix={t('common.perKg')}
                    />
                    <InputRow
                      label={t('financialCalculator.harvestLoss')}
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
                  <div className="text-white/40 mb-1">{t('financialCalculator.annualYieldAll')}</div>
                  <div className="text-white">{fmt(calc.annualYieldKg, 1)} {t('common.kg')}</div>
                </div>
                <div>
                  <div className="text-white/40 mb-1">{t('financialCalculator.monthlyYield')}</div>
                  <div className="text-white">{fmt(calc.monthlyYieldKg, 1)} {t('common.kg')}</div>
                </div>
                <div>
                  <div className="text-white/40 mb-1">{t('financialCalculator.annualRevenue')}</div>
                  <div className="text-green-400">${fmt(calc.annualRevenue)}</div>
                </div>
                <div>
                  <div className="text-white/40 mb-1">{t('financialCalculator.annualCosts')}</div>
                  <div className="text-white">${fmt(calc.annualCosts)}</div>
                </div>
              </div>
            )}

            {/* Results on mobile / tablet — above save */}
            <div className="lg:hidden space-y-4 pt-2">
              <button
                onClick={() => setShowResults(v => !v)}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-white/40">{t('financialCalculator.monthly')}</div>
                    <div className={`text-lg ${profitColor}`}>${fmt(calc.monthlyProfit)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40">{t('common.roi')}</div>
                    <div className={`text-lg ${profitColor}`}>{fmt(calc.roi, 1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40">{t('financialCalculator.payback')}</div>
                    <div className="text-lg text-white">{calc.paybackMonths ? `${fmt(calc.paybackMonths, 0)}${t('common.mo')}` : '—'}</div>
                  </div>
                </div>
                {showResults ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </button>
              {showResults && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  <ResultsContent calc={calc} profitColor={profitColor} profitBg={profitBg} fmt={fmt} />
                </div>
              )}
            </div>

            {/* Save Plan */}
            <div className="flex flex-wrap items-center gap-3">
              {saveState === 'idle' && (
                <>
                  <button
                    onClick={() => handleStartSave()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full text-sm hover:bg-green-500/25 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {editingPlanId ? t('financialCalculator.updatePlan') : t('financialCalculator.savePlan')}
                  </button>
                  {editingPlanId && (
                    <button
                      onClick={() => handleStartSave(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/60 rounded-full text-sm hover:bg-white/10 hover:text-white transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      {t('financialCalculator.saveAsNew')}
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
                    placeholder={t('financialCalculator.planNamePlaceholder')}
                    className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                    autoFocus
                  />
                  <button
                    onClick={doSave}
                    disabled={!planName.trim()}
                    className="px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-40 transition-all"
                  >
                    {t('common.save')}
                  </button>
                  <button onClick={() => setSaveState('idle')} className="text-white/30 hover:text-white/60 text-xs px-2">{t('financialCalculator.cancel')}</button>
                </div>
              )}

              {saveState === 'saving' && (
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <Loader className="w-4 h-4 animate-spin" />
                  {t('financialCalculator.savingPlan')}
                </div>
              )}

              {saveState === 'saved' && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  {t('financialCalculator.planSaved')}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Results (desktop) */}
          <div className="hidden lg:flex w-80 flex-col gap-4 overflow-y-auto pt-32 pb-24 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
  const { t } = useLanguage();
  return (
    <>
      <div className={`bg-gradient-to-br ${profitBg} border rounded-2xl p-5`}>
        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">{t('financialCalculator.monthlyProfit')}</div>
        <div className={`text-4xl ${profitColor}`}>${fmt(calc.monthlyProfit)}</div>
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
          <div><div className="text-white/40 mb-1">{t('common.revenue')}</div><div className="text-green-400">${fmt(calc.monthlyRevenue)}</div></div>
          <div><div className="text-white/40 mb-1">{t('common.costs')}</div><div className="text-white">${fmt(calc.totalMonthlyOp)}</div></div>
          <div><div className="text-white/40 mb-1">{t('financialCalculator.margin')}</div><div className={profitColor}>{fmt(calc.margin, 1)}%</div></div>
          <div><div className="text-white/40 mb-1">{t('financialCalculator.annualProfit')}</div><div className={profitColor}>${fmt(calc.annualProfit)}</div></div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">{t('financialCalculator.returnOnInvestment')}</div>
        <div className={`text-4xl ${profitColor}`}>{fmt(calc.roi, 1)}<span className="text-xl">%</span></div>
        <div className="text-xs text-white/40 mt-2">{t('financialCalculator.onCapital')} ${fmt(calc.totalCapital)} {t('financialCalculator.capital')}</div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="text-xs text-white/50 uppercase tracking-wider mb-1">{t('financialCalculator.paybackPeriod')}</div>
        {calc.paybackMonths !== null && calc.paybackMonths > 0 ? (
          <>
            <div className="text-4xl text-white">
              {calc.paybackMonths < 24 ? fmt(calc.paybackMonths, 0) : fmt(calc.paybackMonths / 12, 1)}
              <span className="text-xl text-white/40 ml-1">{calc.paybackMonths < 24 ? t('common.mo') : t('common.yr')}</span>
            </div>
            <div className="text-xs text-white/40 mt-2">
              {calc.paybackMonths < 24
                ? `${fmt(calc.paybackMonths / 12, 1)} ${t('common.years')}`
                : `${fmt(calc.paybackMonths, 0)} ${t('common.months')}`}
            </div>
          </>
        ) : (
          <div className="text-white/40">{calc.monthlyProfit <= 0 ? t('financialCalculator.notProfitable') : '—'}</div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="text-xs text-white/50 uppercase tracking-wider mb-4">{t('financialCalculator.annualProjection')}</div>
        <div className="space-y-3">
          {[
            { key: 'revenue', label: t('common.revenue'), value: calc.annualRevenue,            color: 'bg-green-500/60' },
            { key: 'costs',   label: t('common.costs'),   value: calc.annualCosts,              color: 'bg-red-500/40'   },
            { key: 'profit',  label: t('common.profit'),  value: Math.abs(calc.annualProfit),   color: calc.annualProfit >= 0 ? 'bg-green-400' : 'bg-red-400' },
          ].map(row => {
            const max = Math.max(calc.annualRevenue, calc.annualCosts);
            const pct = max > 0 ? (row.value / max) * 100 : 0;
            return (
              <div key={row.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">{row.label}</span>
                  <span className={row.key === 'profit' ? (calc.annualProfit >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white'}>
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
