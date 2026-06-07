import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Zap,
  Droplets,
  Package,
  BarChart3,
} from 'lucide-react';

interface FinancialSectionProps {
  isActive: boolean;
}

export function FinancialSection({ isActive }: FinancialSectionProps) {
  // Operating Costs (monthly)
  const [electricityCost, setElectricityCost] = useState(4.5); // MXN per kWh
  const [rent, setRent] = useState(12000);
  const [labor, setLabor] = useState(8000);
  const [nutrientsCost, setNutrientsCost] = useState(3500);

  // Revenue Inputs
  const [clientCount, setClientCount] = useState([4]);
  const [avgPricePerKg, setAvgPricePerKg] = useState(280);
  const [harvestFrequency, setHarvestFrequency] = useState([3]); // times per month

  // System specs
  const [kwhPerMonth] = useState(1850);
  const [kgPerHarvest] = useState(45);

  const calculations = useMemo(() => {
    const clients = clientCount[0];
    const harvests = harvestFrequency[0];

    // Monthly Costs
    const electricityTotal = (kwhPerMonth * electricityCost);
    const totalMonthlyCosts = electricityTotal + rent + labor + nutrientsCost;

    // Monthly Revenue
    const totalKgPerMonth = kgPerHarvest * harvests;
    const monthlyRevenue = totalKgPerMonth * avgPricePerKg;

    // Margins
    const grossProfit = monthlyRevenue - totalMonthlyCosts;
    const grossMargin = (grossProfit / monthlyRevenue) * 100;

    // Annual Projections
    const annualRevenue = monthlyRevenue * 12;
    const annualCosts = totalMonthlyCosts * 12;
    const annualProfit = grossProfit * 12;

    // Break-even
    const estimatedStartupCost = 65000;
    const breakEvenMonths = grossProfit > 0 ? estimatedStartupCost / grossProfit : 0;

    return {
      // Monthly
      electricityTotal: Math.round(electricityTotal),
      totalMonthlyCosts: Math.round(totalMonthlyCosts),
      monthlyRevenue: Math.round(monthlyRevenue),
      grossProfit: Math.round(grossProfit),
      grossMargin: Math.round(grossMargin),
      totalKgPerMonth: Math.round(totalKgPerMonth),

      // Annual
      annualRevenue: Math.round(annualRevenue),
      annualCosts: Math.round(annualCosts),
      annualProfit: Math.round(annualProfit),

      // Break-even
      breakEvenMonths: breakEvenMonths > 0 ? breakEvenMonths.toFixed(1) : 'N/A',
    };
  }, [
    electricityCost,
    rent,
    labor,
    nutrientsCost,
    clientCount,
    avgPricePerKg,
    harvestFrequency,
    kwhPerMonth,
    kgPerHarvest,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 h-full">
          {/* Left: Inputs */}
          <div className="flex flex-col gap-6 overflow-y-auto pr-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400/80 text-xs uppercase tracking-wider">
                <BarChart3 className="w-3 h-3" />
                Financial Planning
              </div>
              <h2 className="text-5xl text-white tracking-tight">
                Interactive
                <br />
                <span className="text-white/40">Financial Model</span>
              </h2>
              <p className="text-white/50 text-sm max-w-md">
                Adjust inputs to explore different operating scenarios and profitability.
              </p>
            </div>

            {/* Operating Costs */}
            <div className="space-y-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400/80" />
                <h3 className="text-sm text-white/70 uppercase tracking-wider">Operating Costs</h3>
              </div>

              {/* Electricity */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-white/70">Electricity (MXN/kWh)</label>
                  <Input
                    type="number"
                    value={electricityCost}
                    onChange={(e) => setElectricityCost(Number(e.target.value))}
                    className="w-24 bg-white/5 border-white/20 text-white text-right"
                    step="0.1"
                  />
                </div>
                <div className="text-xs text-white/40">
                  {kwhPerMonth} kWh/mo × ${electricityCost} = ${calculations.electricityTotal}/mo
                </div>
              </div>

              {/* Rent */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-white/70">Rent (MXN/month)</label>
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
                  <label className="text-sm text-white/70">Labor (MXN/month)</label>
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
                  <label className="text-sm text-white/70">Nutrients & Supplies (MXN/month)</label>
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
                  <span className="text-white/50 text-sm">Total Monthly Costs</span>
                  <span className="text-2xl text-white">${ calculations.totalMonthlyCosts.toLocaleString() } MXN</span>
                </div>
              </div>
            </div>

            {/* Revenue Inputs */}
            <div className="space-y-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400/80" />
                <h3 className="text-sm text-white/70 uppercase tracking-wider">Revenue Model</h3>
              </div>

              {/* Client Count */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-white/70">Active Clients</label>
                  <span className="text-white text-lg">{clientCount[0]}</span>
                </div>
                <Slider
                  value={clientCount}
                  onValueChange={setClientCount}
                  min={1}
                  max={15}
                  step={1}
                  className="py-2"
                />
              </div>

              {/* Price per kg */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-white/70">Avg Price (MXN/kg)</label>
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
                  <label className="text-sm text-white/70">Harvests per Month</label>
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
                  {kgPerHarvest} kg × {harvestFrequency[0]} harvests = {calculations.totalKgPerMonth} kg/mo
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Total Monthly Revenue</span>
                  <span className="text-2xl text-green-400">${ calculations.monthlyRevenue.toLocaleString() } MXN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400/80 text-xs uppercase tracking-wider">
                <TrendingUp className="w-3 h-3" />
                Projected Performance
              </div>
              <h3 className="text-3xl text-white tracking-tight">Results & Projections</h3>
            </div>

            {/* Monthly P&L */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-400/60" />
                  <span className="text-sm text-white/70 uppercase tracking-wider">Monthly P&L</span>
                </div>
                <Badge variant="outline" className="border-green-500/30 text-green-300">
                  {calculations.grossMargin}% margin
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Revenue</span>
                  <span className="text-white">${ calculations.monthlyRevenue.toLocaleString() } MXN</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Operating Costs</span>
                  <span className="text-white">-${ calculations.totalMonthlyCosts.toLocaleString() } MXN</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Gross Profit</span>
                  <span className={`text-2xl ${calculations.grossProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${ calculations.grossProfit.toLocaleString() } MXN
                  </span>
                </div>
              </div>
            </div>

            {/* Annual Projections */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400/60" />
                <span className="text-sm text-white/70 uppercase tracking-wider">Annual Projection</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-xs text-white/40 uppercase tracking-wider">Revenue</div>
                  <div className="text-xl text-white">${(calculations.annualRevenue / 1000).toFixed(0)}k</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-white/40 uppercase tracking-wider">Costs</div>
                  <div className="text-xl text-white">${(calculations.annualCosts / 1000).toFixed(0)}k</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-white/40 uppercase tracking-wider">Profit</div>
                  <div className={`text-xl ${calculations.annualProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${(calculations.annualProfit / 1000).toFixed(0)}k
                  </div>
                </div>
              </div>
            </div>

            {/* Break-even */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400/60" />
                  <span className="text-sm text-white/70 uppercase tracking-wider">Break-Even Analysis</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Est. Startup Investment</span>
                    <span className="text-white">$65,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Monthly Profit</span>
                    <span className="text-white">${ calculations.grossProfit.toLocaleString() } MXN</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Payback Period</span>
                    <span className="text-3xl text-white">
                      {calculations.breakEvenMonths !== 'N/A'
                        ? `${calculations.breakEvenMonths} mo`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-white/60" />
                <span className="text-sm text-white/70 uppercase tracking-wider">Cost Breakdown</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Electricity', value: calculations.electricityTotal, icon: Zap, color: 'yellow' },
                  { label: 'Rent', value: rent, icon: DollarSign, color: 'blue' },
                  { label: 'Labor', value: labor, icon: Users, color: 'green' },
                  { label: 'Nutrients', value: nutrientsCost, icon: Droplets, color: 'cyan' },
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
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${item.color}-400/40`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
