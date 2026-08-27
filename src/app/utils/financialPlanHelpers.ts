import type { FarmConfig, CropParams } from '../contexts/FarmConfigContext';
import { getTotalPlantsByCrop } from '../contexts/FarmConfigContext';
import {
  getFinancialPlan,
  saveFinancialPlan,
  type FinancialInputs,
  type FinancialPlan,
  type StartupCostItem,
} from '../../storage/operations/financialPlans';
import { CROP_MAP, SYSTEM_TYPE_LABELS } from '../data/crops';

export const STARTUP_COST_CATEGORY_LABELS: Record<StartupCostItem['category'], string> = {
  lighting: 'Lighting',
  pumps: 'Pumps',
  nutrients: 'Nutrients',
  seeds: 'Seeds',
  structure: 'Structure',
  sensors: 'Sensors',
  installation: 'Installation',
  permits: 'Permits & fees',
  other: 'Other',
};

export function createStartupCostItem(
  partial: Partial<StartupCostItem> & Pick<StartupCostItem, 'name'>
): StartupCostItem {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    category: partial.category ?? 'other',
    cost: partial.cost ?? 0,
    quantity: partial.quantity ?? 1,
    vendor: partial.vendor,
    purchaseLink: partial.purchaseLink,
  };
}

export const DEFAULT_STARTUP_ITEMS: StartupCostItem[] = [
  createStartupCostItem({ id: 'default-equipment', name: 'Grow system / equipment', category: 'structure', cost: 45000, quantity: 1 }),
  createStartupCostItem({ id: 'default-install', name: 'Installation & setup', category: 'installation', cost: 8000, quantity: 1 }),
];

/** Small patio / hospitality op costs — sized so the default demo farm is profitable. */
export const DEFAULT_FINANCIAL_INPUTS: FinancialInputs = {
  startupItems: DEFAULT_STARTUP_ITEMS.map(item => ({ ...item })),
  electricity: 1400,
  water: 250,
  nutrients: 900,
  labor: 3200,
  otherMonthly: 600,
};

export function computeStartupTotal(items: StartupCostItem[]): number {
  return items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
}

/** Ensures startupItems exist; migrates legacy lump-sum fields when needed. */
export function normalizeFinancialInputs(raw: Partial<FinancialInputs> | null | undefined): FinancialInputs {
  const merged: FinancialInputs = {
    ...DEFAULT_FINANCIAL_INPUTS,
    ...raw,
    startupItems: raw?.startupItems ? raw.startupItems.map(item => ({ ...item })) : [],
  };

  if (merged.startupItems.length > 0) {
    return merged;
  }

  const systemCost = raw?.systemCost ?? 45000;
  const installCost = raw?.installCost ?? 8000;
  merged.startupItems = [
    createStartupCostItem({ name: 'Grow system / equipment', category: 'structure', cost: systemCost, quantity: 1 }),
    createStartupCostItem({ name: 'Installation & setup', category: 'installation', cost: installCost, quantity: 1 }),
  ];
  return merged;
}

export interface FinancialCalcResult {
  totalCapital: number;
  totalMonthlyOp: number;
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyProfit: number;
  annualProfit: number;
  annualCosts: number;
  paybackMonths: number | null;
  roi: number;
  margin: number;
  annualYieldKg: number;
  monthlyYieldKg: number;
  perCrop: Array<{ cropId: string; totalUnits: number; monthlyRev: number; annualYield: number }>;
}

