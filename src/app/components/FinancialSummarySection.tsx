import { useMemo } from 'react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Box, Droplets, Zap, DollarSign, TrendingUp, Calendar, Users, Package } from 'lucide-react';
import { useFarmConfig } from '../contexts/FarmConfigContext';
import { calculateSystemMetrics, calculateFinancials } from '../utils/farmCalculations';
import { financialInputsStore } from './FinancialInputsSection';
import { useLanguage } from '../contexts/LanguageContext';

interface FinancialSummarySectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

export function FinancialSummarySection({ isActive, onNextSlide, isLastSlide, onPrevSlide, isFirstSlide }: FinancialSummarySectionProps) {
  const { config } = useFarmConfig();
  const { t } = useLanguage();

  const systemMetrics = useMemo(() => calculateSystemMetrics(config), [config]);

  const calculations = useMemo(() => {
    return calculateFinancials(
      config,
      {
        electricityCost: financialInputsStore.electricityCost,
        rent: financialInputsStore.rent,
        labor: financialInputsStore.labor,
        nutrientsCost: financialInputsStore.nutrientsCost,
      },
      {
        avgPricePerKg: financialInputsStore.avgPricePerKg,
        harvestFrequency: financialInputsStore.harvestFrequency,
      }
    );
  }, [
    config,
    financialInputsStore.electricityCost,
    financialInputsStore.rent,
    financialInputsStore.labor,
    financialInputsStore.nutrientsCost,
    financialInputsStore.avgPricePerKg,
    financialInputsStore.harvestFrequency,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col gap-4 md:gap-6 h-full overflow-y-auto pr-2 md:pr-4 pb-24">
          {/* Header */}
          <div className="flex-shrink-0 px-[0px] pt-[48px] pb-[0px]">
            <div className="space-y-2 mb-4 md:mb-6">
              <h2 className="text-white font-thin tracking-tight px-[0px] pt-[12px] pb-[0px] text-[32px]">
                {t('summary.title')}
                <br />
                <span className="text-white/40">{t('summary.subtitle')}</span>
              </h2>
            </div>
          </div>

          {/* Startup Cost Breakdown */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm border border-amber-500/20 rounded-xl md:rounded-2xl p-3 md:p-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-amber-400/80" />
              <span className="text-xs md:text-sm text-white/70 uppercase tracking-wider">{t('financial.desgloseInversion')}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 text-xs md:text-sm">
              <div>
                <div className="text-white/40">{t('financial.sistemaBase')}</div>
                <div className="text-white">
                  {config.systemType.toUpperCase()}: {
                    ({
                      'nft': '8,500',
                      'kratky': '3,200',
                      'vertical-wall': '12,000',
                      'microgreens': '4,500',
                    }[config.systemType])
                  } MXN
                </div>
              </div>
              <div>
                <div className="text-white/40">× {t('financial.racks')}</div>
                <div className="text-white">× {config.racks}</div>
              </div>
              <div>
                <div className="text-white/40">× {t('financial.automatizacion')}</div>
                <div className="text-white">
                  × {config.automation === 'manual' ? '1.0' : config.automation === 'semi-auto' ? '1.4' : '2.1'}
                  {' '}({config.automation === 'manual' ? t('configurator.manual') : config.automation === 'semi-auto' ? t('configurator.semiAuto') : t('configurator.fullAuto')})
                </div>
              </div>
              <div>
                <div className="text-white/40">× {t('financial.ambiente')}</div>
                <div className="text-white">
                  × {config.environment === 'climate-controlled' ? '1.6' : '1.0'}
                  {' '}({config.environment === 'climate-controlled' ? t('financial.clima') : t('financial.aireLibre')})
                </div>
              </div>
              <div className="md:text-right">
                <div className="text-white/40">{t('financial.total')}</div>
                <div className="text-white text-lg font-semibold">${systemMetrics.startupCost.toLocaleString()} MXN</div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 md:gap-4 flex-shrink-0">
            {/* Startup Cost */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-amber-400/80" />
                <Badge variant="outline" className="text-[10px] md:text-xs border-white/20 text-white/60">{t('financial.inicial')}</Badge>
              </div>
              <div className="text-xl md:text-3xl text-white mb-1">
                ${systemMetrics.startupCost.toLocaleString()} MXN
              </div>
              <div className="text-[10px] md:text-xs text-white/40 uppercase tracking-wider">{t('financial.inversion')}</div>
            </div>

            {/* Monthly Operating */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-400/80" />
                <Badge variant="outline" className="text-[10px] md:text-xs border-white/20 text-white/60">{t('financial.mensual')}</Badge>
              </div>
              <div className="text-xl md:text-3xl text-white mb-1">
                ${calculations.totalMonthlyCosts.toLocaleString()} MXN
              </div>
              <div className="text-[10px] md:text-xs text-white/40 uppercase tracking-wider">{t('financial.costos')}</div>
            </div>

            {/* Revenue */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400/80" />
                <Badge variant="outline" className="text-[10px] md:text-xs border-white/20 text-white/60">{t('financial.mensual')}</Badge>
              </div>
              <div className="text-xl md:text-3xl text-white mb-1">
                ${calculations.monthlyRevenue.toLocaleString()} MXN
              </div>
              <div className="text-[10px] md:text-xs text-white/40 uppercase tracking-wider">{t('financial.ingresos')}</div>
            </div>

            {/* Gross Margin */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400/80" />
                <Badge variant="outline" className="text-[10px] md:text-xs border-white/20 text-white/60">{t('financial.margin')}</Badge>
              </div>
              <div className="text-xl md:text-3xl text-white mb-1">
                {calculations.grossMargin}%
              </div>
              <div className="text-[10px] md:text-xs text-white/40 uppercase tracking-wider">{t('financial.bruto')}</div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-shrink-0">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Monthly P&L */}
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-400/60" />
                    <span className="text-sm text-white/70 uppercase tracking-wider">{t('financial.pl')} {t('financial.mensual')}</span>
                  </div>
                  <Badge variant="outline" className="border-green-500/30 text-green-300">
                    {calculations.grossMargin}% {t('financial.margin')}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">{t('financial.ingresos')}</span>
                    <span className="text-white">${calculations.monthlyRevenue.toLocaleString()} MXN</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">{t('financial.operatingCostsShort')}</span>
                    <span className="text-white">-${calculations.totalMonthlyCosts.toLocaleString()} MXN</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">{t('financial.grossProfit')}</span>
                    <span className={`text-2xl ${calculations.grossProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${calculations.grossProfit.toLocaleString()} MXN
                    </span>
                  </div>
                </div>
              </div>

              {/* Resource Usage */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="text-sm text-white/70 uppercase tracking-wider mb-4">{t('financial.usoRecursos')}</div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-yellow-400/80" />
                    <span className="text-white/60 text-sm">{t('financial.electricity')}</span>
                  </div>
                  <span className="text-white">{systemMetrics.electricityKwh} kWh/mo</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Droplets className="w-4 h-4 text-blue-400/80" />
                    <span className="text-white/60 text-sm">{t('configurator.water')}</span>
                  </div>
                  <span className="text-white">{systemMetrics.waterLiters} L/mo</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Box className="w-4 h-4 text-green-400/80" />
                    <span className="text-white/60 text-sm">{t('financial.produccionTotal')}</span>
                  </div>
                  <span className="text-white">{calculations.totalKgPerMonth} kg/mo</span>
                </div>
              </div>

              {/* Payback Period */}
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-green-400/60 uppercase tracking-wider mb-2">{t('financial.periodoRecuperacion')}</div>
                    <div className="text-4xl text-white">
                      {calculations.breakEvenMonths !== 'N/A'
                        ? calculations.breakEvenMonths
                        : systemMetrics.paybackMonths}
                      {' '}
                      <span className="text-xl text-white/40">{t('financial.meses')}</span>
                    </div>
                  </div>
                  <Calendar className="w-8 h-8 text-green-400/40" />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Annual Projection */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400/60" />
                  <span className="text-sm text-white/70 uppercase tracking-wider">{t('financial.proyeccionAnual')}</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('financial.ingresos')}</div>
                    <div className="text-2xl text-white">${(calculations.annualRevenue / 1000).toFixed(0)}k</div>
                    <div className="text-xs text-white/40">MXN/{t('financial.año')}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('financial.costos')}</div>
                    <div className="text-2xl text-white">${(calculations.annualCosts / 1000).toFixed(0)}k</div>
                    <div className="text-xs text-white/40">MXN/{t('financial.año')}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('financial.profit')}</div>
                    <div className={`text-2xl ${calculations.annualProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${(calculations.annualProfit / 1000).toFixed(0)}k
                    </div>
                    <div className="text-xs text-white/40">MXN/{t('financial.año')}</div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-white/60" />
                  <span className="text-sm text-white/70 uppercase tracking-wider">{t('financial.desgloseCostos')}</span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      label: t('financial.electricity'),
                      value: calculations.electricityTotal,
                      icon: Zap,
                      color: 'yellow',
                    },
                    {
                      label: t('financial.rent'),
                      value: financialInputsStore.rent,
                      icon: DollarSign,
                      color: 'blue',
                    },
                    {
                      label: t('financial.labor'),
                      value: financialInputsStore.labor,
                      icon: Users,
                      color: 'green',
                    },
                    {
                      label: t('financial.nutrients'),
                      value: financialInputsStore.nutrientsCost,
                      icon: Droplets,
                      color: 'cyan',
                    },
                  ].map((item) => {
                    const percentage = (item.value / calculations.totalMonthlyCosts) * 100;
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 text-${item.color}-400/60`} />
                            <span className="text-white/60">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white/40">{percentage.toFixed(0)}%</span>
                            <span className="text-white w-20 text-right">${item.value.toLocaleString()}</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Production Metrics */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-4">
                  {t('financial.metricasProduccion')}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-white/40">{t('financial.produccionTotal')}</div>
                    <div className="text-white text-lg">{calculations.totalKgPerMonth} kg/mes</div>
                  </div>
                  <div>
                    <div className="text-white/40">{t('financial.consumoElectrico')}</div>
                    <div className="text-white text-lg">{calculations.kwhPerMonth} kWh/mes</div>
                  </div>
                  <div>
                    <div className="text-white/40">{t('financial.ingresoPorKg')}</div>
                    <div className="text-white text-lg">${financialInputsStore.avgPricePerKg} MXN</div>
                  </div>
                  <div>
                    <div className="text-white/40">{t('financial.frecuenciaCosecha')}</div>
                    <div className="text-white text-lg">{financialInputsStore.harvestFrequency}×/mes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
