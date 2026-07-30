import { useEffect, useState, type MouseEvent } from 'react';
import { Plus, Leaf, TrendingUp, Activity, BarChart3, Copy, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { HydroponicSystem } from '../../../storage/models';
import { getAllSystems } from '../../../storage/operations/systems';
import { listFinancialPlans, type FinancialPlan } from '../../../storage/operations/financialPlans';
import { formatRelativeTime } from '../../../storage/utils/dateHelpers';
import { fmtCurrency, formatPlanDate, duplicateFinancialPlan } from '../../utils/financialPlanHelpers';
import { SYSTEM_TYPE_LABELS } from '../../data/crops';

interface OperationsHomeSectionProps {
  onCreateSystem: () => void;
  onViewSystem: (systemId: string) => void;
  onViewFinancialPlan: (planId: string) => void;
  onCreateFinancialPlan: () => void;
  onDuplicateFinancialPlan?: (planId: string) => void;
}

export function OperationsHomeSection({
  onCreateSystem,
  onViewSystem,
  onViewFinancialPlan,
  onCreateFinancialPlan,
  onDuplicateFinancialPlan,
}: OperationsHomeSectionProps) {
  const { t } = useLanguage();
  const { session, loading: authLoading } = useAuth();
  const [systems, setSystems] = useState<HydroponicSystem[]>([]);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [loadingSystems, setLoadingSystems] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [systemsError, setSystemsError] = useState<string | null>(null);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [duplicatingPlanId, setDuplicatingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setSystems([]);
      setPlans([]);
      setLoadingSystems(false);
      setLoadingPlans(false);
      setSystemsError(t('operations.home.signInSystems'));
      setPlansError(t('operations.home.signInPlans'));
      return;
    }
    loadSystems();
    loadPlans();
  }, [authLoading, session?.user?.id]);

  async function loadSystems() {
    setLoadingSystems(true);
    setSystemsError(null);
    try {
      const allSystems = await getAllSystems();
      setSystems(allSystems);
    } catch (error) {
      console.error('Failed to load systems:', error);
      setSystemsError(error instanceof Error ? error.message : t('operations.home.failedLoadSystems'));
    } finally {
      setLoadingSystems(false);
    }
  }

  async function loadPlans() {
    setLoadingPlans(true);
    setPlansError(null);
    try {
      const allPlans = await listFinancialPlans();
      setPlans(allPlans);
    } catch (error) {
      console.error('Failed to load financial plans:', error);
      setPlansError(error instanceof Error ? error.message : t('operations.home.failedLoadPlans'));
    } finally {
      setLoadingPlans(false);
    }
  }

  const totalRevenue = systems.reduce((sum, sys) => sum + (sys.results?.totalRevenue || 0), 0);
  const activeCycles = systems.filter(sys => sys.activeCycleId).length;
  const totalHarvest = systems.reduce((sum, sys) => sum + (sys.results?.totalHarvestKg || 0), 0);

  async function handleDuplicatePlan(planId: string, e: MouseEvent) {
    e.stopPropagation();
    setDuplicatingPlanId(planId);
    try {
      const copy = await duplicateFinancialPlan(planId);
      await loadPlans();
      onDuplicateFinancialPlan?.(copy.id);
    } catch (err) {
      console.error('Failed to duplicate plan:', err);
      alert(t('operations.home.failedDuplicate'));
    } finally {
      setDuplicatingPlanId(null);
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-4 py-8 md:py-12 pt-20 md:pt-24">
        <div className="flex flex-col h-full gap-10 overflow-y-auto hiper-scroll px-1 pt-[21px] pb-[96px]">

          {(systemsError || plansError) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-200 font-medium">{t('operations.home.loadFailed')}</p>
                {systemsError && <p className="text-xs text-red-200/70 mt-1">{t('operations.home.systemsLabel')} {systemsError}</p>}
                {plansError && <p className="text-xs text-red-200/70 mt-1">{t('operations.home.plansLabel')} {plansError}</p>}
              </div>
              <button
                onClick={() => { loadSystems(); loadPlans(); }}
                className="flex items-center gap-1.5 text-xs text-red-200 hover:text-white border border-red-500/30 rounded-lg px-3 py-1.5 transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('common.retry')}
              </button>
            </div>
          )}

          {/* Your Systems */}
          <section>
            <div className="flex-shrink-0 flex items-center justify-between mb-4">
              <div>
                <h1 className="text-white tracking-tight text-[32px]">{t('operations.home.yourSystems')}</h1>
                {systems.length > 0 && (
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-white/60 text-sm">{t('operations.home.revenue')} </span>
                      <span className="text-white font-medium">${totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-400" />
                      <span className="text-white/60 text-sm">{t('operations.home.activeCycles')} </span>
                      <span className="text-white font-medium">{activeCycles}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-green-400" />
                      <span className="text-white/60 text-sm">{t('operations.home.totalHarvest')} </span>
                      <span className="text-white font-medium">{totalHarvest.toFixed(1)} {t('common.kg')}</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={onCreateSystem}
                className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-lg transition-all duration-300 group px-[18px] py-[9px]"
              >
                <Plus className="w-5 h-5 text-green-400 shrink-0" />
                <span className="text-white hidden sm:inline text-[12px]">{t('operations.home.designNewSystem')}</span>
              </button>
            </div>

            {loadingSystems && (
              <div className="py-12 text-center text-white/60">{t('operations.home.loadingSystems')}</div>
            )}

            {!loadingSystems && systems.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-md flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-green-400/50" />
                </div>
                <h2 className="text-xl text-white mb-2">{t('operations.home.createFirstTitle')}</h2>
                <p className="text-white/60 mb-6 leading-relaxed text-sm max-w-md mx-auto">
                  {t('operations.home.createFirstBody')}
                </p>
                <button
                  onClick={onCreateSystem}
                  className="inline-flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-md transition-all duration-300 px-[18px] py-[9px]"
                >
                  <Plus className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium text-[12px]">{t('operations.home.getStarted')}</span>
                </button>
              </div>
            )}

            {!loadingSystems && systems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {systems.map((system) => (
                  <div
                    key={system.id}
                    className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                    onClick={() => onViewSystem(system.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full text-xs ${
                        system.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : system.status === 'maintenance'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-white/10 text-white/60 border border-white/20'
                      }`}>
                        {t(`status.${system.status}`) !== `status.${system.status}` ? t(`status.${system.status}`) : system.status}
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/70 border border-white/10">
                        {t(`systemTypes.${system.systemType}`) !== `systemTypes.${system.systemType}` ? t(`systemTypes.${system.systemType}`) : (SYSTEM_TYPE_LABELS[system.systemType] ?? system.systemType)}
                      </div>
                    </div>

                    <h3 className="text-xl text-white mb-2 group-hover:text-green-400 transition-colors">
                      {system.name}
                    </h3>
                    <p className="text-sm text-white/60 mb-4">{system.location}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">{t('operations.home.totalCycles')}</span>
                        <span className="text-white">{system.totalCycles}</span>
                      </div>
                      {system.results && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">{t('common.roi')}</span>
                            <span className="text-green-400">{system.results.roi.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">{t('common.revenue')}</span>
                            <span className="text-white">${system.results.totalRevenue.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                      <span>{t('operations.home.updated')} {formatRelativeTime(system.updatedAt)}</span>
                      <span className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('operations.home.viewDetails')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Your Financial Plans */}
          <section>
            <div className="flex-shrink-0 flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white tracking-tight text-[32px]">{t('operations.home.yourPlans')}</h2>
                <p className="text-white/40 text-sm mt-1">
                  {t('operations.home.plansSubtitle')}
                </p>
              </div>
              <button
                onClick={onCreateFinancialPlan}
                className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-lg transition-all duration-300 group px-[18px] py-[9px]"
              >
                <Plus className="w-5 h-5 text-green-400 shrink-0" />
                <span className="text-white hidden sm:inline text-[12px]">{t('operations.home.newPlan')}</span>
              </button>
            </div>

            {loadingPlans && (
              <div className="py-8 text-center text-white/60">{t('operations.home.loadingPlans')}</div>
            )}

            {!loadingPlans && plans.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-md flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-400/50" />
                </div>
                <h3 className="text-xl text-white mb-2">{t('operations.home.noPlansTitle')}</h3>
                <p className="text-white/60 mb-6 leading-relaxed text-sm max-w-md mx-auto">
                  {t('operations.home.noPlansBody')}
                </p>
                <button
                  onClick={onCreateFinancialPlan}
                  className="inline-flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-md transition-all duration-300 px-[18px] py-[9px]"
                >
                  <Plus className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium text-[12px]">{t('operations.home.createPlan')}</span>
                </button>
              </div>
            )}

            {!loadingPlans && plans.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const monthlyProfit = plan.results?.monthlyProfit;
                  const roi = plan.results?.roi;
                  return (
                    <div
                      key={plan.id}
                      className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                      onClick={() => onViewFinancialPlan(plan.id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                          {t('operations.home.financialPlanBadge')}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={e => handleDuplicatePlan(plan.id, e)}
                            disabled={duplicatingPlanId === plan.id}
                            className="p-1.5 text-white/30 hover:text-green-400 transition-colors disabled:opacity-50"
                            title={t('operations.home.duplicatePlan')}
                          >
                            {duplicatingPlanId === plan.id
                              ? <Loader className="w-4 h-4 animate-spin" />
                              : <Copy className="w-4 h-4" />}
                          </button>
                          <BarChart3 className="w-4 h-4 text-white/30" />
                        </div>
                      </div>

                      <h3 className="text-xl text-white mb-2 group-hover:text-green-400 transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-white/60 mb-4">
                        {plan.config.systemBlocks.length} {plan.config.systemBlocks.length === 1 ? t('operations.home.systemConfigured') : t('operations.home.systemsConfigured')}
                      </p>

                      <div className="space-y-2">
                        {typeof monthlyProfit === 'number' && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">{t('operations.home.monthlyProfit')}</span>
                            <span className={monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                              ${fmtCurrency(monthlyProfit)}
                            </span>
                          </div>
                        )}
                        {typeof roi === 'number' && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/50">{t('common.roi')}</span>
                            <span className="text-green-400">{roi.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                        <span>{t('operations.home.updated')} {formatPlanDate(plan.updatedAt)}</span>
                        <span className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {t('operations.home.viewDetails')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
