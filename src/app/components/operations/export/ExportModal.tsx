import { useEffect, useMemo, useState } from 'react';
import { X, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getPhotoDisplayUrl } from '../../../../storage/operations/photos';
import { formatDate } from '../../../../storage/utils/dateHelpers';
import type {
  ExportContext,
  ExportRenderOptions,
  ExportStatKey,
  FontMode,
  GlassStyle,
  DailyLogExportContext,
} from './types';
import {
  DEFAULT_GLASS_STYLE,
  DEFAULT_METRIC_SCALE,
  METRIC_SCALE_MAX,
  METRIC_SCALE_MIN,
} from './types';
import { defaultEnabledStatKeys, resolveDailyLogSnapshot } from './resolveExportSnapshot';
import { loadExportImage } from './loadExportImage';
import { renderDailyUpdateToBlob } from './templates/dailyUpdate';
import { useExportPreview } from './useExportPreview';
import { EXPORT_ASPECT } from './exportFormat';
import {
  buildCycleTimeline,
  getCycleExportTiming,
  pickPreviewFrameIndex,
  renderCycleVideo,
  type CycleExportSpeed,
  type PreviewFrameSelection,
} from './renderCycleVideo';

interface ExportModalProps {
  isOpen: boolean;
  context: ExportContext | null;
  onClose: () => void;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-xs font-mono text-white/70">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-green-400"
      />
    </div>
  );
}

