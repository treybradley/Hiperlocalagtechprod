import type { ExportRenderOptions, ExportSnapshot } from '../types';
import {
  BASE_CHIP_FONT_RATIO,
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
  IG_SAFE,
  MONO_FONT,
  SANS_FONT,
} from '../exportFormat';
import { drawGlassPanel, drawSolidBrandChip, measureBrandChip } from '../glassPanel';

// Fixed chip padding at export resolution — NOT scaled with metricScale
const CHIP_PAD_X = 28; // px at 1080 wide
const CHIP_PAD_Y = 20;
const OBS_PAD_X = 24;
const OBS_PAD_Y = 16;
const OBS_MAX_LINES = 3;

function primaryTextColor(fontMode: ExportRenderOptions['fontMode']): string {
  return fontMode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(12, 12, 12, 0.92)';
}

function secondaryTextColor(fontMode: ExportRenderOptions['fontMode']): string {
  return fontMode === 'light' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(12, 12, 12, 0.58)';
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cw: number,
  ch: number,
) {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (cw - dw) / 2;
  const oy = (ch - dh) / 2;
  ctx.drawImage(image, ox, oy, dw, dh);
}

function drawSafeGuides(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const side = cw * IG_SAFE.side;
  const top = ch * IG_SAFE.top;
  const bottom = ch * IG_SAFE.bottom;

  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = 'rgba(52,211,153,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(side, top, cw - side * 2, ch - top - bottom);
  ctx.restore();
}

/**
 * Measure a stat chip (text only — no icons).
 * metricScale applies only to chipFont — padding is fixed.
 */
function measureStatChip(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  chipFont: number,
): { naturalWidth: number; height: number } {
  const labelFont = Math.round(chipFont * 0.72);
  const textGap = Math.round(chipFont * 0.2);

  ctx.font = `600 ${labelFont}px ${MONO_FONT}`;
  const labelW = ctx.measureText(label).width;
  ctx.font = `600 ${chipFont}px ${MONO_FONT}`;
  const valueW = ctx.measureText(value).width;
  const textBlockW = Math.max(labelW, valueW);

  return {
    naturalWidth: textBlockW + CHIP_PAD_X * 2,
    height: labelFont + textGap + chipFont + CHIP_PAD_Y * 2,
  };
}

function drawStatChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  options: ExportRenderOptions,
  chipFont: number,
) {
  const { fontMode, glass } = options;
  const radius = Math.round(chipFont * 0.5);
  const labelFont = Math.round(chipFont * 0.72);
  const textGap = Math.round(chipFont * 0.2);

  drawGlassPanel(ctx, x, y, w, h, fontMode, radius, glass);

  const textBlockH = labelFont + textGap + chipFont;
  const textStartY = y + (h - textBlockH) / 2;
  const textX = x + CHIP_PAD_X;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `600 ${labelFont}px ${MONO_FONT}`;
  ctx.fillStyle = secondaryTextColor(fontMode);
  ctx.fillText(label, textX, textStartY);

  ctx.font = `600 ${chipFont}px ${MONO_FONT}`;
  ctx.fillStyle = primaryTextColor(fontMode);
  ctx.fillText(value, textX, textStartY + labelFont + textGap);
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (words.length > 0 && lines.length === maxLines) {
    const joined = lines.join(' ');
    const sourceJoined = words.join(' ');
    if (joined.length < sourceJoined.length) {
      let last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = `${last}…`;
    }
  }

  return lines;
}

