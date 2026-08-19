import type { DailyLog } from '../models';
import { getDailyLogsByGrowCycle } from './dailyLogs';
import { getGrowCycle, updateGrowCycle } from './growCycles';
import {
  buildStagesFromLogs,
  deriveCycleStageState,
  getEffectiveStage,
} from '../utils/stageFromLogs';

export async function reconcileCycleStagesFromLogs(
  cycleId: string,
  logs?: DailyLog[],
): Promise<void> {
  const cycle = await getGrowCycle(cycleId);
  if (!cycle) return;

  const allLogs = logs ?? (await getDailyLogsByGrowCycle(cycleId));
  const { effectiveStage, stages } = deriveCycleStageState(allLogs, cycle);

  if (cycle.status === 'completed') {
    await updateGrowCycle(cycleId, { stages });
    return;
  }

  await updateGrowCycle(cycleId, {
    currentStage: effectiveStage,
    stages,
  });
}

// Re-export for convenience
export { getEffectiveStage, deriveCycleStageState, buildStagesFromLogs };