export function ExportModal({ isOpen, context, onClose }: ExportModalProps) {
  const { t } = useLanguage();
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [fontMode, setFontMode] = useState<FontMode>('light');
  const [enabledStats, setEnabledStats] = useState<Set<ExportStatKey>>(new Set());
  const [metricScale, setMetricScale] = useState(DEFAULT_METRIC_SCALE);
  const [glass, setGlass] = useState<GlassStyle>(DEFAULT_GLASS_STYLE);
  const [glassOpen, setGlassOpen] = useState(false);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [speed, setSpeed] = useState<CycleExportSpeed>('normal');
  const [frameSelection, setFrameSelection] = useState<PreviewFrameSelection>('middle');

  const isCycleContext = context?.kind === 'cycle';
  const isDailyContext = context?.kind === 'daily-log';

  const getStageLabel = (stage: string) => {
    const keys: Record<string, string> = {
      germination: 'stages.germination',
      rootDevelopment: 'stages.rootDevelopment',
      vegetativeGrowth: 'stages.vegetativeGrowth',
      flowering: 'stages.flowering',
      harvest: 'stages.harvest',
      completed: 'stages.completed',
    };
    const key = keys[stage];
    return key ? t(key) : stage;
  };

  const getPlantHealthLabel = (health: DailyLogExportContext['log']['plantHealth']) => {
    const key = `plantHealth.${health}`;
    const translated = t(key);
    return translated !== key ? translated : health;
  };

  const statLabels: Record<ExportStatKey, string> = useMemo(
    () => ({
      temperature: t('operations.cycle.temp'),
      humidity: t('operations.cycle.humidity'),
      ph: t('operations.cycle.ph'),
      ec: t('operations.cycle.ec'),
      waterTemp: t('operations.cycle.waterT'),
      lightLevel: t('operations.cycle.light'),
    }),
    [t],
  );

  const cycleFrames = useMemo(() => {
    if (!context || context.kind !== 'cycle') return [];
    return buildCycleTimeline({
      cycle: context.cycle,
      logs: context.logs,
      photos: context.photos,
      statLabels,
      getStageLabel,
      getPlantHealthLabel,
    });
  }, [context, statLabels, t]);

  const dailySnapshot = useMemo(() => {
    if (!context || context.kind !== 'daily-log') return null;
    const plantHealthLabel = getPlantHealthLabel(context.log.plantHealth);

    return resolveDailyLogSnapshot(context, {
      dateLabel: formatDate(context.log.timestamp),
      plantHealthLabel,
      statLabels,
    });
  }, [context, statLabels, t]);

  const selectedCycleFrame = useMemo(() => {
    const idx = pickPreviewFrameIndex(cycleFrames.length, frameSelection);
    return idx >= 0 ? cycleFrames[idx] : null;
  }, [cycleFrames, frameSelection]);

  const snapshot = isCycleContext ? selectedCycleFrame?.snapshot ?? null : dailySnapshot;

  useEffect(() => {
    if (!isOpen || !context) return;
    setSelectedPhotoId(context.photos[0]?.id ?? null);
    setFontMode('light');
    setMetricScale(DEFAULT_METRIC_SCALE);
    setGlass(DEFAULT_GLASS_STYLE);
    setGlassOpen(false);
    setImageError(false);
    setSpeed('normal');
    setFrameSelection('middle');
  }, [isOpen, context]);

  useEffect(() => {
    if (!snapshot) return;
    setEnabledStats(new Set(defaultEnabledStatKeys(snapshot.stats)));
  }, [snapshot]);

  const selectedPhoto = useMemo(() => {
    if (!context) return null;
    if (context.kind === 'cycle') return selectedCycleFrame?.photo ?? null;
    return context.photos.find((p) => p.id === selectedPhotoId) ?? context.photos[0] ?? null;
  }, [context, selectedCycleFrame, selectedPhotoId]);

  useEffect(() => {
    if (!isOpen || !selectedPhoto) {
      setLoadedImage(null);
      return;
    }

    const url = getPhotoDisplayUrl(selectedPhoto);
    if (!url) {
      setLoadedImage(null);
      setImageError(true);
      return;
    }

    let cancelled = false;
    setImageLoading(true);
    setImageError(false);

    loadExportImage(url)
      .then((img) => {
        if (!cancelled) setLoadedImage(img);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedImage(null);
          setImageError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setImageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedPhoto?.id]);

  const dayLabel = t('common.day');
  const observationsLabel = t('operations.export.observationsLabel');
  const renderOptions: ExportRenderOptions = useMemo(
    () => ({
      fontMode,
      enabledStatKeys: enabledStats,
      dayLabel,
      observationsLabel,
      metricScale,
      glass,
    }),
    [fontMode, enabledStats, dayLabel, observationsLabel, metricScale, glass],
  );

  const { canvasRef } = useExportPreview(loadedImage, snapshot, renderOptions);

  const toggleStat = (key: ExportStatKey) => {
    setEnabledStats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDownload = async () => {
    if (!snapshot) return;
    setExporting(true);
    try {
      if (context?.kind === 'cycle') {
        const { blob, extension, fellBackToWebm } = await renderCycleVideo({
          frames: cycleFrames,
          options: renderOptions,
          speed,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeCrop = context.cycle.cropType.replace(/\s+/g, '-').toLowerCase();
        a.href = url;
        a.download = `hiperlocal-cycle-${safeCrop}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        if (fellBackToWebm) {
          alert(t('operations.export.mp4Fallback'));
        }
        return;
      }

      if (!loadedImage) return;
      const blob = await renderDailyUpdateToBlob(loadedImage, snapshot, renderOptions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeCrop = snapshot.crop.replace(/\s+/g, '-').toLowerCase();
      a.href = url;
      a.download = `hiperlocal-day-${snapshot.dayNumber}-${safeCrop}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert(t('operations.export.failed'));
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen || !context) return null;

  const canExport =
    context.kind === 'cycle'
      ? cycleFrames.length > 0 && !exporting
      : context.photos.length > 0 && loadedImage && snapshot && !imageLoading && !imageError;

  const timing = isCycleContext ? getCycleExportTiming(cycleFrames.length, speed) : null;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative bg-[#0a0a0a] border border-white/20 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-base text-white">
              {isCycleContext ? t('operations.export.cycleTitle') : t('operations.export.dailyTitle')}
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              {isCycleContext ? t('operations.export.cycleSubtitle') : t('operations.export.dailySubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          <div className="md:w-64 md:border-r border-white/10 overflow-y-auto hiper-scroll p-5 space-y-5 shrink-0">
            {!context.photos.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/60 text-sm">
                {t('operations.export.noPhoto')}
              </div>
            ) : (
              <>
                {isDailyContext && context.photos.length > 1 && (
                  <div>
                    <p className="text-xs text-white/50 mb-2">{t('operations.export.choosePhoto')}</p>
                    <div className="flex gap-2 flex-wrap">
                      {context.photos.map((photo) => {
                        const url = getPhotoDisplayUrl(photo);
                        const selected = photo.id === selectedPhotoId;
                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setSelectedPhotoId(photo.id)}
                            className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                              selected
                                ? 'border-green-400 ring-2 ring-green-400/30'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isCycleContext && (
                  <>
                    <div>
                      <p className="text-xs text-white/50 mb-2">{t('operations.export.previewFrame')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(['first', 'middle', 'last'] as PreviewFrameSelection[]).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFrameSelection(opt)}
                            className={`px-2 py-1.5 rounded-lg text-xs border transition-all ${
                              frameSelection === opt
                                ? 'bg-green-500/20 text-green-300 border-green-500/60'
                                : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                            }`}
                          >
                            {t(`operations.export.frame.${opt}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-2">{t('operations.export.speed')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(['fast', 'normal', 'slow'] as CycleExportSpeed[]).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSpeed(opt)}
                            className={`px-2 py-1.5 rounded-lg text-xs border transition-all ${
                              speed === opt
                                ? 'bg-green-500/20 text-green-300 border-green-500/60'
                                : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                            }`}
                          >
                            {t(`operations.export.speedOption.${opt}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {timing && (
                      <p className="text-[11px] text-white/45">
                        {t('operations.export.estimate', {
                          duration: `${Math.round(timing.durationSeconds)}s`,
                          count: cycleFrames.length,
                          speed: t(`operations.export.speedOption.${speed}`),
                        })}
                      </p>
                    )}
                  </>
                )}

                <div>
                  <p className="text-xs text-white/50 mb-2">{t('operations.export.fontMode')}</p>
                  <div className="flex gap-2">
                    {(['light', 'dark'] as FontMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFontMode(mode)}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-all border-2 ${
                          fontMode === mode
                            ? 'bg-green-500/20 text-green-300 border-green-500/60'
                            : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                        }`}
                      >
                        {mode === 'light'
                          ? t('operations.export.fontLight')
                          : t('operations.export.fontDark')}
                      </button>
                    ))}
                  </div>
                </div>

                <SliderControl
                  label={t('operations.export.metricSize')}
                  value={metricScale}
                  min={METRIC_SCALE_MIN}
                  max={METRIC_SCALE_MAX}
                  step={0.05}
                  display={`${Math.round(metricScale * 100)}%`}
                  onChange={setMetricScale}
                />

                {snapshot && snapshot.stats.length > 0 && (
                  <div>
                    <p className="text-xs text-white/50 mb-2">{t('operations.export.stats')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {snapshot.stats.map((stat) => {
                        const on = enabledStats.has(stat.key);
                        return (
                          <button
                            key={stat.key}
                            type="button"
                            onClick={() => toggleStat(stat.key)}
                            className={`px-2.5 py-1 rounded-full text-xs font-mono border transition-all ${
                              on
                                ? 'bg-green-500/20 text-green-300 border-green-500/40'
                                : 'bg-white/5 text-white/40 border-white/10'
                            }`}
                          >
                            {stat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setGlassOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <span>{t('operations.export.glassAdvanced')}</span>
                    {glassOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-white/40" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                    )}
                  </button>
                  {glassOpen && (
                    <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                      <SliderControl
                        label={t('operations.export.glassOpacity')}
                        value={glass.opacity}
                        min={0.15}
                        max={0.75}
                        step={0.01}
                        display={`${Math.round(glass.opacity * 100)}%`}
                        onChange={(v) => setGlass((g) => ({ ...g, opacity: v }))}
                      />
                      <SliderControl
                        label={t('operations.export.glassBlur')}
                        value={glass.blur}
                        min={0}
                        max={24}
                        step={1}
                        display={`${Math.round(glass.blur)}px`}
                        onChange={(v) => setGlass((g) => ({ ...g, blur: v }))}
                      />
                      <SliderControl
                        label={t('operations.export.glassGlow')}
                        value={glass.borderGlow}
                        min={0}
                        max={1}
                        step={0.05}
                        display={`${Math.round(glass.borderGlow * 100)}%`}
                        onChange={(v) => setGlass((g) => ({ ...g, borderGlow: v }))}
                      />
                      <SliderControl
                        label={t('operations.export.glassDepth')}
                        value={glass.depth}
                        min={0}
                        max={1}
                        step={0.05}
                        display={`${Math.round(glass.depth * 100)}%`}
                        onChange={(v) => setGlass((g) => ({ ...g, depth: v }))}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-5 bg-black/20 min-h-0">
            {!context.photos.length ? null : (
              <>
                <div
                  className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/40"
                  style={{
                    aspectRatio: String(EXPORT_ASPECT),
                    maxHeight: 'calc(100% - 28px)',
                    maxWidth: '100%',
                    width: 'auto',
                  }}
                >
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs">
                      {t('operations.export.loadingPreview')}
                    </div>
                  )}
                  {imageError && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-300/80 text-xs px-4 text-center">
                      {t('operations.export.imageError')}
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                    style={{ display: loadedImage && !imageError ? 'block' : 'none' }}
                  />
                </div>
                <p className="text-[10px] text-white/30 text-center mt-2">
                  {t('operations.export.safeZoneHint')}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!canExport || exporting}
            className={`flex items-center gap-2 text-sm bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-full px-5 py-2.5 text-white transition-all ${
              !canExport || exporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Download className="w-4 h-4" />
            {exporting
              ? t('operations.export.exporting')
              : isCycleContext
                ? t('operations.export.downloadVideo')
                : t('operations.export.downloadPng')}
          </button>
        </div>
      </div>
    </div>
  );
}