function measureObservationsBlock(
  ctx: CanvasRenderingContext2D,
  label: string,
  text: string,
  contentW: number,
  chipFont: number,
): { height: number; lines: string[]; labelFont: number; bodyFont: number; lineGap: number } {
  const labelFont = Math.round(chipFont * 0.65);
  const bodyFont = Math.round(chipFont * 0.82);
  const lineGap = Math.round(bodyFont * 0.28);
  const labelGap = Math.round(labelFont * 0.45);
  const innerW = contentW - OBS_PAD_X * 2;

  ctx.font = `500 ${bodyFont}px ${SANS_FONT}`;
  const lines = wrapTextLines(ctx, text, innerW, OBS_MAX_LINES);
  const bodyH = lines.length * bodyFont + Math.max(0, lines.length - 1) * lineGap;

  return {
    height: OBS_PAD_Y * 2 + labelFont + labelGap + bodyH,
    lines,
    labelFont,
    bodyFont,
    lineGap,
  };
}

function drawObservationsBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  lines: string[],
  options: ExportRenderOptions,
  labelFont: number,
  bodyFont: number,
  lineGap: number,
  chipFont: number,
) {
  const { fontMode, glass } = options;
  const radius = Math.round(chipFont * 0.45);
  const labelGap = Math.round(labelFont * 0.45);

  drawGlassPanel(ctx, x, y, w, h, fontMode, radius, glass);

  const textX = x + OBS_PAD_X;
  let textY = y + OBS_PAD_Y;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `600 ${labelFont}px ${MONO_FONT}`;
  ctx.fillStyle = secondaryTextColor(fontMode);
  ctx.fillText(label, textX, textY);
  textY += labelFont + labelGap;

  ctx.font = `500 ${bodyFont}px ${SANS_FONT}`;
  ctx.fillStyle = primaryTextColor(fontMode);
  for (const line of lines) {
    ctx.fillText(line, textX, textY);
    textY += bodyFont + lineGap;
  }
}

