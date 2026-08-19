import { getPhotoDisplayUrl } from '../../../../storage/operations/photos';
import type { DailyLog, GrowCycle, Photo } from '../../../../storage/models';
import { formatDate } from '../../../../storage/utils/dateHelpers';
import { getLogDayNumber, getStageAsOfTimestamp } from '../../../../storage/utils/stageFromLogs';
import { loadExportImage } from './loadExportImage';
import { drawDailyUpdateExport } from './templates/dailyUpdate';
import { EXPORT_HEIGHT, EXPORT_WIDTH } from './exportFormat';
import type { ExportRenderOptions, ExportSnapshot, ExportStatKey } from './types';
import { resolveDailyLogSnapshot } from './resolveExportSnapshot';

export type CycleExportSpeed = 'fast' | 'normal' | 'slow';
export type PreviewFrameSelection = 'first' | 'middle' | 'last';

type CycleFrame = {
  snapshot: ExportSnapshot;
  photo: Photo;
};

const SPEED_SECONDS: Record<CycleExportSpeed, number> = {
  fast: 0.32,
  normal: 0.55,
  slow: 0.9,
};

const MIN_DURATION_SECONDS = 4;
const MAX_DURATION_SECONDS = 30;
const VIDEO_FPS = 24;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getCycleExportTiming(photoCount: number, speed: CycleExportSpeed) {
  if (photoCount <= 0) {
    return { holdSeconds: SPEED_SECONDS[speed], durationSeconds: 0, perPhotoFrames: 0, totalFrames: 0 };
  }
  const baseHold = SPEED_SECONDS[speed];
  const unclampedDuration = baseHold * photoCount;
  const durationSeconds = clamp(unclampedDuration, MIN_DURATION_SECONDS, MAX_DURATION_SECONDS);
  const holdSeconds = durationSeconds / photoCount;
  const perPhotoFrames = Math.max(1, Math.round(holdSeconds * VIDEO_FPS));
  const totalFrames = perPhotoFrames * photoCount;
  return { holdSeconds, durationSeconds, perPhotoFrames, totalFrames };
}

type BuildTimelineArgs = {
  cycle: GrowCycle;
  logs: DailyLog[];
  photos: Photo[];
  statLabels: Record<ExportStatKey, string>;
  getStageLabel: (stage: string) => string;
  getPlantHealthLabel: (health: DailyLog['plantHealth']) => string;
};

export function buildCycleTimeline({
  cycle,
  logs,
  photos,
  statLabels,
  getStageLabel,
  getPlantHealthLabel,
}: BuildTimelineArgs): CycleFrame[] {
  const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);
  const frames: CycleFrame[] = [];

  sortedLogs.forEach((log) => {
    const logPhotos = photos.filter((p) => p.dailyLogId === log.id);
    if (logPhotos.length === 0) return;

    const stage = getStageAsOfTimestamp(sortedLogs, log.timestamp, cycle.currentStage);
    const snapshot = resolveDailyLogSnapshot(
      {
        kind: 'daily-log',
        cycle,
        log,
        photos: logPhotos,
        stageLabel: getStageLabel(stage),
        dayNumber: getLogDayNumber(cycle, log),
      },
      {
        dateLabel: formatDate(log.timestamp),
        plantHealthLabel: getPlantHealthLabel(log.plantHealth),
        statLabels,
      },
    );

    logPhotos.forEach((photo) => {
      frames.push({ snapshot, photo });
    });
  });

  return frames;
}

export function pickPreviewFrameIndex(length: number, selection: PreviewFrameSelection): number {
  if (length <= 0) return -1;
  if (selection === 'last') return length - 1;
  if (selection === 'middle') return Math.floor((length - 1) / 2);
  return 0;
}

function chooseVideoMimeType() {
  const preferred = ['video/mp4;codecs=h264,aac', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  for (const mime of preferred) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return 'video/webm';
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function renderCycleVideo({
  frames,
  options,
  speed,
}: {
  frames: CycleFrame[];
  options: ExportRenderOptions;
  speed: CycleExportSpeed;
}): Promise<{ blob: Blob; extension: 'mp4' | 'webm'; fellBackToWebm: boolean }> {
  if (frames.length === 0) {
    throw new Error('No frames to render');
  }

  const loaded = await Promise.all(
    frames.map(async (frame) => {
      const url = getPhotoDisplayUrl(frame.photo);
      if (!url) throw new Error('Failed to load one or more cycle photos');
      const image = await loadExportImage(url);
      return { image, snapshot: frame.snapshot };
    }),
  );

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

  const { perPhotoFrames } = getCycleExportTiming(loaded.length, speed);
  recorder.start();
  const frameDelayMs = Math.round(1000 / VIDEO_FPS);

  for (const frame of loaded) {
    for (let i = 0; i < perPhotoFrames; i++) {
      drawDailyUpdateExport(ctx, frame.image, frame.snapshot, {
        ...options,
        showSafeGuides: false,
      });
      await wait(frameDelayMs);
    }
  }

  recorder.stop();
  const blob = await stopPromise;
  stream.getTracks().forEach((track) => track.stop());

  const blobType = (blob.type || '').toLowerCase();
  const isMp4 = blobType.includes('mp4');
  return { blob, extension: isMp4 ? 'mp4' : 'webm', fellBackToWebm: !isMp4 };
}

