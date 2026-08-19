import type { ExportStatKey } from './types';

/**
 * Accurate Lucide SVG paths (24×24 viewBox, stroke-only) matching the icons
 * used in the Current Metrics section of GrowCycleDetailSection:
 *   temperature  → Thermometer
 *   humidity     → Droplets
 *   ph           → TrendingUp
 *   ec           → Zap
 *   waterTemp    → Waves
 *   lightLevel   → Sprout
 */
const METRIC_ICON_PATHS: Record<ExportStatKey, string[]> = {
  temperature: [
    'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z',
  ],
  humidity: [
    'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z',
    'M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97',
  ],
  ph: [
    'M22 7 2 17',
    'M2 7l10 5 10-5',
  ],
  ec: [
    'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  ],
  waterTemp: [
    'M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    'M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    'M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
  ],
  lightLevel: [
    'M7 20h10',
    'M10 20c5.5-2.5.8-6.4 3-10',
    'M9.5 9.4c1.1.8 1.8 2.2 2.1 3.7-.5.1-1 .3-1.6.3a3.8 3.8 0 0 1-3.8-3.8 3.8 3.8 0 0 1 3.8-3.8c.7 0 1.3.2 1.8.5',
    'M14.1 6a7 7 0 0 1 1 9.1',
  ],
};

export function drawMetricIcon(
  ctx: CanvasRenderingContext2D,
  key: ExportStatKey,
  cx: number,
  cy: number,
  size: number,
  color: string,
) {
  const paths = METRIC_ICON_PATHS[key];
  if (!paths) return;

  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of paths) {
    const path = new Path2D(d);
    ctx.stroke(path);
  }
  ctx.restore();
}

export { METRIC_ICON_PATHS };
