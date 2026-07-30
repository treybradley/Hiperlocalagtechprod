import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { createDailyLog, updateDailyLog } from '../../../../storage/operations/dailyLogs';
import {
  createPhoto,
  deletePhoto,
  getPhotoDisplayUrl,
  getPhotosByDailyLog,
} from '../../../../storage/operations/photos';
import { DailyLog, Photo } from '../../../../storage/models';
import { formatBytes } from '../../../../storage/utils/imageCompression';
import {
  parseLocalDateString,
  toLocalDateInputValue,
  todayLocalDateInputValue,
} from '../../../../storage/utils/dateHelpers';
import { OPS_FORM_DATE, OPS_SELECT_CONTENT, OPS_SELECT_ITEM, OPS_SELECT_TRIGGER_SM } from '../opsFormClasses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface DailyLogEntryModalProps {
  isOpen: boolean;
  growCycleId: string;
  systemId: string;
  existingLog?: DailyLog | null;
  onClose: () => void;
  onSuccess: (log: DailyLog) => void;
}

type PlantHealth = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
type IssueSeverity = 'low' | 'medium' | 'high';

export function DailyLogEntryModal({
  isOpen,
  growCycleId,
  systemId,
  existingLog,
  onClose,
  onSuccess,
}: DailyLogEntryModalProps) {
  const isEditing = Boolean(existingLog);
  const [logDate, setLogDate] = useState(todayLocalDateInputValue());
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [ph, setPh] = useState('');
  const [ec, setEc] = useState('');
  const [waterTemp, setWaterTemp] = useState('');
  const [lightLevel, setLightLevel] = useState('');
  const [plantHealth, setPlantHealth] = useState<PlantHealth>('good');
  const [observations, setObservations] = useState('');
  const [visualChanges, setVisualChanges] = useState('');
  const [experimentNotes, setExperimentNotes] = useState('');
  const [waterAdded, setWaterAdded] = useState('');
  const [nutrientsAdded, setNutrientsAdded] = useState('');

  const [tasks, setTasks] = useState<Array<{ task: string }>>([]);
  const [issues, setIssues] = useState<Array<{ severity: IssueSeverity; description: string; resolved: boolean }>>([]);

  const [photos, setPhotos] = useState<Array<{ file: File; preview: string; caption: string }>>([]);
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [removedExistingPhotoIds, setRemovedExistingPhotoIds] = useState<Set<string>>(new Set());
  const [loadingExistingPhotos, setLoadingExistingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);

  const visibleExistingPhotos = existingPhotos.filter((p) => !removedExistingPhotoIds.has(p.id));
  const totalPhotoCount = visibleExistingPhotos.length + photos.length;

  useEffect(() => {
    if (!isOpen) return;
    if (existingLog) {
      setLogDate(toLocalDateInputValue(existingLog.timestamp));
      setTemperature(existingLog.environment.temperature?.toString() ?? '');
      setHumidity(existingLog.environment.humidity?.toString() ?? '');
      setPh(existingLog.environment.ph?.toString() ?? '');
      setEc(existingLog.environment.ec?.toString() ?? '');
      setWaterTemp(existingLog.environment.waterTemp?.toString() ?? '');
      setLightLevel(existingLog.environment.lightLevel?.toString() ?? '');
      setPlantHealth(existingLog.plantHealth);
      setObservations(existingLog.observations);
      setVisualChanges(existingLog.visualChanges ?? '');
      setExperimentNotes(existingLog.experimentNotes ?? '');
      setWaterAdded(existingLog.waterAdded?.toString() ?? '');
      setNutrientsAdded(existingLog.nutrientsAdded ?? '');
      setTasks(existingLog.tasksPerformed.map((t) => ({ task: t.task })));
      setIssues(existingLog.issues.map((i) => ({
        severity: i.severity,
        description: i.description,
        resolved: i.resolved,
      })));
      setPhotos([]);
      setRemovedExistingPhotoIds(new Set());
      setLoadingExistingPhotos(true);
      getPhotosByDailyLog(existingLog.id)
        .then(setExistingPhotos)
        .catch(() => setExistingPhotos([]))
        .finally(() => setLoadingExistingPhotos(false));
    } else {
      setExistingPhotos([]);
      setRemovedExistingPhotoIds(new Set());
      setLogDate(todayLocalDateInputValue());
      setTemperature('');
      setHumidity('');
      setPh('');
      setEc('');
      setWaterTemp('');
      setLightLevel('');
      setPlantHealth('good');
      setObservations('');
      setVisualChanges('');
      setExperimentNotes('');
      setWaterAdded('');
      setNutrientsAdded('');
      setTasks([]);
      setIssues([]);
      setPhotos([]);
    }
  }, [isOpen, existingLog?.id]);

  if (!isOpen) return null;

  const addTask = () => {
    setTasks([...tasks, { task: '' }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, value: string) => {
    const updated = [...tasks];
    updated[index].task = value;
    setTasks(updated);
  };

  const addIssue = () => {
    setIssues([...issues, { severity: 'medium', description: '', resolved: false }]);
  };

  const removeIssue = (index: number) => {
    setIssues(issues.filter((_, i) => i !== index));
  };

  const updateIssue = (index: number, updates: Partial<typeof issues[0]>) => {
    const updated = [...issues];
    updated[index] = { ...updated[index], ...updates };
    setIssues(updated);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const slotsLeft = 5 - visibleExistingPhotos.length - photos.length;
    if (slotsLeft <= 0) return;
    const newPhotos = Array.from(files).slice(0, slotsLeft);
    const photoPromises = newPhotos.map((file) => {
      return new Promise<{ file: File; preview: string; caption: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            file,
            preview: reader.result as string,
            caption: '',
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(photoPromises).then((newPhotoData) => {
      setPhotos([...photos, ...newPhotoData]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    const updated = [...photos];
    updated[index].caption = caption;
    setPhotos(updated);
  };

  const removeExistingPhoto = (photoId: string) => {
    setRemovedExistingPhotoIds((prev) => new Set([...prev, photoId]));
  };

  const canSave = observations.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const logTimestamp = parseLocalDateString(logDate);
      const payload = {
        timestamp: logTimestamp,
        environment: {
          temperature: temperature ? parseFloat(temperature) : undefined,
          humidity: humidity ? parseFloat(humidity) : undefined,
          ph: ph ? parseFloat(ph) : undefined,
          ec: ec ? parseFloat(ec) : undefined,
          waterTemp: waterTemp ? parseFloat(waterTemp) : undefined,
          lightLevel: lightLevel ? parseFloat(lightLevel) : undefined,
        },
        plantHealth,
        observations,
        visualChanges: visualChanges || undefined,
        tasksPerformed: tasks
          .filter(t => t.task.trim())
          .map(t => ({ task: t.task, timestamp: logTimestamp })),
        issues: issues.filter(i => i.description.trim()),
        waterAdded: waterAdded ? parseFloat(waterAdded) : undefined,
        nutrientsAdded: nutrientsAdded || undefined,
        experimentNotes: experimentNotes || undefined,
      };

      if (isEditing && existingLog) {
        for (const photoId of removedExistingPhotoIds) {
          await deletePhoto(photoId);
        }

        let photoIds = existingLog.photoIds.filter((id) => !removedExistingPhotoIds.has(id));
        for (const photoData of photos) {
          const photo = await createPhoto(
            {
              systemId,
              growCycleId,
              dailyLogId: existingLog.id,
              timestamp: logTimestamp,
              caption: photoData.caption || undefined,
              tags: [],
            },
            photoData.file
          );
          photoIds.push(photo.id);
        }

        await updateDailyLog(existingLog.id, { ...payload, photoIds });
        onSuccess({ ...existingLog, ...payload, photoIds });
      } else {
        const log = await createDailyLog({
          growCycleId,
          systemId,
          ...payload,
          photoIds: [],
        });

        const photoIds: string[] = [];
        for (const photoData of photos) {
          const photo = await createPhoto(
            {
              systemId,
              growCycleId,
              dailyLogId: log.id,
              timestamp: logTimestamp,
              caption: photoData.caption || undefined,
              tags: [],
            },
            photoData.file
          );
          photoIds.push(photo.id);
        }

        if (photoIds.length > 0) {
          await updateDailyLog(log.id, { photoIds });
        }

        onSuccess({ ...log, photoIds });
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to save daily log:', error);
      alert(`Failed to ${isEditing ? 'update' : 'create'} log. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setLogDate(todayLocalDateInputValue());
    setTemperature('');
    setHumidity('');
    setPh('');
    setEc('');
    setWaterTemp('');
    setLightLevel('');
    setPlantHealth('good');
    setObservations('');
    setVisualChanges('');
    setExperimentNotes('');
    setWaterAdded('');
    setNutrientsAdded('');
    setTasks([]);
    setIssues([]);
    setPhotos([]);
    setExistingPhotos([]);
    setRemovedExistingPhotoIds(new Set());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative bg-[#0a0a0a] border border-white/20 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-[18px] border-b border-white/10">
          <div>
            <h2 className="text-lg text-white">{isEditing ? 'Edit Daily Log' : 'Add Daily Log'}</h2>
            <p className="text-sm text-white/60 mt-1">
              {isEditing ? 'Update observations and metrics' : "Record today's observations and metrics"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-[18px] overflow-y-auto hiper-scroll max-h-[calc(90vh-180px)] space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Log Date</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className={OPS_FORM_DATE}
            />
          </div>

          {/* Environmental Metrics */}
          <div>
            <h3 className="text-white mb-3">Environmental Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-2">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="24.5"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-2">Humidity (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  placeholder="65"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-2">pH</label>
                <input
                  type="number"
                  step="0.1"
                  value={ph}
                  onChange={(e) => setPh(e.target.value)}
                  placeholder="6.0"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-2">EC (mS/cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ec}
                  onChange={(e) => setEc(e.target.value)}
                  placeholder="1.5"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-2">Water Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={waterTemp}
                  onChange={(e) => setWaterTemp(e.target.value)}
                  placeholder="22.0"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-2">Light Level (PPFD)</label>
                <input
                  type="number"
                  value={lightLevel}
                  onChange={(e) => setLightLevel(e.target.value)}
                  placeholder="400"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>
          </div>

          {/* Plant Health */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Plant Health</label>
            <div className="flex gap-2">
              {(['excellent', 'good', 'fair', 'poor', 'critical'] as PlantHealth[]).map((health) => (
                <button
                  key={health}
                  onClick={() => setPlantHealth(health)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm capitalize transition-all ${
                    plantHealth === health
                      ? health === 'excellent' ? 'bg-green-500/30 text-green-300 border-2 border-green-500' :
                        health === 'good' ? 'bg-green-500/20 text-green-300 border-2 border-green-500/70' :
                        health === 'fair' ? 'bg-yellow-500/30 text-yellow-300 border-2 border-yellow-500' :
                        health === 'poor' ? 'bg-orange-500/30 text-orange-300 border-2 border-orange-500' :
                        'bg-red-500/30 text-red-300 border-2 border-red-500'
                      : 'bg-white/5 text-white/60 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  {health}
                </button>
              ))}
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Observations *</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="What did you notice today? Growth patterns, leaf color, root development..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 resize-none"
            />
          </div>

          {/* Visual Changes */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Visual Changes (Optional)</label>
            <textarea
              value={visualChanges}
              onChange={(e) => setVisualChanges(e.target.value)}
              placeholder="Specific visual observations: leaf size, color changes, new growth..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 resize-none"
            />
          </div>

          {/* Resource Usage */}
          <div>
            <h3 className="text-white mb-3">Resource Usage</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-2">Water Added (L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={waterAdded}
                  onChange={(e) => setWaterAdded(e.target.value)}
                  placeholder="5.0"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-2">Nutrients Added</label>
                <input
                  type="text"
                  value={nutrientsAdded}
                  onChange={(e) => setNutrientsAdded(e.target.value)}
                  placeholder="10ml CalMag, 15ml Bloom"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>
          </div>

          {/* Tasks Performed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white">Tasks Performed</h3>
              <button
                onClick={addTask}
                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={task.task}
                    onChange={(e) => updateTask(index, e.target.value)}
                    placeholder="e.g., Adjusted pH to 6.0"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                  <button
                    onClick={() => removeTask(index)}
                    className="text-white/40 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white">Issues</h3>
              <button
                onClick={addIssue}
                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
              >
                <Plus className="w-4 h-4" />
                Add Issue
              </button>
            </div>
            <div className="space-y-3">
              {issues.map((issue, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <Select
                      value={issue.severity}
                      onValueChange={v => updateIssue(index, { severity: v as IssueSeverity })}
                    >
                      <SelectTrigger className={`w-[110px] shrink-0 ${OPS_SELECT_TRIGGER_SM}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={OPS_SELECT_CONTENT} collisionPadding={16}>
                        <SelectItem value="low" className={OPS_SELECT_ITEM}>Low</SelectItem>
                        <SelectItem value="medium" className={OPS_SELECT_ITEM}>Medium</SelectItem>
                        <SelectItem value="high" className={OPS_SELECT_ITEM}>High</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      type="text"
                      value={issue.description}
                      onChange={(e) => updateIssue(index, { description: e.target.value })}
                      placeholder="Describe the issue..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                    />
                    <button
                      onClick={() => removeIssue(index)}
                      className="text-white/40 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={issue.resolved}
                      onChange={(e) => updateIssue(index, { resolved: e.target.checked })}
                      className="rounded"
                    />
                    Resolved
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Experiment Notes */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Experiment Notes (Optional)</label>
            <textarea
              value={experimentNotes}
              onChange={(e) => setExperimentNotes(e.target.value)}
              placeholder="Notes specific to hypothesis being tested..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white">Photos (0-5)</h3>
                <p className="text-xs text-white/40 mt-1">
                  {totalPhotoCount}/5 photos
                  {photos.length > 0 && (
                    <> • {formatBytes(photos.reduce((sum, p) => sum + p.file.size, 0))} new</>
                  )}
                </p>
              </div>
              {totalPhotoCount < 5 && (
                <label className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {loadingExistingPhotos && isEditing && (
              <p className="text-sm text-white/40 mb-3">Loading saved photos...</p>
            )}

            {(visibleExistingPhotos.length > 0 || photos.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visibleExistingPhotos.map((photo) => (
                  <div key={photo.id} className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    {getPhotoDisplayUrl(photo) ? (
                      <img
                        src={getPhotoDisplayUrl(photo)}
                        alt={photo.caption || 'Saved photo'}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-white/5 text-white/30 text-xs">
                        No preview
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(photo.id)}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 rounded-full p-1 transition-colors"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="p-2">
                      {photo.caption && (
                        <p className="text-xs text-white/70 truncate">{photo.caption}</p>
                      )}
                      <div className="text-xs text-white/40 mt-1">Saved</div>
                    </div>
                  </div>
                ))}
                {photos.map((photo, index) => (
                  <div key={`new-${index}`} className="relative bg-white/5 border border-green-500/20 rounded-xl overflow-hidden">
                    <img
                      src={photo.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 rounded-full p-1 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="p-2">
                      <input
                        type="text"
                        value={photo.caption}
                        onChange={(e) => updatePhotoCaption(index, e.target.value)}
                        placeholder="Caption (optional)"
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                      />
                      <div className="text-xs text-green-400/70 mt-1">
                        New • {formatBytes(photo.file.size)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPhotoCount === 0 && !loadingExistingPhotos && (
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">
                <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40 mb-3">No photos added yet</p>
                <label className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm text-white cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  Choose Photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={handleClose}
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`flex items-center gap-2 text-xs text-white bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full px-[18px] py-3 transition-all ${
              !canSave || saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Log'}
          </button>
        </div>
      </div>
    </div>
  );
}
