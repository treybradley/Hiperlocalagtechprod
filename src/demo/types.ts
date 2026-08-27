import type { ExportSnapshot, ExportStat, ExportStatKey, GlassStyle } from '../app/components/operations/export/types';
import type { MetricCadence } from './generateTulumMetrics';

export type DemoActId = 'act1' | 'act2';

export type DemoDayConfig = {
  dayNumber: number;
  dateLabel: string;
  stageLabel: string;
  plantHealthLabel: string;
  observations: string;
  /** Legacy / unused when live metrics are on — kept for localStorage compat. */
  stats: Record<
    ExportStatKey,
    {
      label: string;
      value: string;
    }
  >;
  /** Start of this day on the video timeline (0–1). */
  markerStart: number;
};

export type IntroCardConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  durationSec: number;
};

export type ActDefinition = {
  id: DemoActId;
  label: string;
  subtitle: string;
  videoRotation: 0 | -90;
  exportFilename: string;
  /** Real-world start of the timelapse (ms epoch). */
  realWorldStartMs: number;
  /** Real-world end of the timelapse (ms epoch). */
  realWorldEndMs: number;
  introDefault: IntroCardConfig;
  days: DemoDayConfig[];
};

export type DemoPersistedState = {
  days: DemoDayConfig[];
  intro: IntroCardConfig;
  headerOffsetY: number;
  metricScale: number;
  /** Overlay (video metrics) text style */
  fontMode: 'light' | 'dark';
  glass: GlassStyle;
  /** Intro card text / glass style */
  introFontMode: 'light' | 'dark';
  introGlass: GlassStyle;
  endHoldSec: number;
  enabledStatKeys: ExportStatKey[];
  /** How often live metrics refresh across the real-world span. */
  metricCadence: MetricCadence;
};

export const ALL_STAT_KEYS: ExportStatKey[] = [
  'temperature',
  'humidity',
  'ph',
  'ec',
  'waterTemp',
  'lightLevel',
];

export function demoDayToSnapshot(day: DemoDayConfig, liveStats?: ExportStat[]): ExportSnapshot {
  return {
    crop: 'Maracuyá',
    dayNumber: day.dayNumber,
    dateLabel: day.dateLabel,
    stageLabel: day.stageLabel,
    plantHealthLabel: day.plantHealthLabel,
    observations: day.observations.trim() || undefined,
    stats:
      liveStats ??
      ALL_STAT_KEYS.map((key) => ({
        key,
        label: day.stats[key].label,
        value: day.stats[key].value,
      })),
  };
}

export function getActiveDay(days: DemoDayConfig[], videoProgress: number): DemoDayConfig {
  const sorted = [...days].sort((a, b) => a.markerStart - b.markerStart);
  let active = sorted[0];
  for (const day of sorted) {
    if (videoProgress >= day.markerStart) active = day;
  }
  return active;
}

export function getIntroDuration(intro: IntroCardConfig) {
  return intro.enabled ? intro.durationSec : 0;
}

/** Map preview timeline position to video progress (0–1), or null if still on intro. */
export function previewTimeToVideoProgress(
  previewTime: number,
  intro: IntroCardConfig,
  videoDuration: number,
): number | null {
  const introDur = getIntroDuration(intro);
  if (previewTime < introDur || videoDuration <= 0) return null;
  return Math.min(1, (previewTime - introDur) / videoDuration);
}

export function videoProgressToPreviewTime(
  markerStart: number,
  intro: IntroCardConfig,
  videoDuration: number,
) {
  return getIntroDuration(intro) + markerStart * videoDuration;
}

export function redistributeMarkers(days: DemoDayConfig[]): DemoDayConfig[] {
  if (days.length === 0) return days;
  return days.map((day, index) => ({
    ...day,
    markerStart: index / days.length,
  }));
}
