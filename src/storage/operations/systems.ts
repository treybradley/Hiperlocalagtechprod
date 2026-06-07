import { getDB } from '../db';
import { HydroponicSystem } from '../models';

export async function createSystem(
  system: Omit<HydroponicSystem, 'id' | 'createdAt' | 'updatedAt' | 'totalCycles'>
): Promise<HydroponicSystem> {
  const db = await getDB();
  const now = Date.now();

  const newSystem: HydroponicSystem = {
    ...system,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    totalCycles: 0,
  };

  await db.add('systems', newSystem);
  return newSystem;
}

export async function getSystem(id: string): Promise<HydroponicSystem | undefined> {
  const db = await getDB();
  return db.get('systems', id);
}

export async function getAllSystems(): Promise<HydroponicSystem[]> {
  const db = await getDB();
  return db.getAll('systems');
}

export async function getSystemsByStatus(status: string): Promise<HydroponicSystem[]> {
  const db = await getDB();
  return db.getAllFromIndex('systems', 'by-status', status);
}

export async function updateSystem(
  id: string,
  updates: Partial<HydroponicSystem>
): Promise<void> {
  const db = await getDB();
  const system = await db.get('systems', id);

  if (!system) {
    throw new Error('System not found');
  }

  const updated = {
    ...system,
    ...updates,
    id: system.id,
    createdAt: system.createdAt,
    updatedAt: Date.now(),
  };

  await db.put('systems', updated);
}

export async function deleteSystem(id: string): Promise<void> {
  const db = await getDB();

  // Check for dependent grow cycles
  const cycles = await db.getAllFromIndex('growCycles', 'by-system', id);
  if (cycles.length > 0) {
    throw new Error('Cannot delete system with existing grow cycles');
  }

  await db.delete('systems', id);
}

export async function incrementSystemCycles(systemId: string): Promise<void> {
  const system = await getSystem(systemId);
  if (!system) {
    throw new Error('System not found');
  }

  await updateSystem(systemId, {
    totalCycles: system.totalCycles + 1,
  });
}
