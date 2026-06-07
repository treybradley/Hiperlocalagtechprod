import { apiFetchAuth } from '../api';

export interface FinancialPlan {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  config: unknown;
  results: unknown;
}

export async function saveFinancialPlan(
  name: string,
  config: unknown,
  results: unknown
): Promise<FinancialPlan> {
  return apiFetchAuth<FinancialPlan>('/financial-plans', {
    method: 'POST',
    body: JSON.stringify({ name, config, results }),
  });
}

export async function listFinancialPlans(): Promise<FinancialPlan[]> {
  return apiFetchAuth<FinancialPlan[]>('/financial-plans');
}

export async function deleteFinancialPlan(id: string): Promise<void> {
  await apiFetchAuth<{ ok: boolean }>(`/financial-plans/${id}`, { method: 'DELETE' });
}
