import type { DailyLog } from '../../../../storage/models';
import type { DailyLogExportContext, ExportSnapshot, ExportStat, ExportStatKey } from './types';
import { ALL_STAT_KEYS } from './types';

function formatCropLabel(cropType: string): string {
  return cropType
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildStats(
  log: DailyLog,
  labels: Record<ExportStatKey, string>,
): ExportStat[] {
  const stats: ExportStat[] = [];
  const env = log.environment;

  if (env.temperature != null) {
    stats.push({ key: 'temperature', label: labels.temperature, value: `${env.temperature}°C` });
  }
  if (env.humidity != null) {
    stats.push({ key: 'humidity', label: labels.humidity, value: `${env.humidity}%` });
  }
  if (env.ph != null) {
    stats.push({ key: 'ph', label: labels.ph, value: String(env.ph) });
  }
  if (env.ec != null) {
    stats.push({ key: 'ec', label: labels.ec, value: String(env.ec) });
  }
  if (env.waterTemp != null) {
    stats.push({ key: 'waterTemp', label: labels.waterTemp, value: `${env.waterTemp}°C` });
  }
  if (env.lightLevel != null) {
    stats.push({ key: 'lightLevel', label: labels.lightLevel, value: String(env.lightLevel) });
  }

  return stats.sort(
    (a, b) => ALL_STAT_KEYS.indexOf(a.key) - ALL_STAT_KEYS.indexOf(b.key),
  );
}

export function resolveDailyLogSnapshot(
  context: DailyLogExportContext,
  options: {
    dateLabel: string;
    plantHealthLabel: string;
    statLabels: Record<ExportStatKey, string>;
  },
): ExportSnapshot {
  const { cycle, log, dayNumber, stageLabel } = context;

  const observations = log.observations.trim();

  return {
    crop: formatCropLabel(cycle.cropType),
    dayNumber,
    dateLabel: options.dateLabel,
    stageLabel,
    plantHealthLabel: options.plantHealthLabel,
    observations: observations || undefined,
    stats: buildStats(log, options.statLabels),
  };
}

export function defaultEnabledStatKeys(stats: ExportStat[]): ExportStatKey[] {
  return stats.map((s) => s.key);
}
