import { GrowCycle } from '../models';
import { apiFetchAuth } from '../api';
import { getSystem, updateSystem } from './systems';

export async function createGrowCycle(
  cycle: Omit<GrowCycle, 'id' | 'createdAt' | 'updatedAt' | 'dailyLogCount' | 'photoCount' | 'issueCount' | 'resolvedIssueCount'>
): Promise<GrowCycle> {
  return apiFetchAuth<GrowCycle>('/grow-cycles', {
    method: 'POST',
    body: JSON.stringify(cycle),
  });
}

export async function getGrowCycle(id: string): Promise<GrowCycle | undefined> {
  try {
    return await apiFetchAuth<GrowCycle>(`/grow-cycles/${id}`);
  } catch {
    return undefined;
  }
}

export async function getAllGrowCycles(): Promise<GrowCycle[]> {
  return apiFetchAuth<GrowCycle[]>('/grow-cycles');
}

export async function getGrowCyclesBySystem(systemId: string): Promise<GrowCycle[]> {
  return apiFetchAuth<GrowCycle[]>(`/grow-cycles?systemId=${encodeURIComponent(systemId)}`);
}

export async function getActiveGrowCycles(): Promise<GrowCycle[]> {
  return apiFetchAuth<GrowCycle[]>('/grow-cycles?status=active');
}

export async function updateGrowCycle(
  id: string,
  updates: Partial<GrowCycle>
): Promise<void> {
  await apiFetchAuth<GrowCycle>(`/grow-cycles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function advanceGrowCycleStage(
  cycleId: string,
  newStage: 'rootDevelopment' | 'vegetativeGrowth' | 'flowering' | 'harvest' | 'completed'
): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) throw new Error('Grow cycle not found');

  const now = Date.now();
  const updatedStages = { ...cycle.stages };

  if (cycle.currentStage === 'germination' && updatedStages.germination) {
    updatedStages.germination.endDate = now;
  } else if (cycle.currentStage === 'rootDevelopment' && updatedStages.rootDevelopment) {
    updatedStages.rootDevelopment.endDate = now;
  } else if (cycle.currentStage === 'vegetativeGrowth' && updatedStages.vegetativeGrowth) {
    updatedStages.vegetativeGrowth.endDate = now;
  } else if (cycle.currentStage === 'flowering' && updatedStages.flowering) {
    updatedStages.flowering.endDate = now;
  }

  if (newStage === 'rootDevelopment') updatedStages.rootDevelopment = { startDate: now };
  else if (newStage === 'vegetativeGrowth') updatedStages.vegetativeGrowth = { startDate: now };
  else if (newStage === 'flowering') updatedStages.flowering = { startDate: now };
  else if (newStage === 'harvest') updatedStages.harvest = { startDate: now };

  await updateGrowCycle(cycleId, { stages: updatedStages, currentStage: newStage });
}

export async function completeGrowCycle(
  cycleId: string,
  results: GrowCycle['cycleResults']
): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) throw new Error('Grow cycle not found');

  const now = Date.now();
  const updatedStages = { ...cycle.stages };
  if (updatedStages.harvest) updatedStages.harvest.endDate = now;

  await updateGrowCycle(cycleId, {
    status: 'completed',
    currentStage: 'completed',
    harvestDate: now,
    stages: updatedStages,
    cycleResults: results,
  });

  const sys = await getSystem(cycle.systemId);
  if (sys) {
    await updateSystem(cycle.systemId, { activeCycleId: undefined });
  }
}

export async function incrementDailyLogCount(cycleId: string): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) throw new Error('Grow cycle not found');
  await updateGrowCycle(cycleId, { dailyLogCount: cycle.dailyLogCount + 1 });
}

export async function incrementPhotoCount(cycleId: string, count = 1): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) throw new Error('Grow cycle not found');
  await updateGrowCycle(cycleId, { photoCount: cycle.photoCount + count });
}

export async function incrementIssueCount(cycleId: string): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) throw new Error('Grow cycle not found');
  await updateGrowCycle(cycleId, { issueCount: cycle.issueCount + 1 });
}

export async function incrementResolvedIssueCount(cycleId: string): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) throw new Error('Grow cycle not found');
  await updateGrowCycle(cycleId, { resolvedIssueCount: cycle.resolvedIssueCount + 1 });
}
