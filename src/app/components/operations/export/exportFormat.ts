/** Fixed social export: 9:16 vertical (Stories / Reels / TikTok). */
export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1920;
export const EXPORT_ASPECT = EXPORT_WIDTH / EXPORT_HEIGHT;

/** Keep overlay chrome inside IG-safe margins (fractions of canvas size). */
export const IG_SAFE = {
  top: 0.08,
  bottom: 0.08,
  side: 0.05,
} as const;

export const EXPORT_ACCENT = '#34d399';

/** Base metric chip font as fraction of canvas width (before metricScale). */
export const BASE_CHIP_FONT_RATIO = 0.03;

export const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
export const SANS_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
