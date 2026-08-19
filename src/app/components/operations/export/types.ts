import type { DailyLog, GrowCycle, Photo } from '../../../../storage/models';

export type FontMode = 'light' | 'dark';

export interface GlassStyle {
  opacity: number;
  blur: number;
  borderGlow: number;
  depth: number;
}

export const DEFAULT_GLASS_STYLE: GlassStyle = {
  opacity: 0.45,
  blur: 12,
  borderGlow: 0.35,
  depth: 0.4,
};


export const METRIC_SCALE_MIN = 1.0;
export const METRIC_SCALE_MAX = 2.0;
export const DEFAULT_METRIC_SCALE = 1.3;

export interface ExportRenderOptions {
  fontMode: FontMode;
  enabledStatKeys: Set<ExportStatKey>;
  dayLabel: string;
  observationsLabel: string;
  metricScale: number;
  glass: GlassStyle;
  showSafeGuides?: boolean;
}

export type ExportStatKey =
  | 'temperature'
  | 'humidity'
  | 'ph'
  | 'ec'
  | 'waterTemp'
  | 'lightLevel';

export interface ExportStat {
  key: ExportStatKey;
  label: string;
  value: string;
}

export interface ExportSnapshot {
  crop: string;
  dayNumber: number;
  dateLabel: string;
  stageLabel: string;
  plantHealthLabel: string;
  observations?: string;
  stats: ExportStat[];
}

export type DailyLogExportContext = {
  kind: 'daily-log';
  cycle: GrowCycle;
  log: DailyLog;
  photos: Photo[];
  stageLabel: string;
  dayNumber: number;
};

export type CycleExportContext = {
  kind: 'cycle';
  cycle: GrowCycle;
  logs: DailyLog[];
  photos: Photo[];
};

export type ExportContext = DailyLogExportContext | CycleExportContext;

export const ALL_STAT_KEYS: ExportStatKey[] = [
  'temperature',
  'humidity',
  'ph',
  'ec',
  'waterTemp',
  'lightLevel',
];
