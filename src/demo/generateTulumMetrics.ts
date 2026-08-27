import type { ExportStat, ExportStatKey } from '../app/components/operations/export/types';

export type MetricCadence = 'daily' | '12x' | 'hourly';

export const STAT_LABELS: Record<ExportStatKey, string> = {
  temperature: 'Temp',
  humidity: 'Hum',
  ph: 'pH',
  ec: 'EC',
  waterTemp: 'Water',
  lightLevel: 'Light',
};

export const CADENCE_MS: Record<MetricCadence, number> = {
  hourly: 60 * 60 * 1000,
  '12x': 2 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
};

export const CADENCE_LABELS: Record<MetricCadence, string> = {
  hourly: 'Hourly',
  '12x': '12× / day',
  daily: 'Daily',
};

/** Seeded PRNG — same slot always yields same metrics. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Local hour in America/Cancun (UTC−5, no DST). */
export function cancunHour(ms: number): number {
  const hours = ms / 3_600_000 - 5;
  return ((hours % 24) + 24) % 24;
}

function diurnalCos(hour: number, peakHour: number): number {
  return Math.cos((2 * Math.PI * (hour - peakHour)) / 24);
}

/**
 * Tulum wet-season shaped indoor/patio readings.
 * Air: ~27–32°C · Humidity: ~72–86% · Light follows daylight.
 * All values are whole numbers so chips don't overflow.
 */
export function generateMetricsAt(
  realMs: number,
  dayNumber: number,
  cadence: MetricCadence = '12x',
): ExportStat[] {
  const slotMs = CADENCE_MS[cadence];
  const quantized = Math.floor(realMs / slotMs) * slotMs;
  const rand = mulberry32((quantized / 60_000) ^ (dayNumber * 9973));
  const noise = (amp: number) => (rand() - 0.5) * 2 * amp;

  const hour = cancunHour(quantized);
  // Peak heat ~14:00, coolest ~05:00
  const heat = diurnalCos(hour, 14);

  const temperature = Math.round(clamp(29.5 + 2.5 * heat + noise(0.45), 26.5, 33));
  const humidity = Math.round(clamp(79 - 5.5 * heat + noise(1.2), 70, 88));

  // Water lags air by ~2h, smaller swing
  const waterHeat = diurnalCos((hour - 2 + 24) % 24, 14);
  const waterTemp = Math.round(clamp(26 + 1.6 * waterHeat + noise(0.3), 23.5, 28.5));

  // Daylight ~06:00–19:00 in August Yucatán
  let lightLevel: number;
  if (hour < 6 || hour >= 19.5) {
    lightLevel = Math.round(clamp(15 + noise(10), 0, 40));
  } else {
    const solar = Math.sin((Math.PI * (hour - 6)) / 13.5);
    lightLevel = Math.round(clamp(80 + 720 * Math.pow(Math.max(0, solar), 1.15) + noise(35), 40, 900));
  }

  // Slow pH walk across the grow (integer 6–7)
  const dayFrac = dayNumber + hour / 24;
  const ph = Math.round(clamp(6.35 + 0.35 * Math.sin(dayFrac * 0.9) + noise(0.15), 6, 7));

  // EC drifts up from day 31 → 45 (integer 2–3 after rounding 1.6→2.0 range)
  const ecT = clamp((dayNumber - 31 + hour / 24) / 14, 0, 1);
  const ec = Math.round(clamp(1.6 + 0.5 * ecT + noise(0.15), 1.5, 2.5));

  const values: Record<ExportStatKey, string> = {
    temperature: `${temperature}°C`,
    humidity: `${humidity}%`,
    ph: String(ph),
    ec: String(ec),
    waterTemp: `${waterTemp}°C`,
    lightLevel: String(lightLevel),
  };

  return (Object.keys(STAT_LABELS) as ExportStatKey[]).map((key) => ({
    key,
    label: STAT_LABELS[key],
    value: values[key],
  }));
}

/** Map video progress (0–1) onto the act's real-world timespan. */
export function realMsAtProgress(
  videoProgress: number,
  realWorldStartMs: number,
  realWorldEndMs: number,
): number {
  const t = clamp(videoProgress, 0, 1);
  return realWorldStartMs + t * (realWorldEndMs - realWorldStartMs);
}
