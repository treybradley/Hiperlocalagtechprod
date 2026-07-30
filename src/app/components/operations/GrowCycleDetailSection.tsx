import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Calendar, TrendingUp, Droplets, Thermometer, ChevronRight, Image as ImageIcon, X, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { GrowCycle, DailyLog, Photo, HydroponicSystem } from '../../../storage/models';
import { getGrowCycle, advanceGrowCycleStage as advanceCycleStage, deleteGrowCycle } from '../../../storage/operations/growCycles';
import { getDailyLogsByGrowCycle, deleteDailyLog } from '../../../storage/operations/dailyLogs';
import { getPhotoDisplayUrl, getPhotosByGrowCycle } from '../../../storage/operations/photos';
import { getSystem } from '../../../storage/operations/systems';
import { formatDate, getDaysSince, formatRelativeTime } from '../../../storage/utils/dateHelpers';
import { RecordHarvestModal } from './modals/RecordHarvestModal';
import { EditGrowCycleModal } from './modals/EditGrowCycleModal';
import { DailyLogEntryModal } from './modals/DailyLogEntryModal';
import { ConfirmDialog } from './modals/ConfirmDialog';

interface GrowCycleDetailSectionProps {
  cycleId: string;
  onBack: () => void;
  onCycleDeleted?: () => void;
}