export function drawDailyUpdateExport(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  snapshot: ExportSnapshot,
  options: ExportRenderOptions,
) {
  const { fontMode, enabledStatKeys, dayLabel, observationsLabel, metricScale, glass, showSafeGuides } = options;
  const cw = EXPORT_WIDTH;
  const ch = EXPORT_HEIGHT;
  const side = cw * IG_SAFE.side;
  const top = ch * IG_SAFE.top;
  const bottom = ch * IG_SAFE.bottom;
  const contentW = cw - side * 2;
  const cx = cw / 2;

  ctx.clearRect(0, 0, cw, ch);
  drawCoverImage(ctx, image, cw, ch);

  const vignette = ctx.createLinearGradient(0, ch * 0.3, 0, ch);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, fontMode === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, cw, ch);

  const titleSize = Math.round(cw * 0.048);
  const subSize = Math.round(cw * 0.027);
  const brandSize = Math.round(cw * 0.022);
  const panelRadius = Math.round(cw * 0.022);
  const panelPad = Math.round(cw * 0.04);

  // metricScale affects only the text size — not panel/chip padding
  const chipFont = Math.round(cw * BASE_CHIP_FONT_RATIO * metricScale);

  const brandChip = measureBrandChip(ctx, 'Hiperlocal', brandSize);
  const brandBlock = brandChip.h + Math.round(subSize * 0.5);

  // Measure all header text lines to size the panel to fit content
  ctx.font = `600 ${titleSize}px ${SANS_FONT}`;
  const titleW = ctx.measureText(snapshot.crop).width;
  ctx.font = `500 ${subSize}px ${MONO_FONT}`;
  const sub1W = ctx.measureText(`${dayLabel} ${snapshot.dayNumber} · ${snapshot.dateLabel}`).width;
  const sub2W = ctx.measureText(`${snapshot.stageLabel} · ${snapshot.plantHealthLabel}`).width;
  const maxTextW = Math.max(brandChip.w, titleW, sub1W, sub2W);
  const headerW = Math.min(contentW, maxTextW + panelPad * 2);
  const headerX = cx - headerW / 2;
  const headerY = top;
  const headerInnerTop = headerY + panelPad + brandBlock;
  const headerH =
    panelPad * 2 +
    brandBlock +
    titleSize +
    subSize * 2 +
    Math.round(subSize * 0.5);

  drawGlassPanel(ctx, headerX, headerY, headerW, headerH, fontMode, panelRadius, glass);

  // Brand chip — drawn once, centered at top of the header panel (inside bounds)
  drawSolidBrandChip(ctx, cx, headerY + panelPad, 'Hiperlocal', brandSize);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `600 ${titleSize}px ${SANS_FONT}`;
  ctx.fillStyle = primaryTextColor(fontMode);
  ctx.fillText(snapshot.crop, cx, headerInnerTop);

  ctx.font = `500 ${subSize}px ${MONO_FONT}`;
  ctx.fillStyle = secondaryTextColor(fontMode);
  ctx.fillText(
    `${dayLabel} ${snapshot.dayNumber} · ${snapshot.dateLabel}`,
    cx,
    headerInnerTop + titleSize + Math.round(subSize * 0.4),
  );
  ctx.fillText(
    `${snapshot.stageLabel} · ${snapshot.plantHealthLabel}`,
    cx,
    headerInnerTop + titleSize + Math.round(subSize * 0.4) + subSize + Math.round(subSize * 0.22),
  );

  // Bottom stack: observations (lowest), then stat chips above
  let cursorY = ch - bottom;
  const chipGap = Math.round(cw * 0.024);

  if (snapshot.observations) {
    const obsBlock = measureObservationsBlock(
      ctx,
      observationsLabel,
      snapshot.observations,
      contentW,
      chipFont,
    );
    cursorY -= obsBlock.height;
    drawObservationsBlock(
      ctx,
      side,
      cursorY,
      contentW,
      obsBlock.height,
      observationsLabel,
      obsBlock.lines,
      options,
      obsBlock.labelFont,
      obsBlock.bodyFont,
      obsBlock.lineGap,
      chipFont,
    );
    cursorY -= chipGap;
  }

  // Stat chips — hug content, shared min width, dynamic columns
  const visibleStats = snapshot.stats.filter((s) => enabledStatKeys.has(s.key));

  // Measure natural width/height for every chip; shared chip width = max natural width
  const measurements = visibleStats.map((s) => measureStatChip(ctx, s.label, s.value, chipFont));
  const maxNaturalW = Math.max(...(measurements.length ? measurements.map((m) => m.naturalWidth) : [0]));
  const chipW = maxNaturalW; // chips hug the widest content; no cap needed for column count calc

  // How many chips fit per row across contentW?
  const chipsPerRow = Math.max(1, Math.floor((contentW + chipGap) / (chipW + chipGap)));
  const chipHeights = measurements.map((m) => m.height);

  const rows: (typeof visibleStats)[] = [];
  const rowHeights: number[] = [];
  for (let i = 0; i < visibleStats.length; i += chipsPerRow) {
    const rowSlice = visibleStats.slice(i, i + chipsPerRow);
    rows.push(rowSlice);
    const h = Math.max(...rowSlice.map((_, j) => chipHeights[i + j]));
    rowHeights.push(h);
  }

  // Rows centered in contentW, stacked bottom-up above observations
  for (let ri = rows.length - 1; ri >= 0; ri--) {
    const row = rows[ri];
    const rowH = rowHeights[ri];
    cursorY -= rowH;

    const rowW = row.length * chipW + (row.length - 1) * chipGap;
    const rowX = side + (contentW - rowW) / 2;

    row.forEach((stat, ci) => {
      const x = rowX + ci * (chipW + chipGap);
      drawStatChip(ctx, x, cursorY, chipW, rowH, stat.label, stat.value, options, chipFont);
    });

    cursorY -= chipGap;
  }

  if (showSafeGuides) {
    drawSafeGuides(ctx, cw, ch);
  }
}

export async function renderDailyUpdateToBlob(
  image: HTMLImageElement,
  snapshot: ExportSnapshot,
  options: ExportRenderOptions,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  drawDailyUpdateExport(ctx, image, snapshot, { ...options, showSafeGuides: false });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export PNG'));
      },
      'image/png',
      1,
    );
  });
}
