import { useState } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { createDailyLog } from '../../../../storage/operations/dailyLogs';
import { createPhoto } from '../../../../storage/operations/photos';
import { DailyLog } from '../../../../storage/models';
import { formatBytes } from '../../../../storage/utils/imageCompression';

interface DailyLogEntryModalProps {
  isOpen: boolean;
  growCycleId: string;
  systemId: string;
  onClose: () => void;
  onSuccess: (log: DailyLog) => void;
}

type PlantHealth = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
type IssueSeverity = 'low' | 'medium' | 'high';

export function DailyLogEntryModal({
  isOpen,
  growCycleId,
  systemId,
  onClose,
  onSuccess,
}: DailyLogEntryModalProps) {
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
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
  const [saving, setSaving] = useState(false);

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

    const newPhotos = Array.from(files).slice(0, 5 - photos.length);
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

  const canSave = observations.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const logTimestamp = new Date(logDate).getTime();

      // Create daily log first
      const log = await createDailyLog({
        growCycleId,
        systemId,
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
        photoIds: [],
        waterAdded: waterAdded ? parseFloat(waterAdded) : undefined,
        nutrientsAdded: nutrientsAdded || undefined,
        experimentNotes: experimentNotes || undefined,
      });

      // Upload photos and link to log
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

      // Update log with photo IDs if any photos were uploaded
      if (photoIds.length > 0) {
        await import('../../../../storage/operations/dailyLogs').then(({ updateDailyLog }) => {
          updateDailyLog(log.id, { photoIds });
        });
      }

      onSuccess(log);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create daily log:', error);
      alert('Failed to create log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setLogDate(new Date().toISOString().split('T')[0]);
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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative bg-[#0a0a0a] border border-white/20 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl text-white">Add Daily Log</h2>
            <p className="text-sm text-white/60 mt-1">Record today's observations and metrics</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Log Date</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50"
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
                    <select
                      value={issue.severity}
                      onChange={(e) => updateIssue(index, { severity: e.target.value as IssueSeverity })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
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
                  {photos.length}/5 photos • {photos.reduce((sum, p) => sum + p.file.size, 0) > 0
                    ? formatBytes(photos.reduce((sum, p) => sum + p.file.size, 0))
                    : '0 KB'}
                </p>
              </div>
              {photos.length < 5 && (
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

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <img
                      src={photo.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
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
                      <div className="text-xs text-white/40 mt-1">
                        {formatBytes(photo.file.size)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {photos.length === 0 && (
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
            className="text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full px-6 py-3 transition-all ${
              !canSave || saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Save Log'}
          </button>
        </div>
      </div>
    </div>
  );
}
