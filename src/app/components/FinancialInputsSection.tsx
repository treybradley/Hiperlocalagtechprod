import { useState } from 'react';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { DollarSign, TrendingUp, Zap, Droplets, Users, Package, BarChart3 } from 'lucide-react';
import { useFarmConfig } from '../contexts/FarmConfigContext';
import { calculateSystemMetrics } from '../utils/farmCalculations';
import { useLanguage } from '../contexts/LanguageContext';

interface FinancialInputsSectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

// Store these in context so FinancialProjectionsSection can access them
export const financialInputsStore = {
  electricityCost: 4.5,
  rent: 12000,
  labor: 8000,
  nutrientsCost: 3500,
  avgPricePerKg: 280,
  harvestFrequency: 3,
};

export function FinancialInputsSection({ isActive, onNextSlide, isLastSlide, onPrevSlide, isFirstSlide }: FinancialInputsSectionProps) {
  const { config } = useFarmConfig();
  const { t } = useLanguage();
  const [electricityCost, setElectricityCost] = useState(4.5);
  const [rent, setRent] = useState(12000);
  const [labor, setLabor] = useState(8000);
  const [nutrientsCost, setNutrientsCost] = useState(3500);
  const [avgPricePerKg, setAvgPricePerKg] = useState(280);
  const [harvestFrequency, setHarvestFrequency] = useState([3]);

  // Update store when values change
  financialInputsStore.electricityCost = electricityCost;
  financialInputsStore.rent = rent;
  financialInputsStore.labor = labor;
  financialInputsStore.nutrientsCost = nutrientsCost;
  financialInputsStore.avgPricePerKg = avgPricePerKg;
  financialInputsStore.harvestFrequency = harvestFrequency[0];

  const systemMetrics = calculateSystemMetrics(config);
  const lightingLevel = config.lighting / 100;
  const kwhPerMonth = Math.round(config.roomSize * lightingLevel * 180);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col gap-4 md:gap-6 h-full overflow-y-auto pr-2 md:pr-4 pb-24">
          {/* Header */}
          <div className="flex-shrink-0 px-[0px] pt-[48px] pb-[0px]">
            <div className="space-y-2 mb-4 md:mb-6">
              <h2 className="text-white font-thin tracking-tight px-[0px] pt-[12px] pb-[0px] text-[32px]">
                {t('financial.subtitle')}
                <br />
                <span className="text-white/40">{t('financial.subtitle2')}</span>
              </h2>
              <p className="text-white/50 text-xs md:text-sm max-w-2xl">
                {t('financial.description')}
              </p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 flex-shrink-0">
            {/* Left: Operating Costs */}
            <div className="flex flex-col gap-6">

            {/* Based on System Config */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <div className="text-xs text-green-400/60 uppercase tracking-wider mb-2">
                {t("financial.basedOnConfig")}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-white/40">{t("financial.system")}</div>
                  <div className="text-white">{config.systemType.toUpperCase()}</div>
                </div>
                <div>
                  <div className="text-white/40">{t("financial.racks")}</div>
                  <div className="text-white">{config.racks}</div>
                </div>
                <div>
                  <div className="text-white/40">{t("financial.space")}</div>
                  <div className="text-white">{config.roomSize}m²</div>
                </div>
                <div>
                  <div className="text-white/40">{t("financial.consumption")}</div>
                  <div className="text-white">{kwhPerMonth} kWh/mes</div>
                </div>
              </div>
            </div>

            {/* Operating Costs */}
            <div className="space-y-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400/80" />
                <h3 className="text-sm text-white/70 uppercase tracking-wider">{t("financial.monthlyCosts")}</h3>
              </div>

              {/* Electricity */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-white/70">{t("financial.electricityKwh")}</label>
                  <Input
                    type="number"
                    value={electricityCost}
                    onChange={(e) => setElectricityCost(Number(e.target.value))}
                    className="w-24 bg-white/5 border-white/20 text-white text-right"
                    step="0.1"
                  />
                </div>
                <div className="text-xs text-white/40">
                  {kwhPerMonth} kWh/mes × ${electricityCost} = ${Math.round(kwhPerMonth * electricityCost)} MXN/mes
                </div>
              </div>

              {/* Rent */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-white/70">{t("financial.rentMonth")}</label>
                  <Input
                    type="number"
                    value={rent}
                    onChange={(e) => setRent(Number(e.target.value))}
                    className="w-32 bg-white/5 border-white/20 text-white text-right"
                    step="1000"
                  />
                </div>
              </div>

              {/* Labor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-white/70">{t("financial.laborMonth")}</label>
                  <Input
                    type="number"
                    value={labor}
                    onChange={(e) => setLabor(Number(e.target.value))}
                    className="w-32 bg-white/5 border-white/20 text-white text-right"
                    step="500"
                  />
                </div>
              </div>

              {/* Nutrients */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-white/70">{t("financial.nutrientsSupplies")}</label>
                  <Input
                    type="number"
                    value={nutrientsCost}
                    onChange={(e) => setNutrientsCost(Number(e.target.value))}
                    className="w-32 bg-white/5 border-white/20 text-white text-right"
                    step="500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Total {t("financial.monthlyCosts")}</span>
                  <span className="text-2xl text-white">
                    ${(Math.round(kwhPerMonth * electricityCost) + rent + labor + nutrientsCost).toLocaleString()} MXN
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Revenue Inputs */}
          <div className="flex flex-col gap-6">
            <div className="space-y-2 lg:hidden">
              <h3 className="text-3xl text-white tracking-tight">
                {t("financial.ingresos")}
                <br />
                <span className="text-white/40">{t("financial.proyectados")}</span>
              </h3>
            </div>

            {/* Yield from System */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <div className="text-xs text-green-400/60 uppercase tracking-wider mb-2">
                {t("financial.rendimientoBase")} del {t("financial.system")}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-white/40">{t("financial.rendimientoBase")}</div>
                  <div className="text-white">{systemMetrics.yieldKgMonth} kg/mes</div>
                </div>
                <div>
                  <div className="text-white/40">{t("financial.usoAgua")}</div>
                  <div className="text-white">{systemMetrics.waterLiters}L/mes</div>
                </div>
              </div>
            </div>

            {/* Revenue Model */}
            <div className="space-y-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400/80" />
                <h3 className="text-sm text-white/70 uppercase tracking-wider">{t("financial.configuracionIngresos")}</h3>
              </div>

              {/* Price per kg */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-white/70">{t("financial.precioPromedio")} (MXN/kg)</label>
                  <Input
                    type="number"
                    value={avgPricePerKg}
                    onChange={(e) => setAvgPricePerKg(Number(e.target.value))}
                    className="w-32 bg-white/5 border-white/20 text-white text-right"
                    step="10"
                  />
                </div>
              </div>

              {/* Harvest Frequency */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-white/70">{t("financial.cosechasPorMes")}</label>
                  <span className="text-white text-lg">{harvestFrequency[0]}</span>
                </div>
                <Slider
                  value={harvestFrequency}
                  onValueChange={setHarvestFrequency}
                  min={1}
                  max={6}
                  step={1}
                  className="py-2"
                />
                <div className="text-xs text-white/40">
                  {systemMetrics.yieldKgMonth} kg × {harvestFrequency[0]} {t("financial.harvests")} = {systemMetrics.yieldKgMonth * harvestFrequency[0]} kg/mes
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">{t("financial.totalIngresosMensual")}</span>
                  <span className="text-2xl text-green-400">
                    ${(systemMetrics.yieldKgMonth * harvestFrequency[0] * avgPricePerKg).toLocaleString()} MXN
                  </span>
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
