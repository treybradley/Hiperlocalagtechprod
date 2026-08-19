import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { updateGrowCycle, deleteGrowCycle } from '../../../../storage/operations/growCycles';
import { GrowCycle } from '../../../../storage/models';
import { parseLocalDateString, toLocalDateInputValue } from '../../../../storage/utils/dateHelpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { OPS_FORM_DATE, OPS_FORM_INPUT, OPS_SELECT_CONTENT, OPS_SELECT_ITEM, OPS_SELECT_TRIGGER } from '../opsFormClasses';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ConfirmDialog } from './ConfirmDialog';

interface EditGrowCycleModalProps {
  isOpen: boolean;
  cycle: GrowCycle | null;
  derivedStageLabel: string;
  logCount: number;
  photoCount: number;
  onClose: () => void;
  onSuccess: () => void;
  onDeleted?: () => void;
}

const CROP_OPTIONS = [
  { value: 'basil-genovese', label: 'Genovese Basil' },
  { value: 'basil-thai', label: 'Thai Basil' },
  { value: 'lettuce-butterhead', label: 'Butterhead Lettuce' },
  { value: 'lettuce-romaine', label: 'Romaine Lettuce' },
  { value: 'arugula', label: 'Arugula' },
  { value: 'cilantro', label: 'Cilantro' },
  { value: 'mint', label: 'Mint' },
  { value: 'parsley', label: 'Parsley' },
  { value: 'kale', label: 'Kale' },
  { value: 'spinach', label: 'Spinach' },
  { value: 'chard', label: 'Swiss Chard' },
  { value: 'microgreens-sunflower', label: 'Sunflower Microgreens' },
  { value: 'microgreens-radish', label: 'Radish Microgreens' },
  { value: 'microgreens-pea', label: 'Pea Shoots' },
];

const STATUS_OPTIONS: GrowCycle['status'][] = ['planning', 'active', 'completed', 'failed'];

export function EditGrowCycleModal({
  isOpen,
  cycle,
  derivedStageLabel,
  logCount,
  photoCount,
  onClose,
  onSuccess,
  onDeleted,
}: EditGrowCycleModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('');
  const [seedDate, setSeedDate] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [initialPlantCount, setInitialPlantCount] = useState('');
  const [currentPlantCount, setCurrentPlantCount] = useState('');
  const [status, setStatus] = useState<GrowCycle['status']>('active');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!cycle || !isOpen) return;
    setName(cycle.name);
    setCropType(cycle.cropType);
    setSeedDate(toLocalDateInputValue(cycle.seedDate));
    setHarvestDate(cycle.harvestDate ? toLocalDateInputValue(cycle.harvestDate) : '');
    setInitialPlantCount(String(cycle.initialPlantCount));
    setCurrentPlantCount(String(cycle.currentPlantCount));
    setStatus(cycle.status);
  }, [cycle, isOpen]);

  if (!isOpen || !cycle) return null;

  const canSave = name && cropType && seedDate && initialPlantCount && currentPlantCount;

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      await updateGrowCycle(cycle.id, {
        name,
        cropType,
        seedDate: parseLocalDateString(seedDate),
        harvestDate: harvestDate ? parseLocalDateString(harvestDate) : undefined,
        initialPlantCount: parseInt(initialPlantCount),
        currentPlantCount: parseInt(currentPlantCount),
        status,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update grow cycle:', error);
      alert(t('operations.editCycle.failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGrowCycle(cycle.id);
      setConfirmDelete(false);
      onClose();
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete grow cycle:', error);
      alert(t('operations.cycle.failedDeleteCycle'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative bg-[#0a0a0a] border border-white/20 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl text-white">{t('operations.editCycle.title')}</h2>
              <p className="text-sm text-white/60 mt-1">{t('operations.editCycle.subtitle')}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto hiper-scroll max-h-[calc(90vh-220px)] space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">{t('operations.createCycle.cycleName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={OPS_FORM_INPUT}
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{t('operations.createCycle.cropType')}</label>
              <Select value={cropType || undefined} onValueChange={setCropType}>
                <SelectTrigger className={OPS_SELECT_TRIGGER}>
                  <SelectValue placeholder={t('operations.createCycle.selectCrop')} />
                </SelectTrigger>
                <SelectContent className={OPS_SELECT_CONTENT} collisionPadding={16}>
                  {CROP_OPTIONS.map((crop) => (
                    <SelectItem key={crop.value} value={crop.value} className={OPS_SELECT_ITEM}>
                      {crop.label}
                    </SelectItem>
                  ))}
                  {!CROP_OPTIONS.some((c) => c.value === cropType) && cropType && (
                    <SelectItem value={cropType} className={OPS_SELECT_ITEM}>{cropType}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">{t('operations.createCycle.seedDate')}</label>
                <input
                  type="date"
                  value={seedDate}
                  onChange={(e) => setSeedDate(e.target.value)}
                  className={OPS_FORM_DATE}
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">{t('operations.editCycle.harvestDate')}</label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className={OPS_FORM_DATE}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">{t('operations.createCycle.initialPlantCount')}</label>
                <input
                  type="number"
                  value={initialPlantCount}
                  onChange={(e) => setInitialPlantCount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">{t('operations.editCycle.currentPlantCount')}</label>
                <input
                  type="number"
                  value={currentPlantCount}
                  onChange={(e) => setCurrentPlantCount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{t('operations.editCycle.currentStage')}</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-green-400">
                {derivedStageLabel}
              </div>
              <p className="text-xs text-white/40 mt-2">{t('operations.editCycle.stageFromLogs')}</p>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">{t('operations.editCycle.status')}</label>
              <Select
                value={status}
                onValueChange={v => setStatus(v as GrowCycle['status'])}
              >
                <SelectTrigger className={OPS_SELECT_TRIGGER}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={OPS_SELECT_CONTENT} collisionPadding={16} side="top">
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className={`${OPS_SELECT_ITEM} capitalize`}>
                      {t(`status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t('operations.cycle.delete')}
            </button>
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className={`bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-full px-6 py-3 text-white transition-all ${
                  !canSave || saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? t('operations.editCycle.saving') : t('operations.editCycle.save')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title={t('operations.cycle.deleteCycleTitle')}
        description={t('operations.cycle.deleteCycleBody', {
          name: cycle.name,
          logs: logCount,
          photos: photoCount,
        })}
        confirmLabel={t('operations.cycle.deleteCycleConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
