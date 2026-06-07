import { getDB } from '../db';
import { DailyLog } from '../models';
import { incrementDailyLogCount } from './growCycles';

export async function createDailyLog(
  log: Omit<DailyLog, 'id' | 'createdAt'>
): Promise<DailyLog> {
  const db = await getDB();
  const now = Date.now();

  const newLog: DailyLog = {
    ...log,
    id: crypto.randomUUID(),
    createdAt: now,
  };

  await db.add('dailyLogs', newLog);

  // Update grow cycle's daily log count
  await incrementDailyLogCount(log.growCycleId);

  return newLog;
}

export async function getDailyLog(id: string): Promise<DailyLog | undefined> {
  const db = await getDB();
  return db.get('dailyLogs', id);
}

export async function getDailyLogsByGrowCycle(growCycleId: string): Promise<DailyLog[]> {
  const db = await getDB();
  const logs = await db.getAllFromIndex('dailyLogs', 'by-cycle', growCycleId);
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getDailyLogsBySystem(systemId: string): Promise<DailyLog[]> {
  const db = await getDB();
  const logs = await db.getAllFromIndex('dailyLogs', 'by-system', systemId);
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getLatestDailyLog(growCycleId: string): Promise<DailyLog | undefined> {
  const logs = await getDailyLogsByGrowCycle(growCycleId);
  return logs[0]; // Already sorted by timestamp desc
}

export async function updateDailyLog(
  id: string,
  updates: Partial<DailyLog>
): Promise<void> {
  const db = await getDB();
  const log = await db.get('dailyLogs', id);

  if (!log) {
    throw new Error('Daily log not found');
  }

  const updated = {
    ...log,
    ...updates,
    id: log.id,
    createdAt: log.createdAt,
  };

  await db.put('dailyLogs', updated);
}

export async function deleteDailyLog(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('dailyLogs', id);
}
