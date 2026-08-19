import type { FontMode, GlassStyle } from './types';
import { EXPORT_ACCENT, EXPORT_WIDTH } from './exportFormat';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Frosted glass: blur sampled background, tint, depth highlight, border glow. */
export function drawGlassPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fontMode: FontMode,
  radius: number,
  glass: GlassStyle,
) {
  const source = ctx.canvas;
  const pad = Math.ceil(glass.blur * 2);
  const sx = Math.max(0, x - pad);
  const sy = Math.max(0, y - pad);
  const sw = Math.min(source.width - sx, w + pad * 2);
  const sh = Math.min(source.height - sy, h + pad * 2);

  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = Math.max(1, Math.round(sw));
  blurCanvas.height = Math.max(1, Math.round(sh));
  const bctx = blurCanvas.getContext('2d');
  if (bctx) {
    bctx.filter = glass.blur > 0 ? `blur(${glass.blur}px)` : 'none';
    bctx.drawImage(source, sx, sy, sw, sh, 0, 0, blurCanvas.width, blurCanvas.height);
    bctx.filter = 'none';
  }

  ctx.save();
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();
  if (bctx) {
    ctx.drawImage(blurCanvas, sx, sy, sw, sh, x, y, w, h);
  }

  const tint =
    fontMode === 'light'
      ? `rgba(8, 8, 8, ${glass.opacity})`
      : `rgba(255, 255, 255, ${glass.opacity})`;
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);

  if (glass.depth > 0) {
    const highlight = ctx.createLinearGradient(x, y, x, y + h * 0.45);
    highlight.addColorStop(0, `rgba(255,255,255,${0.22 * glass.depth})`);
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = highlight;
    ctx.fillRect(x, y, w, h * 0.45);

    const shadow = ctx.createLinearGradient(x, y + h * 0.55, x, y + h);
    shadow.addColorStop(0, 'rgba(0,0,0,0)');
    shadow.addColorStop(1, `rgba(0,0,0,${0.18 * glass.depth})`);
    ctx.fillStyle = shadow;
    ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
  }

  ctx.restore();

  roundRectPath(ctx, x, y, w, h, radius);
  const borderAlpha = fontMode === 'light' ? 0.12 + glass.borderGlow * 0.4 : 0.08 + glass.borderGlow * 0.25;
  ctx.strokeStyle =
    fontMode === 'light'
      ? `rgba(255,255,255,${borderAlpha})`
      : `rgba(0,0,0,${borderAlpha})`;
  ctx.lineWidth = Math.max(1, EXPORT_WIDTH * 0.0012);
  ctx.shadowColor =
    fontMode === 'light' ? `rgba(52,211,153,${glass.borderGlow * 0.65})` : `rgba(52,211,153,${glass.borderGlow * 0.4})`;
  ctx.shadowBlur = glass.borderGlow * 14;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

export function measureBrandChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
): { w: number; h: number } {
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  const padX = Math.round(fontSize * 0.75);
  const padY = Math.round(fontSize * 0.4);
  return {
    w: ctx.measureText(text).width + padX * 2,
    h: fontSize + padY * 2,
  };
}

export function drawSolidBrandChip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  text: string,
  fontSize: number,
): number {
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  const padX = Math.round(fontSize * 0.75);
  const padY = Math.round(fontSize * 0.4);
  const textW = ctx.measureText(text).width;
  const w = textW + padX * 2;
  const h = fontSize + padY * 2;
  const x = cx - w / 2;

  roundRectPath(ctx, x, y, w, h, Math.round(fontSize * 0.45));
  ctx.fillStyle = '#0a0a0a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(52,211,153,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = EXPORT_ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + h / 2);

  return h;
}

export { roundRectPath };
