import { getDB } from '../db';
import { GrowCycle } from '../models';
import { incrementSystemCycles, updateSystem } from './systems';

export async function createGrowCycle(
  cycle: Omit<GrowCycle, 'id' | 'createdAt' | 'updatedAt' | 'dailyLogCount' | 'photoCount' | 'issueCount' | 'resolvedIssueCount'>
): Promise<GrowCycle> {
  const db = await getDB();
  const now = Date.now();

  const newCycle: GrowCycle = {
    ...cycle,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    dailyLogCount: 0,
    photoCount: 0,
    issueCount: 0,
    resolvedIssueCount: 0,
  };

  await db.add('growCycles', newCycle);

  // Update system's total cycles and active cycle
  await incrementSystemCycles(cycle.systemId);
  await updateSystem(cycle.systemId, { activeCycleId: newCycle.id });

  return newCycle;
}

export async function getGrowCycle(id: string): Promise<GrowCycle | undefined> {
  const db = await getDB();
  return db.get('growCycles', id);
}

export async function getAllGrowCycles(): Promise<GrowCycle[]> {
  const db = await getDB();
  return db.getAll('growCycles');
}

export async function getGrowCyclesBySystem(systemId: string): Promise<GrowCycle[]> {
  const db = await getDB();
  return db.getAllFromIndex('growCycles', 'by-system', systemId);
}

export async function getActiveGrowCycles(): Promise<GrowCycle[]> {
  const db = await getDB();
  return db.getAllFromIndex('growCycles', 'by-status', 'active');
}

export async function updateGrowCycle(
  id: string,
  updates: Partial<GrowCycle>
): Promise<void> {
  const db = await getDB();
  const cycle = await db.get('growCycles', id);

  if (!cycle) {
    throw new Error('Grow cycle not found');
  }

  const updated = {
    ...cycle,
    ...updates,
    id: cycle.id,
    createdAt: cycle.createdAt,
    updatedAt: Date.now(),
  };

  await db.put('growCycles', updated);
}

export async function advanceGrowCycleStage(
  cycleId: string,
  newStage: 'rootDevelopment' | 'vegetativeGrowth' | 'flowering' | 'harvest' | 'completed'
): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) {
    throw new Error('Grow cycle not found');
  }

  const now = Date.now();
  const updatedStages = { ...cycle.stages };

  // Close current stage
  if (cycle.currentStage === 'germination' && updatedStages.germination) {
    updatedStages.germination.endDate = now;
  } else if (cycle.currentStage === 'rootDevelopment' && updatedStages.rootDevelopment) {
    updatedStages.rootDevelopment.endDate = now;
  } else if (cycle.currentStage === 'vegetativeGrowth' && updatedStages.vegetativeGrowth) {
    updatedStages.vegetativeGrowth.endDate = now;
  } else if (cycle.currentStage === 'flowering' && updatedStages.flowering) {
    updatedStages.flowering.endDate = now;
  }

  // Open new stage
  if (newStage === 'rootDevelopment') {
    updatedStages.rootDevelopment = { startDate: now };
  } else if (newStage === 'vegetativeGrowth') {
    updatedStages.vegetativeGrowth = { startDate: now };
  } else if (newStage === 'flowering') {
    updatedStages.flowering = { startDate: now };
  } else if (newStage === 'harvest') {
    updatedStages.harvest = { startDate: now };
  }

  await updateGrowCycle(cycleId, {
    stages: updatedStages,
    currentStage: newStage,
  });
}

export async function completeGrowCycle(
  cycleId: string,
  results: GrowCycle['cycleResults']
): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) {
    throw new Error('Grow cycle not found');
  }

  const now = Date.now();
  const updatedStages = { ...cycle.stages };

  // Close harvest stage
  if (updatedStages.harvest) {
    updatedStages.harvest.endDate = now;
  }

  await updateGrowCycle(cycleId, {
    status: 'completed',
    currentStage: 'completed',
    harvestDate: now,
    stages: updatedStages,
    cycleResults: results,
  });

  // Clear active cycle from system
  await updateSystem(cycle.systemId, { activeCycleId: undefined });
}

export async function incrementDailyLogCount(cycleId: string): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) {
    throw new Error('Grow cycle not found');
  }

  await updateGrowCycle(cycleId, {
    dailyLogCount: cycle.dailyLogCount + 1,
  });
}

export async function incrementPhotoCount(cycleId: string, count: number = 1): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) {
    throw new Error('Grow cycle not found');
  }

  await updateGrowCycle(cycleId, {
    photoCount: cycle.photoCount + count,
  });
}

export async function incrementIssueCount(cycleId: string): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) {
    throw new Error('Grow cycle not found');
  }

  await updateGrowCycle(cycleId, {
    issueCount: cycle.issueCount + 1,
  });
}

export async function incrementResolvedIssueCount(cycleId: string): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) {
    throw new Error('Grow cycle not found');
  }

  await updateGrowCycle(cycleId, {
    resolvedIssueCount: cycle.resolvedIssueCount + 1,
  });
}
