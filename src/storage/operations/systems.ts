import { HydroponicSystem } from '../models';
import { apiFetch } from '../api';

export async function createSystem(
  system: Omit<HydroponicSystem, 'id' | 'createdAt' | 'updatedAt' | 'totalCycles'>
): Promise<HydroponicSystem> {
  return apiFetch<HydroponicSystem>('/systems', {
    method: 'POST',
    body: JSON.stringify(system),
  });
}

export async function getSystem(id: string): Promise<HydroponicSystem | undefined> {
  try {
    return await apiFetch<HydroponicSystem>(`/systems/${id}`);
  } catch {
    return undefined;
  }
}

export async function getAllSystems(): Promise<HydroponicSystem[]> {
  return apiFetch<HydroponicSystem[]>('/systems');
}

export async function getSystemsByStatus(status: string): Promise<HydroponicSystem[]> {
  const all = await getAllSystems();
  return all.filter((s) => s.status === status);
}

export async function updateSystem(
  id: string,
  updates: Partial<HydroponicSystem>
): Promise<void> {
  await apiFetch<HydroponicSystem>(`/systems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteSystem(id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/systems/${id}`, { method: 'DELETE' });
}

export async function incrementSystemCycles(systemId: string): Promise<void> {
  const system = await getSystem(systemId);
  if (!system) throw new Error('System not found');
  await updateSystem(systemId, { totalCycles: system.totalCycles + 1 });
}
