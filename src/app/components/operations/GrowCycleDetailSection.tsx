import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  Droplets,
  Thermometer,
  Image as ImageIcon,
  X,
  CheckCircle,
  Pencil,
  Share2,
  Zap,
  Waves,
  Sprout,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { GrowCycle, DailyLog, Photo, HydroponicSystem } from '../../../storage/models';
import { getGrowCycle } from '../../../storage/operations/growCycles';
import { getDailyLogsByGrowCycle } from '../../../storage/operations/dailyLogs';
import { getPhotoDisplayUrl, getPhotosByGrowCycle } from '../../../storage/operations/photos';
import { getSystem } from '../../../storage/operations/systems';
import { formatDate, getDaysSince } from '../../../storage/utils/dateHelpers';
import {
  STAGE_ORDER,
  deriveCycleStageState,
  getLogDayNumber,
  getStageAsOfTimestamp,
} from '../../../storage/utils/stageFromLogs';
import { RecordHarvestModal } from './modals/RecordHarvestModal';
import { EditGrowCycleModal } from './modals/EditGrowCycleModal';
import { DailyLogEntryModal } from './modals/DailyLogEntryModal';
import { ExportModal } from './export/ExportModal';
import type { ExportContext } from './export/types';

interface GrowCycleDetailSectionProps {
  cycleId: string;
  onBack: () => void;
  onCycleDeleted?: () => void;
}

function plantHealthTextClass(health: DailyLog['plantHealth']): string {
  switch (health) {
    case 'excellent':
      return 'text-green-400';
    case 'good':
      return 'text-green-300';
    case 'fair':
      return 'text-yellow-400';
    case 'poor':
      return 'text-orange-400';
    default:
      return 'text-red-400';
  }
}

