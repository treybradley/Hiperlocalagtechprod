import { useMemo } from 'react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { TrendingUp, Calendar, Zap, Droplets, Users, Package, DollarSign } from 'lucide-react';
import { useFarmConfig } from '../contexts/FarmConfigContext';
import { calculateFinancials } from '../utils/farmCalculations';
import { financialInputsStore } from './FinancialInputsSection';
import { useLanguage } from '../contexts/LanguageContext';

interface FinancialProjectionsSectionProps {
  isActive: boolean;
}

export function FinancialProjectionsSection({ isActive }: FinancialProjectionsSectionProps) {
  const { config } = useFarmConfig();
  const { t } = useLanguage();

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
  }, [config]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col gap-6 h-full">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-400/80 text-xs uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" />
              Proyecciones Financieras
            </div>
            <h2 className="text-5xl text-white tracking-tight">
              Análisis
              <br />
              <span className="text-white/40">Completo</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 space-y-6">
            {/* Monthly P&L */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-400/60" />
                  <span className="text-sm text-white/70 uppercase tracking-wider">P&G Mensual</span>
                </div>
                <Badge variant="outline" className="border-green-500/30 text-green-300">
                  {calculations.grossMargin}% margen
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Ingresos</span>
                  <span className="text-white">${calculations.monthlyRevenue.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Costos Operativos</span>
                  <span className="text-white">-${calculations.totalMonthlyCosts.toLocaleString()} MXN</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Utilidad Bruta</span>
                  <span className={`text-2xl ${calculations.grossProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${calculations.grossProfit.toLocaleString()} MXN
                  </span>
                </div>
              </div>
            </div>

            {/* Annual Projection */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400/60" />
                <span className="text-sm text-white/70 uppercase tracking-wider">Proyección Anual</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-xs text-white/40 uppercase tracking-wider">Ingresos</div>
                  <div className="text-2xl text-white">${(calculations.annualRevenue / 1000).toFixed(0)}k</div>
                  <div className="text-xs text-white/40">MXN/año</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-white/40 uppercase tracking-wider">Costos</div>
                  <div className="text-2xl text-white">${(calculations.annualCosts / 1000).toFixed(0)}k</div>
                  <div className="text-xs text-white/40">MXN/año</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-white/40 uppercase tracking-wider">Utilidad</div>
                  <div className={`text-2xl ${calculations.annualProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${(calculations.annualProfit / 1000).toFixed(0)}k
                  </div>
                  <div className="text-xs text-white/40">MXN/año</div>
                </div>
              </div>
            </div>

            {/* Break-even Analysis */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-400/60" />
                <span className="text-sm text-white/70 uppercase tracking-wider">Punto de Equilibrio</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/40 mb-2">Inversión Inicial Est.</div>
                  <div className="text-xl text-white">$65,000 MXN</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-2">Utilidad Mensual</div>
                  <div className="text-xl text-white">${calculations.grossProfit.toLocaleString()} MXN</div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Período de Recuperación</span>
                  <span className="text-3xl text-white">
                    {calculations.breakEvenMonths !== 'N/A'
                      ? `${calculations.breakEvenMonths} meses`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-white/60" />
                <span className="text-sm text-white/70 uppercase tracking-wider">Desglose de Costos</span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: 'Electricidad',
                    value: calculations.electricityTotal,
                    icon: Zap,
                    color: 'yellow',
                  },
                  {
                    label: 'Renta',
                    value: financialInputsStore.rent,
                    icon: DollarSign,
                    color: 'blue',
                  },
                  {
                    label: 'Mano de Obra',
                    value: financialInputsStore.labor,
                    icon: Users,
                    color: 'green',
                  },
                  {
                    label: 'Nutrientes',
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
                Métricas de Producción
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/40">Producción Total</div>
                  <div className="text-white text-lg">{calculations.totalKgPerMonth} kg/mes</div>
                </div>
                <div>
                  <div className="text-white/40">Consumo Eléctrico</div>
                  <div className="text-white text-lg">{calculations.kwhPerMonth} kWh/mes</div>
                </div>
                <div>
                  <div className="text-white/40">Ingreso por kg</div>
                  <div className="text-white text-lg">${financialInputsStore.avgPricePerKg} MXN</div>
                </div>
                <div>
                  <div className="text-white/40">Frecuencia Cosecha</div>
                  <div className="text-white text-lg">{financialInputsStore.harvestFrequency}×/mes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