const STAGE_ORDER = ['germination', 'rootDevelopment', 'vegetativeGrowth', 'flowering', 'harvest'] as const;

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
  const [confirmDeleteCycle, setConfirmDeleteCycle] = useState(false);
  const [logToDelete, setLogToDelete] = useState<DailyLog | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const handleAdvanceStage = async () => {
    if (!cycle || cycle.currentStage === 'completed') return;

    const currentIndex = STAGE_ORDER.indexOf(cycle.currentStage as any);
    if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) return;

    const nextStage = STAGE_ORDER[currentIndex + 1];

    try {
      await advanceCycleStage(cycleId, nextStage);
      await loadCycleData();
    } catch (error) {
      console.error('Failed to advance stage:', error);
      alert(t('operations.cycle.failedAdvance'));
    }
  };

  const handleOpenAddLog = () => {
    setEditingLog(null);
    setShowLogModal(true);
  };

  const handleOpenEditLog = (log: DailyLog) => {
    setEditingLog(log);
    setShowLogModal(true);
  };

  const handleDeleteCycle = async () => {
    setDeleting(true);
    try {
      await deleteGrowCycle(cycleId);
      setConfirmDeleteCycle(false);
      onCycleDeleted?.();
      onBack();
    } catch (error) {
      console.error('Failed to delete grow cycle:', error);
      alert(t('operations.cycle.failedDeleteCycle'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteLog = async () => {
    if (!logToDelete) return;
    setDeleting(true);
    try {
      await deleteDailyLog(logToDelete.id);
      setLogToDelete(null);
      await loadCycleData();
    } catch (error) {
      console.error('Failed to delete daily log:', error);
      alert(t('operations.cycle.failedDeleteLog'));
    } finally {
      setDeleting(false);
    }
  };

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

  const currentStageIndex = STAGE_ORDER.indexOf(cycle.currentStage as any);
  const canAdvance = currentStageIndex >= 0 && currentStageIndex < STAGE_ORDER.length - 1 && cycle.status === 'active';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      {/* Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto pl-4 pr-4 md:pr-4 py-8 md:py-12 pt-20 md:pt-28">
        <div className="flex flex-col h-full gap-6 overflow-y-auto hiper-scroll px-1 pb-24">

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
                <div className="flex items-center gap-4 text-white/60">
                  <span>{cycle.cropType}</span>
                  <span>•</span>
                  <span>{t('common.day')} {getDaysSince(cycle.seedDate)}</span>
                  <span>•</span>
                  <span className="text-green-400">{getStageLabel(cycle.currentStage)}</span>
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
                  onClick={() => setConfirmDeleteCycle(true)}
                  className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full px-[15px] py-2 sm:py-3 text-xs font-normal text-red-300 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('operations.cycle.delete')}</span>
                </button>
                {cycle.currentStage === 'harvest' && cycle.status === 'active' && (
                  <button
                    onClick={() => setShowHarvestModal(true)}
                    className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm border border-blue-500/40 hover:border-blue-500/60 rounded-full px-4 sm:px-6 py-2 sm:py-3 transition-all duration-300 group"
                  >
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                    <span className="text-white text-sm sm:text-base">{t('operations.cycle.recordHarvest')}</span>
                  </button>
                )}
                <button
                  onClick={handleOpenAddLog}
                  className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full px-4 sm:px-6 py-2 sm:py-3 transition-all duration-300 group font-normal"
                >
                  <Plus className="w-5 h-5 text-green-400" />
                  <span className="text-white text-xs font-normal">{t('operations.cycle.addDailyLog')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stage Progress Timeline */}
          <div className="flex-shrink-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-white">{t('operations.cycle.stageProgress')}</h3>
              {canAdvance && (
                <button
                  onClick={handleAdvanceStage}
                  className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white transition-all"
                >
                  {t('operations.cycle.advanceTo')} {getStageLabel(STAGE_ORDER[currentStageIndex + 1])}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000"
                style={{ width: `${((currentStageIndex + 1) / STAGE_ORDER.length) * 100}%` }}
              />

              {/* Stages */}
              <div className="relative flex justify-between">
                {STAGE_ORDER.map((stage, index) => {
                  const isCompleted = index < currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  const stageData = cycle.stages[stage];

                  return (
                    <div key={stage} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-3 transition-all ${
                          isCompleted || isCurrent
                            ? 'bg-green-500/20 border-green-500'
                            : 'bg-white/5 border-white/20'
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
                        {stageData?.startDate && (
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
              <h3 className="text-lg text-white mb-4">{t('operations.cycle.currentMetrics')}</h3>
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
                    <span className="text-xs text-white/60">{t('operations.cycle.ec')}</span>
                  </div>
                  <div className="text-2xl text-white">
                    {latestLog.environment.ec?.toFixed(1) || '--'}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-white/60">{t('operations.cycle.waterT')}</span>
                  </div>
                  <div className="text-2xl text-white">
                    {latestLog.environment.waterTemp?.toFixed(1) || '--'}°C
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-white/60">{t('operations.cycle.plantHealth')}</span>
                  </div>
                  <div className={`text-lg capitalize ${
                    latestLog.plantHealth === 'excellent' ? 'text-green-400' :
                    latestLog.plantHealth === 'good' ? 'text-green-300' :
                    latestLog.plantHealth === 'fair' ? 'text-yellow-400' :
                    latestLog.plantHealth === 'poor' ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {t(`plantHealth.${latestLog.plantHealth}`) !== `plantHealth.${latestLog.plantHealth}` ? t(`plantHealth.${latestLog.plantHealth}`) : latestLog.plantHealth}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white">{t('operations.cycle.dailyLogs')} ({dailyLogs.length})</h3>
              {photos.length > 0 && (
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {photos.length} {t('operations.cycle.photosTotal')}
                </span>
              )}
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
                {dailyLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-white font-medium mb-1">
                          {formatDate(log.timestamp)}
                        </div>
                        <div className="text-sm text-white/60">
                          {formatRelativeTime(log.timestamp)} • {t('common.day')} {getDaysSince(cycle.seedDate) - getDaysSince(log.timestamp) + getDaysSince(cycle.seedDate)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditLog(log)}
                          className="p-2 text-white/40 hover:text-white transition-colors"
                          title={t('operations.cycle.editLog')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setLogToDelete(log)}
                          className="p-2 text-white/40 hover:text-red-400 transition-colors"
                          title={t('operations.cycle.deleteLog')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className={`px-3 py-1 rounded-full text-xs capitalize ${
                        log.plantHealth === 'excellent' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        log.plantHealth === 'good' ? 'bg-green-500/10 text-green-300 border border-green-500/20' :
                        log.plantHealth === 'fair' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        log.plantHealth === 'poor' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {t(`plantHealth.${log.plantHealth}`) !== `plantHealth.${log.plantHealth}` ? t(`plantHealth.${log.plantHealth}`) : log.plantHealth}
                        </div>
                      </div>
                    </div>

                    {log.observations && (
                      <p className="text-white/80 mb-4">{log.observations}</p>
                    )}

                    {/* Metrics */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                      {log.environment.temperature && (
                        <div className="text-xs">
                          <div className="text-white/40 mb-1">{t('operations.cycle.temp')}</div>
                          <div className="text-white">{log.environment.temperature}°C</div>
                        </div>
                      )}
                      {log.environment.humidity && (
                        <div className="text-xs">
                          <div className="text-white/40 mb-1">{t('operations.cycle.humidity')}</div>
                          <div className="text-white">{log.environment.humidity}%</div>
                        </div>
                      )}
                      {log.environment.ph && (
                        <div className="text-xs">
                          <div className="text-white/40 mb-1">{t('operations.cycle.ph')}</div>
                          <div className="text-white">{log.environment.ph}</div>
                        </div>
                      )}
                      {log.environment.ec && (
                        <div className="text-xs">
                          <div className="text-white/40 mb-1">{t('operations.cycle.ec')}</div>
                          <div className="text-white">{log.environment.ec}</div>
                        </div>
                      )}
                      {log.environment.waterTemp && (
                        <div className="text-xs">
                          <div className="text-white/40 mb-1">{t('operations.cycle.waterT')}</div>
                          <div className="text-white">{log.environment.waterTemp}°C</div>
                        </div>
                      )}
                      {log.environment.lightLevel && (
                        <div className="text-xs">
                          <div className="text-white/40 mb-1">{t('operations.cycle.light')}</div>
                          <div className="text-white">{log.environment.lightLevel}</div>
                        </div>
                      )}
                    </div>

                    {/* Tasks */}
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

                    {/* Issues */}
                    {log.issues.length > 0 && (
                      <div>
                        <div className="text-xs text-white/40 mb-2">{t('operations.cycle.issues')}</div>
                        <div className="space-y-2">
                          {log.issues.map((issue, i) => (
                            <div key={i} className={`text-sm p-2 rounded-lg ${
                              issue.severity === 'high' ? 'bg-red-500/10 text-red-300' :
                              issue.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-300' :
                              'bg-white/5 text-white/70'
                            }`}>
                              <span className="uppercase text-xs mr-2">{t(`severity.${issue.severity}`) !== `severity.${issue.severity}` ? t(`severity.${issue.severity}`) : issue.severity}</span>
                              {issue.description}
                              {issue.resolved && (
                                <span className="text-green-400 ml-2">{t('operations.cycle.resolved')}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Log Photos */}
                    {(() => {
                      const logPhotos = photos.filter(p => p.dailyLogId === log.id);
                      if (logPhotos.length === 0) return null;
                      return (
                        <div className={`${log.issues.length > 0 || log.tasksPerformed.length > 0 ? 'mt-4 pt-4 border-t border-white/10' : ''}`}>
                          <div className="text-xs text-white/40 mb-2 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {logPhotos.length} {logPhotos.length > 1 ? t('operations.cycle.photos') : t('operations.cycle.photo')}
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Add Log Button (mobile) */}
      <div className="fixed bottom-24 right-6 sm:hidden z-[90]">
        <button
          onClick={handleOpenAddLog}
          className="w-14 h-14 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full flex items-center justify-center shadow-lg transition-all"
        >
          <Plus className="w-6 h-6 text-green-400" />
        </button>
      </div>

      <EditGrowCycleModal
        isOpen={showEditCycleModal}
        cycle={cycle}
        onClose={() => setShowEditCycleModal(false)}
        onSuccess={loadCycleData}
      />

      {system && (
        <DailyLogEntryModal
          isOpen={showLogModal}
          growCycleId={cycleId}
          systemId={system.id}
          existingLog={editingLog}
          onClose={() => {
            setShowLogModal(false);
            setEditingLog(null);
          }}
          onSuccess={() => loadCycleData()}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDeleteCycle}
        title={t('operations.cycle.deleteCycleTitle')}
        description={t('operations.cycle.deleteCycleBody', {
          name: cycle?.name ?? '',
          logs: dailyLogs.length,
          photos: photos.length,
        })}
        confirmLabel={t('operations.cycle.deleteCycleConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={deleting}
        onConfirm={handleDeleteCycle}
        onCancel={() => setConfirmDeleteCycle(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(logToDelete)}
        title={t('operations.cycle.deleteLogTitle')}
        description={t('operations.cycle.deleteLogBody', {
          date: logToDelete ? formatDate(logToDelete.timestamp) : '',
        })}
        confirmLabel={t('operations.cycle.deleteLogConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={deleting}
        onConfirm={handleDeleteLog}
        onCancel={() => setLogToDelete(null)}
      />

      {/* Record Harvest Modal */}
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
    </div>
  );
}
