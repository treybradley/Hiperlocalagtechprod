import { useState } from 'react';
import { X } from 'lucide-react';
import { createGrowCycle } from '../../../../storage/operations/growCycles';
import { createDailyLog } from '../../../../storage/operations/dailyLogs';
import { GrowCycle } from '../../../../storage/models';
import {
  addDays,
  daysBetweenLocalDateStrings,
  parseLocalDateString,
  todayLocalDateInputValue,
  toLocalDateInputValue,
} from '../../../../storage/utils/dateHelpers';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../../ui/select';
import { OPS_FORM_DATE, OPS_FORM_INPUT, OPS_SELECT_CONTENT, OPS_SELECT_ITEM, OPS_SELECT_TRIGGER } from '../opsFormClasses';

interface CreateGrowCycleModalProps {
  isOpen: boolean;
  systemId: string;
  onClose: () => void;
  onSuccess: (cycle: GrowCycle) => void;
}

// Common crops from existing crop database
const CROP_OPTIONS = [
  { value: 'basil-genovese', label: 'Genovese Basil', growthDays: 28 },
  { value: 'basil-thai', label: 'Thai Basil', growthDays: 30 },
  { value: 'lettuce-butterhead', label: 'Butterhead Lettuce', growthDays: 35 },
  { value: 'lettuce-romaine', label: 'Romaine Lettuce', growthDays: 40 },
  { value: 'arugula', label: 'Arugula', growthDays: 25 },
  { value: 'cilantro', label: 'Cilantro', growthDays: 30 },
  { value: 'mint', label: 'Mint', growthDays: 35 },
  { value: 'parsley', label: 'Parsley', growthDays: 40 },
  { value: 'kale', label: 'Kale', growthDays: 50 },
  { value: 'spinach', label: 'Spinach', growthDays: 30 },
  { value: 'chard', label: 'Swiss Chard', growthDays: 35 },
  { value: 'microgreens-sunflower', label: 'Sunflower Microgreens', growthDays: 10 },
  { value: 'microgreens-radish', label: 'Radish Microgreens', growthDays: 8 },
  { value: 'microgreens-pea', label: 'Pea Shoots', growthDays: 12 },
];

export function CreateGrowCycleModal({
  isOpen,
  systemId,
  onClose,
  onSuccess,
}: CreateGrowCycleModalProps) {
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('');
  const [seedDate, setSeedDate] = useState(todayLocalDateInputValue());
  const [initialPlantCount, setInitialPlantCount] = useState('');
  const [targetHarvestDate, setTargetHarvestDate] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleCropSelect = (selectedCrop: string) => {
    setCropType(selectedCrop);

    // Auto-suggest harvest date based on crop growth days
    const crop = CROP_OPTIONS.find(c => c.value === selectedCrop);
    if (crop && seedDate) {
      const seedTimestamp = parseLocalDateString(seedDate);
      setTargetHarvestDate(toLocalDateInputValue(addDays(seedTimestamp, crop.growthDays)));
    }
  };

  const canSave = name && cropType && seedDate && initialPlantCount;

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const seedTimestamp = parseLocalDateString(seedDate);
      const harvestTimestamp = targetHarvestDate
        ? parseLocalDateString(targetHarvestDate)
        : undefined;

      // Create grow cycle
      const cycle = await createGrowCycle({
        systemId,
        name,
        cropType,
        seedDate: seedTimestamp,
        harvestDate: harvestTimestamp,
        stages: {
          germination: { startDate: seedTimestamp },
        },
        currentStage: 'germination',
        initialPlantCount: parseInt(initialPlantCount),
        currentPlantCount: parseInt(initialPlantCount),
        status: 'active',
      });

      // Create initial daily log entry
      await createDailyLog({
        growCycleId: cycle.id,
        systemId,
        timestamp: seedTimestamp,
        environment: {},
        plantHealth: 'good',
        observations: 'Cycle started - seeds planted',
        tasksPerformed: [
          {
            task: 'Seeds planted',
            timestamp: seedTimestamp,
          },
        ],
        issues: [],
        photoIds: [],
      });

      onSuccess(cycle);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create grow cycle:', error);
      alert('Failed to create grow cycle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCropType('');
    setSeedDate(todayLocalDateInputValue());
    setInitialPlantCount('');
    setTargetHarvestDate('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative bg-[#0a0a0a] border border-white/20 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl text-white">Start New Grow Cycle</h2>
            <p className="text-sm text-white/60 mt-1">Begin tracking a new crop cycle</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto hiper-scroll max-h-[calc(90vh-180px)] space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Cycle Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spring 2026 Basil Cycle"
              className={OPS_FORM_INPUT}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Crop Type *</label>
            <Select value={cropType || undefined} onValueChange={handleCropSelect}>
              <SelectTrigger className={OPS_SELECT_TRIGGER}>
                <SelectValue placeholder="Select a crop..." />
              </SelectTrigger>
              <SelectContent className={OPS_SELECT_CONTENT} collisionPadding={16}>
                <SelectGroup>
                  <SelectLabel className="text-white/40">Herbs</SelectLabel>
                  {CROP_OPTIONS.filter(c => c.value.includes('basil') || c.value.includes('cilantro') || c.value.includes('mint') || c.value.includes('parsley')).map(crop => (
                    <SelectItem key={crop.value} value={crop.value} className={OPS_SELECT_ITEM}>
                      {crop.label} (~{crop.growthDays} days)
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-white/40">Leafy Greens</SelectLabel>
                  {CROP_OPTIONS.filter(c => c.value.includes('lettuce') || c.value.includes('arugula') || c.value.includes('kale') || c.value.includes('spinach') || c.value.includes('chard')).map(crop => (
                    <SelectItem key={crop.value} value={crop.value} className={OPS_SELECT_ITEM}>
                      {crop.label} (~{crop.growthDays} days)
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-white/40">Microgreens</SelectLabel>
                  {CROP_OPTIONS.filter(c => c.value.includes('microgreens')).map(crop => (
                    <SelectItem key={crop.value} value={crop.value} className={OPS_SELECT_ITEM}>
                      {crop.label} (~{crop.growthDays} days)
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Seed Date *</label>
              <input
                type="date"
                value={seedDate}
                onChange={(e) => setSeedDate(e.target.value)}
                className={OPS_FORM_DATE}
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Target Harvest Date</label>
              <input
                type="date"
                value={targetHarvestDate}
                onChange={(e) => setTargetHarvestDate(e.target.value)}
                className={OPS_FORM_DATE}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Initial Plant Count *</label>
            <input
              type="number"
              value={initialPlantCount}
              onChange={(e) => setInitialPlantCount(e.target.value)}
              placeholder="e.g., 40"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
            />
          </div>

          {cropType && targetHarvestDate && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="text-sm text-white/70 mb-1">Estimated Cycle Duration</div>
              <div className="text-lg text-green-400">
                {daysBetweenLocalDateStrings(seedDate, targetHarvestDate)} days
              </div>
            </div>
          )}
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
            {saving ? 'Creating...' : 'Start Cycle'}
          </button>
        </div>
      </div>
    </div>
  );
}
