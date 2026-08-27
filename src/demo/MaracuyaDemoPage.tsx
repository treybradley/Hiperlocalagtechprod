import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Download, MapPin, Upload } from 'lucide-react';
import {
  DEFAULT_GLASS_STYLE,
  DEFAULT_METRIC_SCALE,
  METRIC_SCALE_MAX,
  METRIC_SCALE_MIN,
  type ExportRenderOptions,
  type FontMode,
  type GlassStyle,
} from '../app/components/operations/export/types';
import { EXPORT_ASPECT } from '../app/components/operations/export/exportFormat';
import { getActDefinition } from './maracuyaDefaults';
import {
  ALL_STAT_KEYS,
  type DemoActId,
  type DemoDayConfig,
  type DemoPersistedState,
  redistributeMarkers,
  previewTimeToVideoProgress,
  videoProgressToPreviewTime,
  getIntroDuration,
} from './types';
import {
  CADENCE_LABELS,
  STAT_LABELS,
  type MetricCadence,
} from './generateTulumMetrics';
import {
  getTotalTimelineDuration,
  renderTimelapsePreviewFrame,
  renderTimelapseVideo,
  type TimelapseRenderConfig,
} from './renderTimelapseExport';

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
        className="w-full accent-emerald-400"
      />
    </div>
  );
}

function loadPersisted(actId: DemoActId): DemoPersistedState | null {
  try {
    const raw = localStorage.getItem(`maracuya-demo-${actId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoPersistedState>;
    const base = defaultState(actId);
    return {
      ...base,
      ...parsed,
      days: parsed.days ?? base.days,
      intro: parsed.intro ?? base.intro,
      glass: parsed.glass ?? base.glass,
      introGlass: parsed.introGlass ?? parsed.glass ?? base.introGlass,
      introFontMode: parsed.introFontMode ?? parsed.fontMode ?? base.introFontMode,
      enabledStatKeys: parsed.enabledStatKeys ?? base.enabledStatKeys,
      metricCadence: parsed.metricCadence ?? base.metricCadence,
    };
  } catch {
    return null;
  }
}

function savePersisted(actId: DemoActId, state: DemoPersistedState) {
  localStorage.setItem(`maracuya-demo-${actId}`, JSON.stringify(state));
}

function defaultState(actId: DemoActId): DemoPersistedState {
  const act = getActDefinition(actId);
  return {
    days: act.days.map((d) => ({
      ...d,
      stats: Object.fromEntries(
        Object.entries(d.stats).map(([key, stat]) => [key, { ...stat }]),
      ) as DemoDayConfig['stats'],
    })),
    intro: { ...act.introDefault },
    headerOffsetY: 0,
    metricScale: DEFAULT_METRIC_SCALE,
    fontMode: 'light',
    glass: { ...DEFAULT_GLASS_STYLE },
    introFontMode: 'light',
    introGlass: { ...DEFAULT_GLASS_STYLE },
    endHoldSec: 1.5,
    enabledStatKeys: [...ALL_STAT_KEYS],
    metricCadence: '12x',
  };
}

function FontModeToggle({
  value,
  onChange,
}: {
  value: FontMode;
  onChange: (mode: FontMode) => void;
}) {
  return (
    <div className="flex gap-2">
      {(['light', 'dark'] as FontMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs border-2 ${
            value === mode
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
              : 'bg-white/5 text-white/60 border-transparent'
          }`}
        >
          {mode === 'light' ? 'Light text' : 'Dark text'}
        </button>
      ))}
    </div>
  );
}

