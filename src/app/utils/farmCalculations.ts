type SystemType = 'nft' | 'kratky' | 'vertical-wall' | 'microgreens';
type Environment = 'open-air' | 'climate-controlled';
type AutomationLevel = 'manual' | 'semi-auto' | 'full-auto';

interface FarmConfig {
  systemType: SystemType;
  racks: number;
  roomSize: number;
  environment: Environment;
  lighting: number;
  automation: AutomationLevel;
}

interface OperatingCosts {
  electricityCost: number;
  rent: number;
  labor: number;
  nutrientsCost: number;
}

interface RevenueInputs {
  avgPricePerKg: number;
  harvestFrequency: number;
}

export function calculateSystemMetrics(config: FarmConfig) {
  const baseStartupCost = {
    'nft': 8500,
    'kratky': 3200,
    'vertical-wall': 12000,
    'microgreens': 4500,
  }[config.systemType];

  const automationMultiplier = {
    'manual': 1.0,
    'semi-auto': 1.4,
    'full-auto': 2.1,
  }[config.automation];

  const envMultiplier = config.environment === 'climate-controlled' ? 1.6 : 1.0;

  const startupCost = baseStartupCost * config.racks * automationMultiplier * envMultiplier;

  const lightingLevel = config.lighting / 100;
  const monthlyOperating = (
    (config.roomSize * 45) + // rent estimate
    (config.roomSize * lightingLevel * 12) + // electricity
    (config.racks * 85) + // nutrients & supplies
    (config.automation === 'manual' ? 800 : config.automation === 'semi-auto' ? 400 : 150) // labor
  );

  const electricityKwh = config.roomSize * lightingLevel * 180;
  const waterLiters = config.racks * 120;
  const yieldKgMonth = config.racks * (config.systemType === 'microgreens' ? 18 : 12);
  const revenuePerKg = 280; // MXN
  const monthlyRevenue = yieldKgMonth * revenuePerKg;
  const grossMargin = ((monthlyRevenue - monthlyOperating) / monthlyRevenue) * 100;
  const paybackMonths = startupCost / (monthlyRevenue - monthlyOperating);

  return {
    startupCost: Math.round(startupCost),
    monthlyOperating: Math.round(monthlyOperating),
    electricityKwh: Math.round(electricityKwh),
    waterLiters: Math.round(waterLiters),
    yieldKgMonth: Math.round(yieldKgMonth),
    monthlyRevenue: Math.round(monthlyRevenue),
    grossMargin: Math.max(0, Math.round(grossMargin)),
    paybackMonths: Math.max(0, paybackMonths.toFixed(1)),
  };
}

export function calculateFinancials(
  config: FarmConfig,
  costs: OperatingCosts,
  revenue: RevenueInputs
) {
  const systemMetrics = calculateSystemMetrics(config);
  const lightingLevel = config.lighting / 100;
  const kwhPerMonth = config.roomSize * lightingLevel * 180;

  // Monthly Costs
  const electricityTotal = kwhPerMonth * costs.electricityCost;
  const totalMonthlyCosts = electricityTotal + costs.rent + costs.labor + costs.nutrientsCost;

  // Monthly Revenue
  const totalKgPerMonth = systemMetrics.yieldKgMonth * revenue.harvestFrequency;
  const monthlyRevenue = totalKgPerMonth * revenue.avgPricePerKg;

  // Margins
  const grossProfit = monthlyRevenue - totalMonthlyCosts;
  const grossMargin = monthlyRevenue > 0 ? (grossProfit / monthlyRevenue) * 100 : 0;

  // Annual Projections
  const annualRevenue = monthlyRevenue * 12;
  const annualCosts = totalMonthlyCosts * 12;
  const annualProfit = grossProfit * 12;

  // Break-even
  const breakEvenMonths = grossProfit > 0 ? systemMetrics.startupCost / grossProfit : 0;

  return {
    electricityTotal: Math.round(electricityTotal),
    totalMonthlyCosts: Math.round(totalMonthlyCosts),
    monthlyRevenue: Math.round(monthlyRevenue),
    grossProfit: Math.round(grossProfit),
    grossMargin: Math.round(grossMargin),
    totalKgPerMonth: Math.round(totalKgPerMonth),
    annualRevenue: Math.round(annualRevenue),
    annualCosts: Math.round(annualCosts),
    annualProfit: Math.round(annualProfit),
    breakEvenMonths: breakEvenMonths > 0 ? breakEvenMonths.toFixed(1) : 'N/A',
    kwhPerMonth: Math.round(kwhPerMonth),
  };
}
