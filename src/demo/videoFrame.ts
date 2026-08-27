import { EXPORT_HEIGHT, EXPORT_WIDTH } from '../app/components/operations/export/exportFormat';

/** Draw video frame cover-cropped into 9:16, applying rotation when needed. */
export function drawVideoCoverFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  rotation: 0 | -90,
) {
  const cw = EXPORT_WIDTH;
  const ch = EXPORT_HEIGHT;
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  if (!vw || !vh) return;

  ctx.save();

  if (rotation === -90) {
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate(-Math.PI / 2);
    const scale = Math.max(cw / vh, ch / vw);
    const dw = vw * scale;
    const dh = vh * scale;
    ctx.drawImage(video, -dw / 2, -dh / 2, dw, dh);
  } else {
    const scale = Math.max(cw / vw, ch / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    ctx.drawImage(video, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  ctx.restore();
}

export function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  const clamped = Math.max(0, Math.min(time, Math.max(0, video.duration - 0.04)));
  if (Math.abs(video.currentTime - clamped) < 0.02) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const finish = () => {
      video.removeEventListener('seeked', finish);
      resolve();
    };
    video.addEventListener('seeked', finish);
    video.currentTime = clamped;
  });
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