export function fmtCurrency(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPlanDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function computeFinancialResults(
  config: FarmConfig,
  inputs: FinancialInputs
): FinancialCalcResult {
  const normalized = normalizeFinancialInputs(inputs);
  const totalCapital = computeStartupTotal(normalized.startupItems);
  const totalMonthlyOp =
    inputs.electricity + inputs.water + inputs.nutrients + inputs.labor + inputs.otherMonthly;
  const annualCosts = totalMonthlyOp * 12;

  const totalPlantsByCrop = getTotalPlantsByCrop(config.systemBlocks);
  const activeCropIds = Object.keys(totalPlantsByCrop);

  let totalMonthlyRevenue = 0;
  let totalAnnualYieldKg = 0;

  const perCrop = activeCropIds.map(cropId => {
    const p = config.cropParams[cropId];
    const totalUnits = totalPlantsByCrop[cropId] ?? 0;
    const annualYield =
      totalUnits * p.yieldPerUnitPerCycle * p.cyclesPerYear * (1 - p.lossRate / 100);
    const monthlyYield = annualYield / 12;
    const monthlyRev = monthlyYield * p.pricePerKg;
    totalMonthlyRevenue += monthlyRev;
    totalAnnualYieldKg += annualYield;
    return { cropId, totalUnits, monthlyRev, annualYield };
  });

  const annualRevenue = totalMonthlyRevenue * 12;
  const monthlyProfit = totalMonthlyRevenue - totalMonthlyOp;
  const annualProfit = monthlyProfit * 12;
  const paybackMonths = monthlyProfit > 0 ? totalCapital / monthlyProfit : null;
  const roi = totalCapital > 0 ? (annualProfit / totalCapital) * 100 : 0;
  const margin = totalMonthlyRevenue > 0 ? (monthlyProfit / totalMonthlyRevenue) * 100 : 0;

  return {
    totalCapital,
    totalMonthlyOp,
    monthlyRevenue: totalMonthlyRevenue,
    annualRevenue,
    monthlyProfit,
    annualProfit,
    annualCosts,
    paybackMonths,
    roi,
    margin,
    annualYieldKg: totalAnnualYieldKg,
    monthlyYieldKg: totalAnnualYieldKg / 12,
    perCrop,
  };
}

export function applyFinancialPlanToState(
  plan: FinancialPlan,
  replaceConfig: (config: FarmConfig) => void,
  onFinancialInputs?: (inputs: FinancialInputs) => void
) {
  replaceConfig(plan.config as FarmConfig);
  if (plan.financialInputs && onFinancialInputs) {
    onFinancialInputs(normalizeFinancialInputs(plan.financialInputs));
  }
}

export function getActiveCropIdsFromConfig(config: FarmConfig): string[] {
  return Object.keys(getTotalPlantsByCrop(config.systemBlocks));
}

export function describeSystemBlock(block: FarmConfig['systemBlocks'][0]) {
  const totalUnits = block.cropAllocations.reduce((s, a) => s + a.unitCount, 0);
  const crops = block.cropAllocations.map(a => {
    const crop = CROP_MAP[a.cropId];
    const isMicro = block.systemType === 'microgreens';
    const count = isMicro ? a.unitCount : a.plantsPerUnit * a.unitCount;
    return `${count} ${crop?.name ?? a.cropId}`;
  }).join(', ') || 'no crops assigned';

  return `${totalUnits}× ${SYSTEM_TYPE_LABELS[block.systemType]} · ${crops}`;
}

export interface CropRevenueBreakdown {
  annualKg: number;
  monthlyKg: number;
  monthlyRev: number;
  perUnitMonthlyKg: number;
  perUnitMonthlyRev: number;
}

/** Explains how per-crop monthly revenue is derived from unit count and production params. */
export function getCropRevenueBreakdown(
  totalUnits: number,
  p: CropParams
): CropRevenueBreakdown {
  const annualKg =
    totalUnits * p.yieldPerUnitPerCycle * p.cyclesPerYear * (1 - p.lossRate / 100);
  const monthlyKg = annualKg / 12;
  const monthlyRev = monthlyKg * p.pricePerKg;
  const perUnitMonthlyKg = totalUnits > 0 ? monthlyKg / totalUnits : 0;
  const perUnitMonthlyRev = totalUnits > 0 ? monthlyRev / totalUnits : 0;
  return { annualKg, monthlyKg, monthlyRev, perUnitMonthlyKg, perUnitMonthlyRev };
}

export function duplicatePlanName(originalName: string) {
  const base = originalName.trim() || 'Untitled plan';
  return base.startsWith('Copy of ') ? `${base} (copy)` : `Copy of ${base}`;
}

export async function duplicateFinancialPlan(
  sourceId: string,
  nameOverride?: string
): Promise<FinancialPlan> {
  const plan = await getFinancialPlan(sourceId);
  const inputs = normalizeFinancialInputs(plan.financialInputs);
  const config = structuredClone(plan.config) as FarmConfig;
  const results = computeFinancialResults(config, inputs);
  return saveFinancialPlan({
    name: nameOverride ?? duplicatePlanName(plan.name),
    config,
    results,
    financialInputs: inputs,
  });
}

export async function duplicateFinancialPlanFromData(
  name: string,
  config: FarmConfig,
  inputs: FinancialInputs
): Promise<FinancialPlan> {
  const normalized = normalizeFinancialInputs(inputs);
  const results = computeFinancialResults(config, normalized);
  return saveFinancialPlan({
    name: duplicatePlanName(name),
    config: structuredClone(config),
    results,
    financialInputs: normalized,
  });
}

export function updateCropParamInConfig(
  config: FarmConfig,
  cropId: string,
  param: Partial<CropParams>
): FarmConfig {
  return {
    ...config,
    cropParams: {
      ...config.cropParams,
      [cropId]: { ...config.cropParams[cropId], ...param },
    },
  };
}