function GlassControls({
  glass,
  onChange,
}: {
  glass: GlassStyle;
  onChange: (glass: GlassStyle) => void;
}) {
  return (
    <div className="space-y-4">
      {(
        [
          ['opacity', 'Opacity', 0.15, 0.75, 0.01, (v: number) => `${Math.round(v * 100)}%`],
          ['blur', 'Blur', 0, 24, 1, (v: number) => `${Math.round(v)}px`],
          ['borderGlow', 'Border glow', 0, 1, 0.05, (v: number) => `${Math.round(v * 100)}%`],
          ['depth', 'Depth', 0, 1, 0.05, (v: number) => `${Math.round(v * 100)}%`],
        ] as const
      ).map(([key, label, min, max, step, fmt]) => (
        <SliderControl
          key={key}
          label={label}
          value={glass[key as keyof GlassStyle]}
          min={min}
          max={max}
          step={step}
          display={fmt(glass[key as keyof GlassStyle])}
          onChange={(v) => onChange({ ...glass, [key]: v })}
        />
      ))}
    </div>
  );
}

function DropZone({
  label,
  hint,
  accept,
  fileName,
  onFile,
}: {
  label: string;
  hint: string;
  accept: string;
  fileName: string | null;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors ${
        dragging
          ? 'border-emerald-400/70 bg-emerald-500/10'
          : 'border-white/15 bg-white/5 hover:border-white/25'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex items-start gap-3">
        <Upload className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-white/80">{label}</p>
          <p className="text-xs text-white/40 mt-1">{hint}</p>
          {fileName && <p className="text-xs font-mono text-emerald-300/80 mt-2 truncate">{fileName}</p>}
        </div>
      </div>
    </div>
  );
}

export function MaracuyaDemoPage() {
  const [actId, setActId] = useState<DemoActId>('act1');
  const act = getActDefinition(actId);

  const [state, setState] = useState<DemoPersistedState>(() => {
    return loadPersisted('act1') ?? defaultState('act1');
  });

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [introImageUrl, setIntroImageUrl] = useState<string | null>(null);
  const [introImageName, setIntroImageName] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [glassOpen, setGlassOpen] = useState(false);
  const [introGlassOpen, setIntroGlassOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const introImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const persisted = loadPersisted(actId) ?? defaultState(actId);
    setState(persisted);
    setPreviewTime(0);
    setExpandedDay(null);
  }, [actId]);

  useEffect(() => {
    savePersisted(actId, state);
  }, [actId, state]);

  const videoDuration = videoRef.current?.duration && Number.isFinite(videoRef.current.duration)
    ? videoRef.current.duration
    : 0;

  const introDuration = getIntroDuration(state.intro);
  const scrubberVideoProgress = previewTimeToVideoProgress(
    previewTime,
    state.intro,
    videoDuration,
  );
  const canSetMarker = videoReady && scrubberVideoProgress !== null;

  const totalDuration = getTotalTimelineDuration(
    videoDuration,
    state.intro,
    state.endHoldSec,
  );

  const renderOptions: ExportRenderOptions = useMemo(
    () => ({
      fontMode: state.fontMode,
      enabledStatKeys: new Set(state.enabledStatKeys),
      dayLabel: 'Day',
      observationsLabel: 'Observations',
      metricScale: state.metricScale,
      glass: state.glass,
      headerOffsetY: state.headerOffsetY,
    }),
    [state],
  );

  const introRenderOptions: ExportRenderOptions = useMemo(
    () => ({
      fontMode: state.introFontMode,
      enabledStatKeys: new Set(state.enabledStatKeys),
      dayLabel: 'Day',
      observationsLabel: 'Observations',
      metricScale: state.metricScale,
      glass: state.introGlass,
      headerOffsetY: 0,
    }),
    [state.introFontMode, state.introGlass, state.enabledStatKeys, state.metricScale],
  );

  const timelapseConfig: TimelapseRenderConfig | null = useMemo(() => {
    if (!videoRef.current || !videoReady) return null;
    return {
      video: videoRef.current,
      videoRotation: act.videoRotation,
      days: state.days,
      intro: state.intro,
      introImage: introImageRef.current,
      endHoldSec: state.endHoldSec,
      renderOptions,
      introRenderOptions,
      realWorldStartMs: act.realWorldStartMs,
      realWorldEndMs: act.realWorldEndMs,
      metricCadence: state.metricCadence,
    };
  }, [act, state, renderOptions, introRenderOptions, videoReady, introImageUrl]);

  const redrawPreview = useCallback(async () => {
    if (!canvasRef.current || !timelapseConfig) return;
    await renderTimelapsePreviewFrame(canvasRef.current, timelapseConfig, previewTime);
  }, [timelapseConfig, previewTime]);

  useEffect(() => {
    void redrawPreview();
  }, [redrawPreview]);

  const handleVideoFile = (file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoName(file.name);
    setVideoReady(false);
    setPreviewTime(0);
  };

  const handleIntroImageFile = (file: File) => {
    if (introImageUrl) URL.revokeObjectURL(introImageUrl);
    const url = URL.createObjectURL(file);
    setIntroImageUrl(url);
    setIntroImageName(file.name);
  };

  const updateDay = (index: number, patch: Partial<DemoDayConfig>) => {
    setState((prev) => ({
      ...prev,
      days: prev.days.map((day, i) => (i === index ? { ...day, ...patch } : day)),
    }));
  };

  const setMarkerAtScrubber = (index: number) => {
    const progress = previewTimeToVideoProgress(previewTime, state.intro, videoDuration);
    if (progress === null) return;
    updateDay(index, { markerStart: progress });
  };

  const jumpToMarker = (markerStart: number) => {
    if (!videoReady || videoDuration <= 0) return;
    setPreviewTime(videoProgressToPreviewTime(markerStart, state.intro, videoDuration));
  };

  const handleExport = async () => {
    if (!timelapseConfig) return;
    setExporting(true);
    setExportProgress(0);
    try {
      const result = await renderTimelapseVideo({
        ...timelapseConfig,
        onProgress: setExportProgress,
      });
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${act.exportFilename}.${result.extension}`;
      a.click();
      URL.revokeObjectURL(url);
      if (result.fellBackToWebm) {
        alert('Your browser exported WebM instead of MP4.');
      }
    } catch (err) {
      console.error(err);
      alert('Export failed. Check that the video is loaded.');
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-screen">
        <div className="lg:w-[420px] xl:w-[460px] shrink-0 border-r border-white/10 overflow-y-auto max-h-screen">
          <div className="p-5 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-400/80 mb-1">Demo export</p>
              <h1 className="text-xl font-semibold">Maracuyá timelapse</h1>
              <p className="text-sm text-white/45 mt-1">Isolated compositor for social exports</p>
            </div>

            <div className="flex gap-2">
              {(['act1', 'act2'] as DemoActId[]).map((id) => {
                const def = getActDefinition(id);
                const active = actId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActId(id)}
                    className={`flex-1 rounded-xl px-3 py-2 text-left border transition-all ${
                      active
                        ? 'border-emerald-500/50 bg-emerald-500/15'
                        : 'border-white/10 bg-white/5 hover:bg-white/8'
                    }`}
                  >
                    <p className="text-xs font-medium">{def.label}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{def.subtitle}</p>
                  </button>
                );
              })}
            </div>

            <DropZone
              label="Timelapse video"
              hint="Drop MOV or MP4"
              accept="video/*"
              fileName={videoName}
              onFile={handleVideoFile}
            />

            <DropZone
              label="Intro card photo (optional)"
              hint="e.g. plant in DWC before soil transplant"
              accept="image/*"
              fileName={introImageName}
              onFile={handleIntroImageFile}
            />

            <div className="rounded-xl border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50">Intro card</p>
                <label className="flex items-center gap-2 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={state.intro.enabled}
                    onChange={(e) =>
                      setState((s) => ({ ...s, intro: { ...s.intro, enabled: e.target.checked } }))
                    }
                    className="accent-emerald-400"
                  />
                  Enabled
                </label>
              </div>
              <input
                value={state.intro.title}
                onChange={(e) =>
                  setState((s) => ({ ...s, intro: { ...s.intro, title: e.target.value } }))
                }
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
                placeholder="Title"
              />
              <input
                value={state.intro.subtitle}
                onChange={(e) =>
                  setState((s) => ({ ...s, intro: { ...s.intro, subtitle: e.target.value } }))
                }
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono"
                placeholder="Subtitle"
              />
              <SliderControl
                label="Intro duration"
                value={state.intro.durationSec}
                min={0.5}
                max={5}
                step={0.25}
                display={`${state.intro.durationSec.toFixed(1)}s`}
                onChange={(v) =>
                  setState((s) => ({ ...s, intro: { ...s.intro, durationSec: v } }))
                }
              />
            </div>

            <div className="rounded-xl border border-white/10 p-4 space-y-3">
              <p className="text-xs text-white/50">Intro card style</p>
              <FontModeToggle
                value={state.introFontMode}
                onChange={(mode) => setState((s) => ({ ...s, introFontMode: mode }))}
              />
              <div className="rounded-lg border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIntroGlassOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-white/70 hover:bg-white/5"
                >
                  <span>Intro glass</span>
                  {introGlassOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {introGlassOpen && (
                  <div className="px-3 pb-3 space-y-4 border-t border-white/10 pt-3">
                    <GlassControls
                      glass={state.introGlass}
                      onChange={(introGlass) => setState((s) => ({ ...s, introGlass }))}
                    />
                  </div>
                )}
              </div>
            </div>

            <SliderControl
              label="End hold"
              value={state.endHoldSec}
              min={0}
              max={4}
              step={0.25}
              display={`${state.endHoldSec.toFixed(1)}s`}
              onChange={(v) => setState((s) => ({ ...s, endHoldSec: v }))}
            />

            <div className="rounded-xl border border-white/10 p-4 space-y-3">
              <p className="text-xs text-white/50">Overlay / metrics style</p>
              <SliderControl
                label="Header position"
                value={state.headerOffsetY}
                min={-150}
                max={350}
                step={5}
                display={`${state.headerOffsetY}px`}
                onChange={(v) => setState((s) => ({ ...s, headerOffsetY: v }))}
              />
              <FontModeToggle
                value={state.fontMode}
                onChange={(mode) => setState((s) => ({ ...s, fontMode: mode }))}
              />
              <SliderControl
                label="Metric size"
                value={state.metricScale}
                min={METRIC_SCALE_MIN}
                max={METRIC_SCALE_MAX}
                step={0.05}
                display={`${Math.round(state.metricScale * 100)}%`}
                onChange={(v) => setState((s) => ({ ...s, metricScale: v }))}
              />
              <div className="rounded-lg border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setGlassOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-white/70 hover:bg-white/5"
                >
                  <span>Overlay glass</span>
                  {glassOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {glassOpen && (
                  <div className="px-3 pb-3 space-y-4 border-t border-white/10 pt-3">
                    <GlassControls
                      glass={state.glass}
                      onChange={(glass) => setState((s) => ({ ...s, glass }))}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-white/50 mb-2">Metric updates</p>
              <p className="text-[10px] text-white/35 mb-2 leading-relaxed">
                Live Tulum-shaped temp/humidity curves · 12×/day = every 2 hours
              </p>
              <div className="flex gap-2">
                {(['12x', 'hourly', 'daily'] as MetricCadence[]).map((cadence) => (
                  <button
                    key={cadence}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, metricCadence: cadence }))}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-mono border-2 ${
                      state.metricCadence === cadence
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                        : 'bg-white/5 text-white/60 border-transparent'
                    }`}
                  >
                    {CADENCE_LABELS[cadence]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-white/50 mb-2">Stats on image</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STAT_KEYS.map((key) => {
                  const on = state.enabledStatKeys.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          enabledStatKeys: on
                            ? s.enabledStatKeys.filter((k) => k !== key)
                            : [...s.enabledStatKeys, key],
                        }))
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-mono border ${
                        on
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                    >
                      {STAT_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/50">Day markers</p>
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({ ...s, days: redistributeMarkers(s.days) }))
                  }
                  className="text-[10px] text-emerald-400 hover:text-emerald-300"
                >
                  Equalize
                </button>
              </div>
              <p className="text-[10px] text-white/35 leading-relaxed">
                Scrub the preview timeline, then set each day&apos;s marker at the current frame.
              </p>
              {state.days.map((day, index) => {
                const markerSec = videoDuration > 0 ? day.markerStart * videoDuration : 0;
                const open = expandedDay === index;
                return (
                  <div key={day.dayNumber} className="rounded-lg border border-white/10 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedDay(open ? null : index)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5"
                    >
                      <span className="text-xs font-mono">
                        Day {day.dayNumber} · {day.dateLabel}
                      </span>
                      <span className="text-[10px] font-mono text-white/35 mr-2">
                        {videoDuration > 0 ? formatTime(markerSec) : `${Math.round(day.markerStart * 100)}%`}
                      </span>
                      {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!canSetMarker}
                          onClick={() => setMarkerAtScrubber(index)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium border transition-colors disabled:opacity-30 disabled:pointer-events-none bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                        >
                          <MapPin className="w-3 h-3" />
                          Set at scrubber
                        </button>
                        <button
                          type="button"
                          disabled={!videoReady || videoDuration <= 0}
                          onClick={() => jumpToMarker(day.markerStart)}
                          className="rounded-lg px-2 py-1.5 text-[10px] text-white/50 border border-white/10 hover:bg-white/5 disabled:opacity-30"
                        >
                          Go to
                        </button>
                      </div>
                      <SliderControl
                        label="Fine-tune"
                        value={day.markerStart}
                        min={0}
                        max={0.99}
                        step={0.001}
                        display={
                          videoDuration > 0
                            ? `${formatTime(markerSec)} (${Math.round(day.markerStart * 100)}%)`
                            : `${Math.round(day.markerStart * 100)}%`
                        }
                        onChange={(v) => updateDay(index, { markerStart: v })}
                      />
                      {open && (
                        <input
                          value={day.observations}
                          onChange={(e) => updateDay(index, { observations: e.target.value })}
                          className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs"
                          placeholder="Observations"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!videoReady || exporting}
              onClick={() => void handleExport()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:pointer-events-none text-black font-medium py-3"
            >
              <Download className="w-4 h-4" />
              {exporting
                ? `Exporting ${Math.round(exportProgress * 100)}%…`
                : 'Download video'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[50vh] lg:min-h-screen bg-black/30">
          <video
            ref={videoRef}
            src={videoUrl ?? undefined}
            className="hidden"
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={() => setVideoReady(true)}
          />
          {introImageUrl && (
            <img
              ref={introImageRef}
              src={introImageUrl}
              alt=""
              className="hidden"
              onLoad={() => void redrawPreview()}
            />
          )}

          <div
            className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl"
            style={{
              aspectRatio: String(EXPORT_ASPECT),
              maxHeight: 'calc(100vh - 120px)',
              maxWidth: '100%',
              width: 'auto',
            }}
          >
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40">
                Drop a timelapse video to preview
              </div>
            )}
          </div>

          {videoReady && totalDuration > 0 && (
            <div className="w-full max-w-md mt-5 space-y-2">
              <div className="flex justify-between text-xs font-mono text-white/50">
                <span>
                  {previewTime < introDuration
                    ? `Intro ${formatTime(previewTime)}`
                    : `Video ${formatTime(previewTime - introDuration)}`}
                </span>
                <span>{formatTime(totalDuration)} total</span>
              </div>
              <input
                type="range"
                min={0}
                max={totalDuration}
                step={0.04}
                value={previewTime}
                onChange={(e) => setPreviewTime(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
              {!canSetMarker && previewTime < introDuration && (
                <p className="text-[10px] text-white/35 text-center">
                  Scrub past the intro to set day markers
                </p>
              )}
              {canSetMarker && (
                <p className="text-[10px] text-emerald-400/70 text-center font-mono">
                  Scrubber at video {formatTime(previewTime - introDuration)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
