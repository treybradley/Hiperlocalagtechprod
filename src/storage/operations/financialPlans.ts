import { apiFetch } from '../api';

export interface FinancialPlan {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  config: unknown; // FarmConfig snapshot
  results: unknown; // calculated totals snapshot
}

export async function saveFinancialPlan(
  name: string,
  config: unknown,
  results: unknown
): Promise<FinancialPlan> {
  return apiFetch<FinancialPlan>('/financial-plans', {
    method: 'POST',
    body: JSON.stringify({ name, config, results }),
  });
}

export async function listFinancialPlans(): Promise<FinancialPlan[]> {
  return apiFetch<FinancialPlan[]>('/financial-plans');
}

export async function deleteFinancialPlan(id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/financial-plans/${id}`, { method: 'DELETE' });
}
