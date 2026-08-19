import type { DailyLog, GrowCycle, GrowStage, StageObservation } from '../models';
import {
  daysBetweenLocalDateStrings,
  toLocalDateInputValue,
} from './dateHelpers';

export const STAGE_ORDER: GrowStage[] = [
  'germination',
  'rootDevelopment',
  'vegetativeGrowth',
  'flowering',
  'harvest',
];

export function getLogStageObservation(log: DailyLog): StageObservation {
  return log.stageObservation ?? 'unchanged';
}

export function isDeclaredStage(
  observation: StageObservation,
): observation is GrowStage {
  return observation !== 'unchanged';
}

function sortedLogs(logs: DailyLog[]): DailyLog[] {
  return [...logs].sort((a, b) => a.timestamp - b.timestamp);
}

/** Latest non-unchanged stage by log timestamp. */
export function getEffectiveStage(
  logs: DailyLog[],
  fallback: GrowStage = 'germination',
): GrowStage {
  const declared = sortedLogs(logs).filter((log) =>
    isDeclaredStage(getLogStageObservation(log)),
  );
  if (declared.length === 0) return fallback;
  return getLogStageObservation(declared[declared.length - 1]) as GrowStage;
}

/** Carried-forward stage as of a specific log date (inclusive). */
export function getStageAsOfTimestamp(
  logs: DailyLog[],
  timestamp: number,
  fallback: GrowStage = 'germination',
): GrowStage {
  const declared = sortedLogs(logs).filter(
    (log) =>
      log.timestamp <= timestamp &&
      isDeclaredStage(getLogStageObservation(log)),
  );
  if (declared.length === 0) return fallback;
  return getLogStageObservation(declared[declared.length - 1]) as GrowStage;
}

export function getLogDayNumber(cycle: GrowCycle, log: DailyLog): number {
  return (
    daysBetweenLocalDateStrings(
      toLocalDateInputValue(cycle.seedDate),
      toLocalDateInputValue(log.timestamp),
    ) + 1
  );
}

export function buildStagesFromLogs(
  logs: DailyLog[],
  seedDate: number,
): GrowCycle['stages'] {
  const stageStarts: Partial<Record<GrowStage, number>> = {
    germination: seedDate,
  };

  for (const log of sortedLogs(logs)) {
    const observation = getLogStageObservation(log);
    if (!isDeclaredStage(observation)) continue;
    if (stageStarts[observation] == null) {
      stageStarts[observation] = log.timestamp;
    }
  }

  const nextStartAfter = (stage: GrowStage): number | undefined => {
    const idx = STAGE_ORDER.indexOf(stage);
    for (let i = idx + 1; i < STAGE_ORDER.length; i++) {
      const start = stageStarts[STAGE_ORDER[i]];
      if (start != null) return start;
    }
    return undefined;
  };

  const mk = (stage: GrowStage) => {
    const start = stageStarts[stage];
    if (start == null) return undefined;
    const end = nextStartAfter(stage);
    return end != null ? { startDate: start, endDate: end } : { startDate: start };
  };

  return {
    germination: mk('germination') ?? { startDate: seedDate },
    rootDevelopment: mk('rootDevelopment'),
    vegetativeGrowth: mk('vegetativeGrowth'),
    flowering: mk('flowering'),
    harvest: mk('harvest'),
  };
}

export function deriveCycleStageState(
  logs: DailyLog[],
  cycle: GrowCycle,
): {
  effectiveStage: GrowStage;
  stages: GrowCycle['stages'];
  currentStageIndex: number;
} {
  const fallback =
    cycle.currentStage === 'completed'
      ? 'harvest'
      : (cycle.currentStage as GrowStage);
  const effectiveStage = getEffectiveStage(logs, fallback);
  const stages = buildStagesFromLogs(logs, cycle.seedDate);
  const currentStageIndex = STAGE_ORDER.indexOf(effectiveStage);

  return {
    effectiveStage,
    stages,
    currentStageIndex: currentStageIndex >= 0 ? currentStageIndex : 0,
  };
}
