import { DailyLog } from '../models';
import { apiFetchAuth } from '../api';

export async function createDailyLog(
  log: Omit<DailyLog, 'id' | 'createdAt'>
): Promise<DailyLog> {
  return apiFetchAuth<DailyLog>('/daily-logs', {
    method: 'POST',
    body: JSON.stringify(log),
  });
}

export async function getDailyLog(id: string): Promise<DailyLog | undefined> {
  try {
    return await apiFetchAuth<DailyLog>(`/daily-logs/${id}`);
  } catch {
    return undefined;
  }
}

export async function getDailyLogsByGrowCycle(growCycleId: string): Promise<DailyLog[]> {
  return apiFetchAuth<DailyLog[]>(`/daily-logs?growCycleId=${encodeURIComponent(growCycleId)}`);
}

export async function getDailyLogsBySystem(systemId: string): Promise<DailyLog[]> {
  return apiFetchAuth<DailyLog[]>(`/daily-logs?systemId=${encodeURIComponent(systemId)}`);
}

export async function getLatestDailyLog(growCycleId: string): Promise<DailyLog | undefined> {
  const logs = await getDailyLogsByGrowCycle(growCycleId);
  return logs[0];
}

export async function updateDailyLog(
  id: string,
  updates: Partial<DailyLog>
): Promise<void> {
  await apiFetchAuth<DailyLog>(`/daily-logs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteDailyLog(id: string): Promise<void> {
  await apiFetchAuth<{ ok: boolean }>(`/daily-logs/${id}`, { method: 'DELETE' });
}
