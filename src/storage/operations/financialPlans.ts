import { apiFetchAuth } from '../api';
import type { FarmConfig } from '../../app/contexts/FarmConfigContext';

export type StartupCostCategory =
  | 'lighting'
  | 'pumps'
  | 'nutrients'
  | 'seeds'
  | 'structure'
  | 'sensors'
  | 'installation'
  | 'permits'
  | 'other';

export interface StartupCostItem {
  id: string;
  name: string;
  category: StartupCostCategory;
  cost: number;
  quantity: number;
  vendor?: string;
  purchaseLink?: string;
}

export interface FinancialInputs {
  startupItems: StartupCostItem[];
  /** @deprecated Migrated into startupItems on load */
  systemCost?: number;
  /** @deprecated Migrated into startupItems on load */
  installCost?: number;
  electricity: number;
  water: number;
  nutrients: number;
  labor: number;
  otherMonthly: number;
}

export interface FinancialPlan {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  config: FarmConfig;
  results: {
    monthlyProfit?: number;
    annualRevenue?: number;
    roi?: number;
    paybackMonths?: number | null;
    [key: string]: unknown;
  };
  financialInputs?: FinancialInputs;
}

export interface SaveFinancialPlanData {
  name: string;
  config: FarmConfig;
  results: unknown;
  financialInputs: FinancialInputs;
}

export async function saveFinancialPlan(data: SaveFinancialPlanData): Promise<FinancialPlan> {
  return apiFetchAuth<FinancialPlan>('/financial-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getFinancialPlan(id: string): Promise<FinancialPlan> {
  return apiFetchAuth<FinancialPlan>(`/financial-plans/${id}`);
}

export async function listFinancialPlans(): Promise<FinancialPlan[]> {
  const plans = await apiFetchAuth<FinancialPlan[]>('/financial-plans');
  return plans.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function updateFinancialPlan(
  id: string,
  data: SaveFinancialPlanData
): Promise<FinancialPlan> {
  return apiFetchAuth<FinancialPlan>(`/financial-plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteFinancialPlan(id: string): Promise<void> {
  await apiFetchAuth<{ ok: boolean }>(`/financial-plans/${id}`, { method: 'DELETE' });
}