export function GrowCycleDetailSection({
  cycleId,
  onBack,
  onCycleDeleted,
}: GrowCycleDetailSectionProps) {
  const { t } = useLanguage();
  const [cycle, setCycle] = useState<GrowCycle | null>(null);
  const [system, setSystem] = useState<HydroponicSystem | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [latestLog, setLatestLog] = useState<DailyLog | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showEditCycleModal, setShowEditCycleModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [exportContext, setExportContext] = useState<ExportContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCycleData();
  }, [cycleId]);

  async function loadCycleData() {
    try {
      const cycleData = await getGrowCycle(cycleId);

      if (!cycleData) {
        setLoading(false);
        return;
      }

      const [systemData, logs, cyclePhotos] = await Promise.all([
        getSystem(cycleData.systemId),
        getDailyLogsByGrowCycle(cycleId),
        getPhotosByGrowCycle(cycleId),
      ]);

      setCycle(cycleData);
      setSystem(systemData || null);
      setDailyLogs(logs);
      setPhotos(cyclePhotos);
      setLatestLog(logs[0] || null);
    } catch (error) {
      console.error('Failed to load cycle data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddLog = () => {
    setEditingLog(null);
    setShowLogModal(true);
  };

  const handleOpenEditLog = (log: DailyLog) => {
    setEditingLog(log);
    setShowLogModal(true);
  };

  const stageState = useMemo(() => {
    if (!cycle) {
      return {
        effectiveStage: 'germination' as const,
        stages: undefined,
        currentStageIndex: 0,
      };
    }
    return deriveCycleStageState(dailyLogs, cycle);
  }, [cycle, dailyLogs]);

  if (loading) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
        <div className="flex items-center justify-center h-full">
          <div className="text-white/60">{t('operations.cycle.loading')}</div>
        </div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
        <div className="flex items-center justify-center h-full">
          <div className="text-white/60">{t('operations.cycle.notFound')}</div>
        </div>
      </div>
    );
  }

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

  const { effectiveStage, stages: derivedStages, currentStageIndex } = stageState;
  const effectiveStageLabel = getStageLabel(effectiveStage);
  const showRecordHarvest =
    effectiveStage === 'harvest' && cycle.status === 'active';

  const getPlantHealthLabel = (health: DailyLog['plantHealth']) => {
    const key = `plantHealth.${health}`;
    const translated = t(key);
    return translated !== key ? translated : health;
  };

  const handleOpenExportLog = (log: DailyLog) => {
    const logPhotos = photos.filter((p) => p.dailyLogId === log.id);
    if (logPhotos.length === 0) return;

    const logStage = getStageAsOfTimestamp(dailyLogs, log.timestamp, effectiveStage);
    setExportContext({
      kind: 'daily-log',
      cycle,
      log,
      photos: logPhotos,
      stageLabel: getStageLabel(logStage),
      dayNumber: getLogDayNumber(cycle, log),
    });
  };

  const handleOpenExportCycle = () => {
    setExportContext({
      kind: 'cycle',
      cycle,
      logs: dailyLogs,
      photos,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto pl-4 pr-4 md:pr-4 py-8 md:py-12 pt-20 md:pt-28">
        <div className="flex flex-col h-full gap-10 overflow-y-auto hiper-scroll px-1 pb-24">

          {/* Header */}
          <div className="flex-shrink-0">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-light text-white/60 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('operations.cycle.back')}
            </button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[32px] text-white tracking-tight mb-2">
                  {cycle.name}
                </h1>
                <div className="flex items-center gap-4 text-white/60 flex-wrap">
                  <span>{cycle.cropType}</span>
                  <span>•</span>
                  <span>{t('common.day')} {getDaysSince(cycle.seedDate)}</span>
                  <span>•</span>
                  <span className="text-green-400">{effectiveStageLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                <button
                  onClick={() => setShowEditCycleModal(true)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-4 py-2 sm:py-3 text-sm text-white transition-all"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('operations.cycle.edit')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenExportCycle}
                  disabled={photos.length === 0}
                  title={photos.length === 0 ? t('operations.export.noPhotoShort') : t('operations.cycle.export')}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 sm:py-3 text-sm transition-all ${
                    photos.length === 0
                      ? 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed opacity-60'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white'
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('operations.cycle.export')}</span>
                </button>
                {showRecordHarvest && (
                  <button
                    onClick={() => setShowHarvestModal(true)}
                    className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm border border-blue-500/40 hover:border-blue-500/60 rounded-full px-4 sm:px-6 py-2 sm:py-3 transition-all duration-300 group"
                  >
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                    <span className="text-white text-sm sm:text-base">{t('operations.cycle.recordHarvest')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stage Progress Timeline */}
          <div className="flex-shrink-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-normal text-white mb-8">{t('operations.cycle.stageProgress')}</h3>

            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000"
                style={{ width: `${((currentStageIndex + 1) / STAGE_ORDER.length) * 100}%` }}
              />

              <div className="relative flex justify-between">
                {STAGE_ORDER.map((stage, index) => {
                  const isCompleted = index < currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  const stageData = derivedStages?.[stage as keyof typeof derivedStages];

                  return (
                    <div key={stage} className="flex flex-col items-center flex-1">
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center mb-3 transition-all ${
                          isCompleted || isCurrent
                            ? 'bg-[#0a0a0a] border-green-500'
                            : 'bg-[#0a0a0a] border-white/20'
                        }`}
                      >
                        {isCompleted ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className={`text-sm ${isCurrent ? 'text-green-400' : 'text-white/40'}`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <div className={`text-sm ${isCurrent ? 'text-white' : 'text-white/60'}`}>
                          {getStageLabel(stage)}
                        </div>
                        {stageData && 'startDate' in stageData && stageData.startDate && (
                          <div className="text-xs text-white/40 mt-1">
                            {formatDate(stageData.startDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Metrics Overview */}
          {latestLog && (
            <div className="flex-shrink-0">
              <h3 className="text-lg font-normal text-white mb-4">{t('operations.cycle.currentMetrics')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white/60">{t('operations.cycle.temp')}</span>
                  </div>
                  <div className="text-2xl text-white">
                    {latestLog.environment.temperature?.toFixed(1) || '--'}°C
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white/60">{t('operations.cycle.humidity')}</span>
                  </div>
                  <div className="text-2xl text-white">
                    {latestLog.environment.humidity?.toFixed(0) || '--'}%
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white/60">{t('operations.cycle.ph')}</span>
                  </div>
                  <div className="text-2xl text-white">
                    {latestLog.environment.ph?.toFixed(1) || '--'}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white/60">{t('operations.cycle.ec')}</span>
                  </div>
                  <div className="text-2xl text-white">
                    {latestLog.environment.ec?.toFixed(1) || '--'}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Waves className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white/60">{t('operations.cycle.waterT')}</span>
                  </div>
                  <div className="text-2xl text-white">
                    {latestLog.environment.waterTemp?.toFixed(1) || '--'}°C
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sprout className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white/60">{t('operations.cycle.plantHealth')}</span>
                  </div>
                  <div className={`text-lg capitalize ${plantHealthTextClass(latestLog.plantHealth)}`}>
                    {getPlantHealthLabel(latestLog.plantHealth)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Photo Lightbox */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="max-w-5xl w-full max-h-[90vh] flex flex-col">
                {getPhotoDisplayUrl(selectedPhoto) ? (
                  <img
                    src={getPhotoDisplayUrl(selectedPhoto)}
                    alt={selectedPhoto.caption || t('operations.cycle.photoAlt')}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="text-white/60 text-center py-12">{t('operations.cycle.photoUnavailable')}</div>
                )}

                {selectedPhoto.caption && (
                  <div className="mt-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <p className="text-white">{selectedPhoto.caption}</p>
                    <p className="text-sm text-white/40 mt-2">
                      {formatDate(selectedPhoto.timestamp)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Daily Logs Feed */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h3 className="text-lg font-normal text-white">
                {t('operations.cycle.dailyLogs')} ({dailyLogs.length})
              </h3>
              <button
                onClick={handleOpenAddLog}
                className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full px-4 py-2 text-xs text-white transition-all shrink-0"
              >
                <Plus className="w-4 h-4 text-green-400" />
                {t('operations.cycle.addDailyLog')}
              </button>
            </div>

            {dailyLogs.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-white/60 mb-4">{t('operations.cycle.noLogsYet')}</div>
                <button
                  onClick={handleOpenAddLog}
                  className="inline-flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white transition-all"
                >
                  <Plus className="w-4 h-4" />
                  {t('operations.cycle.addFirstLog')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {dailyLogs.map((log) => {
                  const logStage = getStageAsOfTimestamp(
                    dailyLogs,
                    log.timestamp,
                    effectiveStage,
                  );
                  const dayNumber = getLogDayNumber(cycle, log);

                  return (
                    <div
                      key={log.id}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <div>
                          <div className="text-white font-medium mb-1">
                            {formatDate(log.timestamp)}
                          </div>
                          <div className="text-sm text-white/60 flex items-center gap-1 flex-wrap">
                            <span>{t('common.day')} {dayNumber}</span>
                            <span>·</span>
                            <span className={plantHealthTextClass(log.plantHealth)}>
                              {getPlantHealthLabel(log.plantHealth)}
                            </span>
                            <span>·</span>
                            <span>{getStageLabel(logStage)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(() => {
                            const logPhotos = photos.filter((p) => p.dailyLogId === log.id);
                            const canExport = logPhotos.length > 0;
                            return (
                              <button
                                type="button"
                                onClick={() => handleOpenExportLog(log)}
                                disabled={!canExport}
                                title={
                                  canExport
                                    ? t('operations.cycle.export')
                                    : t('operations.export.noPhotoShort')
                                }
                                className={`p-2 transition-colors ${
                                  canExport
                                    ? 'text-white/40 hover:text-green-400'
                                    : 'text-white/20 cursor-not-allowed'
                                }`}
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            );
                          })()}
                          <button
                            onClick={() => handleOpenEditLog(log)}
                            className="p-2 text-white/40 hover:text-white transition-colors"
                            title={t('operations.cycle.editLog')}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {log.observations && (
                        <p className="text-white/80 mb-4">{log.observations}</p>
                      )}

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                        {log.environment.temperature != null && (
                          <div className="text-xs">
                            <div className="text-white/40 mb-1">{t('operations.cycle.temp')}</div>
                            <div className="text-white">{log.environment.temperature}°C</div>
                          </div>
                        )}
                        {log.environment.humidity != null && (
                          <div className="text-xs">
                            <div className="text-white/40 mb-1">{t('operations.cycle.humidity')}</div>
                            <div className="text-white">{log.environment.humidity}%</div>
                          </div>
                        )}
                        {log.environment.ph != null && (
                          <div className="text-xs">
                            <div className="text-white/40 mb-1">{t('operations.cycle.ph')}</div>
                            <div className="text-white">{log.environment.ph}</div>
                          </div>
                        )}
                        {log.environment.ec != null && (
                          <div className="text-xs">
                            <div className="text-white/40 mb-1">{t('operations.cycle.ec')}</div>
                            <div className="text-white">{log.environment.ec}</div>
                          </div>
                        )}
                        {log.environment.waterTemp != null && (
                          <div className="text-xs">
                            <div className="text-white/40 mb-1">{t('operations.cycle.waterT')}</div>
                            <div className="text-white">{log.environment.waterTemp}°C</div>
                          </div>
                        )}
                        {log.environment.lightLevel != null && (
                          <div className="text-xs">
                            <div className="text-white/40 mb-1">{t('operations.cycle.light')}</div>
                            <div className="text-white">{log.environment.lightLevel}</div>
                          </div>
                        )}
                      </div>

                      {log.tasksPerformed.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-white/40 mb-2">{t('operations.cycle.tasksPerformed')}</div>
                          <div className="space-y-1">
                            {log.tasksPerformed.map((task, i) => (
                              <div key={i} className="text-sm text-white/70">
                                • {task.task}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {log.issues.length > 0 && (
                        <div>
                          <div className="text-xs text-white/40 mb-2">{t('operations.cycle.issues')}</div>
                          <div className="space-y-2">
                            {log.issues.map((issue, i) => (
                              <div
                                key={i}
                                className={`text-sm p-2 rounded-lg ${
                                  issue.severity === 'high'
                                    ? 'bg-red-500/10 text-red-300'
                                    : issue.severity === 'medium'
                                      ? 'bg-yellow-500/10 text-yellow-300'
                                      : 'bg-white/5 text-white/70'
                                }`}
                              >
                                <span className="uppercase text-xs mr-2">
                                  {t(`severity.${issue.severity}`) !== `severity.${issue.severity}`
                                    ? t(`severity.${issue.severity}`)
                                    : issue.severity}
                                </span>
                                {issue.description}
                                {issue.resolved && (
                                  <span className="text-green-400 ml-2">{t('operations.cycle.resolved')}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(() => {
                        const logPhotos = photos.filter((p) => p.dailyLogId === log.id);
                        if (logPhotos.length === 0) return null;
                        return (
                          <div
                            className={
                              log.issues.length > 0 || log.tasksPerformed.length > 0
                                ? 'mt-4 pt-4 border-t border-white/10'
                                : ''
                            }
                          >
                            <div className="text-xs text-white/40 mb-2 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {logPhotos.length}{' '}
                              {logPhotos.length > 1
                                ? t('operations.cycle.photos')
                                : t('operations.cycle.photo')}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {logPhotos.map((photo) => (
                                <button
                                  key={photo.id}
                                  onClick={() => setSelectedPhoto(photo)}
                                  className="group relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-green-500/50 transition-all shrink-0"
                                >
                                  {getPhotoDisplayUrl(photo) ? (
                                    <img
                                      src={getPhotoDisplayUrl(photo)}
                                      alt={photo.caption || t('operations.cycle.logPhotoAlt')}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/30 text-xs">
                                      {t('operations.cycle.noPreview')}
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <EditGrowCycleModal
        isOpen={showEditCycleModal}
        cycle={cycle}
        derivedStageLabel={effectiveStageLabel}
        logCount={dailyLogs.length}
        photoCount={photos.length}
        onClose={() => setShowEditCycleModal(false)}
        onSuccess={loadCycleData}
        onDeleted={() => {
          onCycleDeleted?.();
          onBack();
        }}
      />

      {system && (
        <DailyLogEntryModal
          isOpen={showLogModal}
          growCycleId={cycleId}
          systemId={system.id}
          existingLog={editingLog}
          effectiveStageLabel={effectiveStageLabel}
          onClose={() => {
            setShowLogModal(false);
            setEditingLog(null);
          }}
          onSuccess={() => loadCycleData()}
        />
      )}

      {cycle && system && (
        <RecordHarvestModal
          isOpen={showHarvestModal}
          cycle={cycle}
          system={system}
          onClose={() => setShowHarvestModal(false)}
          onSuccess={() => {
            loadCycleData();
            onBack();
          }}
        />
      )}

      <ExportModal
        isOpen={exportContext != null}
        context={exportContext}
        onClose={() => setExportContext(null)}
      />
    </div>
  );
}
