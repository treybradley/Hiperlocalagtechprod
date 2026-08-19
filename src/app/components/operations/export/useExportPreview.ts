import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ExportRenderOptions, ExportSnapshot } from './types';
import { EXPORT_HEIGHT, EXPORT_WIDTH } from './exportFormat';
import { drawDailyUpdateExport } from './templates/dailyUpdate';

export function useExportPreview(
  image: HTMLImageElement | null,
  snapshot: ExportSnapshot | null,
  options: ExportRenderOptions,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const enabledKey = useMemo(
    () => Array.from(options.enabledStatKeys).sort().join(','),
    [options.enabledStatKeys],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !snapshot) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
    drawDailyUpdateExport(ctx, image, snapshot, {
      ...options,
      showSafeGuides: true,
    });
  }, [
    image,
    snapshot,
    options.fontMode,
    options.dayLabel,
    options.observationsLabel,
    options.metricScale,
    options.glass,
    enabledKey,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  return { canvasRef, redraw: draw };
}
