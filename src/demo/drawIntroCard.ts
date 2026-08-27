import type { ExportRenderOptions } from '../app/components/operations/export/types';
import {
  EXPORT_HEIGHT,
  EXPORT_WIDTH,
  IG_SAFE,
  MONO_FONT,
} from '../app/components/operations/export/exportFormat';
import { drawGlassPanel, drawSolidBrandChip } from '../app/components/operations/export/glassPanel';
import type { IntroCardConfig } from './types';

function primaryTextColor(fontMode: ExportRenderOptions['fontMode']): string {
  return fontMode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(12, 12, 12, 0.92)';
}

function secondaryTextColor(fontMode: ExportRenderOptions['fontMode']): string {
  return fontMode === 'light' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(12, 12, 12, 0.58)';
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  cw: number,
  ch: number,
) {
  const iw =
    'naturalWidth' in image && image.naturalWidth
      ? image.naturalWidth
      : 'videoWidth' in image
        ? image.videoWidth
        : 'width' in image
          ? image.width
          : cw;
  const ih =
    'naturalHeight' in image && image.naturalHeight
      ? image.naturalHeight
      : 'videoHeight' in image
        ? image.videoHeight
        : 'height' in image
          ? image.height
          : ch;
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (cw - dw) / 2;
  const oy = (ch - dh) / 2;
  ctx.drawImage(image, ox, oy, dw, dh);
}

export function drawIntroCard(
  ctx: CanvasRenderingContext2D,
  intro: IntroCardConfig,
  options: ExportRenderOptions,
  backgroundImage?: CanvasImageSource | null,
) {
  const { fontMode, glass } = options;
  const cw = EXPORT_WIDTH;
  const ch = EXPORT_HEIGHT;
  const cx = cw / 2;

  ctx.clearRect(0, 0, cw, ch);

  if (backgroundImage) {
    drawCoverImage(ctx, backgroundImage, cw, ch);
    const vignette = ctx.createLinearGradient(0, 0, 0, ch);
    vignette.addColorStop(0, 'rgba(0,0,0,0.35)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, cw, ch);
  } else {
    const bg = ctx.createLinearGradient(0, 0, cw, ch);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);
  }

  const titleSize = Math.round(cw * 0.072);
  const subSize = Math.round(cw * 0.032);
  const brandSize = Math.round(cw * 0.022);
  const panelRadius = Math.round(cw * 0.028);
  const panelPad = Math.round(cw * 0.05);

  ctx.font = `600 ${titleSize}px ${MONO_FONT}`;
  const titleW = ctx.measureText(intro.title).width;
  ctx.font = `500 ${subSize}px ${MONO_FONT}`;
  const subW = ctx.measureText(intro.subtitle).width;

  const brandChipH = Math.round(brandSize * 1.8);
  const panelW = Math.min(cw - IG_SAFE.side * cw * 2, Math.max(titleW, subW) + panelPad * 2);
  const panelH = panelPad * 2 + brandChipH + Math.round(subSize * 0.6) + titleSize + subSize + Math.round(subSize * 0.5);
  const panelX = cx - panelW / 2;
  const panelY = ch * 0.38;

  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, fontMode, panelRadius, glass);

  drawSolidBrandChip(ctx, cx, panelY + panelPad, 'Hiperlocal', brandSize);

  const textTop = panelY + panelPad + brandChipH + Math.round(subSize * 0.6);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `600 ${titleSize}px ${MONO_FONT}`;
  ctx.fillStyle = primaryTextColor(fontMode);
  ctx.fillText(intro.title, cx, textTop);

  ctx.font = `500 ${subSize}px ${MONO_FONT}`;
  ctx.fillStyle = secondaryTextColor(fontMode);
  ctx.fillText(intro.subtitle, cx, textTop + titleSize + Math.round(subSize * 0.45));
}
