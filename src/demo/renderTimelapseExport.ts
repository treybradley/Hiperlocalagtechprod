import { drawDailyUpdateExport } from '../app/components/operations/export/templates/dailyUpdate';
import { ensureExportFonts } from '../app/components/operations/export/loadExportFonts';
import type { ExportRenderOptions } from '../app/components/operations/export/types';
import { EXPORT_HEIGHT, EXPORT_WIDTH } from '../app/components/operations/export/exportFormat';
import { drawIntroCard } from './drawIntroCard';
import type { DemoDayConfig, IntroCardConfig } from './types';
import { demoDayToSnapshot, getActiveDay } from './types';
import {
  generateMetricsAt,
  realMsAtProgress,
  type MetricCadence,
} from './generateTulumMetrics';
import { drawVideoCoverFrame, seekVideo, wait } from './videoFrame';

const VIDEO_FPS = 24;

function chooseVideoMimeType() {
  const preferred = ['video/mp4;codecs=h264,aac', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  for (const mime of preferred) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return 'video/webm';
}

export type TimelapseRenderConfig = {
  video: HTMLVideoElement;
  videoRotation: 0 | -90;
  days: DemoDayConfig[];
  intro: IntroCardConfig;
  introImage: HTMLImageElement | null;
  endHoldSec: number;
  /** Styles for video overlay (header + metrics + observations). */
  renderOptions: ExportRenderOptions;
  /** Styles for intro card only. */
  introRenderOptions: ExportRenderOptions;
  realWorldStartMs: number;
  realWorldEndMs: number;
  metricCadence: MetricCadence;
  onProgress?: (progress: number) => void;
};

function drawTimelapseFrame(
  ctx: CanvasRenderingContext2D,
  config: TimelapseRenderConfig,
  timelineSec: number,
  videoDuration: number,
) {
  const {
    intro,
    introImage,
    video,
    videoRotation,
    days,
    endHoldSec,
    renderOptions,
    introRenderOptions,
    realWorldStartMs,
    realWorldEndMs,
    metricCadence,
  } = config;
  const introDuration = intro.enabled ? intro.durationSec : 0;

  if (intro.enabled && timelineSec < introDuration) {
    drawIntroCard(ctx, intro, introRenderOptions, introImage);
    return;
  }

  const mainStart = introDuration;
  const mainEnd = introDuration + videoDuration;

  let videoProgress = 1;
  if (timelineSec >= mainStart && timelineSec <= mainEnd) {
    videoProgress = videoDuration > 0 ? (timelineSec - mainStart) / videoDuration : 0;
  } else if (timelineSec > mainEnd) {
    videoProgress = 1;
  }

  ctx.clearRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
  drawVideoCoverFrame(ctx, video, videoRotation);

  const vignette = ctx.createLinearGradient(0, EXPORT_HEIGHT * 0.3, 0, EXPORT_HEIGHT);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(
    1,
    renderOptions.fontMode === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)',
  );
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  const activeDay = getActiveDay(days, videoProgress);
  const realMs = realMsAtProgress(videoProgress, realWorldStartMs, realWorldEndMs);
  const liveStats = generateMetricsAt(realMs, activeDay.dayNumber, metricCadence);
  const snapshot = demoDayToSnapshot(activeDay, liveStats);

  drawDailyUpdateExport(ctx, video, snapshot, {
    ...renderOptions,
    skipBackground: true,
    showSafeGuides: false,
  });

  void endHoldSec;
}

export async function renderTimelapseVideo(
  config: TimelapseRenderConfig,
): Promise<{ blob: Blob; extension: 'mp4' | 'webm'; fellBackToWebm: boolean }> {
  await ensureExportFonts();
  const { video, intro, endHoldSec, onProgress } = config;

  if (!video.duration || !Number.isFinite(video.duration)) {
    throw new Error('Video duration is not available yet');
  }

  const introDuration = intro.enabled ? intro.durationSec : 0;
  const totalDuration = introDuration + video.duration + endHoldSec;
  const totalFrames = Math.max(1, Math.round(totalDuration * VIDEO_FPS));

  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const stream = canvas.captureStream(VIDEO_FPS);
  const mimeType = chooseVideoMimeType();
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const stopPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Video recording failed'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || mimeType }));
  });

  video.pause();
  recorder.start();
  const frameDelayMs = Math.round(1000 / VIDEO_FPS);

  for (let frame = 0; frame < totalFrames; frame++) {
    const timelineSec = frame / VIDEO_FPS;
    const introDurationSec = intro.enabled ? intro.durationSec : 0;

    if (timelineSec >= introDurationSec) {
      const videoTime = Math.min(
        video.duration - 0.001,
        Math.max(0, timelineSec - introDurationSec),
      );
      await seekVideo(video, videoTime);
    }

    drawTimelapseFrame(ctx, config, timelineSec, video.duration);
    onProgress?.((frame + 1) / totalFrames);
    await wait(frameDelayMs);
  }

  recorder.stop();
  const blob = await stopPromise;
  stream.getTracks().forEach((track) => track.stop());

  const blobType = (blob.type || '').toLowerCase();
  const isMp4 = blobType.includes('mp4');
  return { blob, extension: isMp4 ? 'mp4' : 'webm', fellBackToWebm: !isMp4 };
}

export async function drawTimelapseFrameToCanvas(
  canvas: HTMLCanvasElement,
  config: TimelapseRenderConfig,
  timelineSec: number,
): Promise<void> {
  await ensureExportFonts();
  const { video } = config;
  if (!video.duration || !Number.isFinite(video.duration)) return;

  const introDuration = config.intro.enabled ? config.intro.durationSec : 0;
  if (timelineSec >= introDuration) {
    const videoTime = Math.min(
      video.duration - 0.001,
      Math.max(0, timelineSec - introDuration),
    );
    await seekVideo(video, videoTime);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  drawTimelapseFrame(ctx, config, timelineSec, video.duration);
}

export async function renderTimelapsePreviewFrame(
  canvas: HTMLCanvasElement,
  config: TimelapseRenderConfig,
  timelineSec: number,
): Promise<void> {
  await drawTimelapseFrameToCanvas(canvas, config, timelineSec);
}

export function getTotalTimelineDuration(
  videoDuration: number,
  intro: IntroCardConfig,
  endHoldSec: number,
) {
  const introDuration = intro.enabled ? intro.durationSec : 0;
  return introDuration + videoDuration + endHoldSec;
}
