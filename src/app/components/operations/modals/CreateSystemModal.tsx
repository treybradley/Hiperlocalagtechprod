import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { createSystem } from '../../../../storage/operations/systems';
import { HydroponicSystem } from '../../../../storage/models';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import {
  SYSTEM_TYPES,
  type SystemType,
} from '../../../data/crops';
import { OPS_SELECT_CONTENT, OPS_SELECT_ITEM, OPS_SELECT_TRIGGER, OPS_SELECT_TRIGGER_SM } from '../opsFormClasses';
import { useLanguage } from '../../../contexts/LanguageContext';

interface CreateSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (system: HydroponicSystem) => void;
}

type EquipmentCategory = 'lighting' | 'pumps' | 'nutrients' | 'seeds' | 'structure' | 'sensors' | 'other';
type RecurringCostCategory = 'utilities' | 'nutrients' | 'maintenance' | 'labor' | 'other';

export function CreateSystemModal({ isOpen, onClose, onSuccess }: CreateSystemModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Basic Configuration
  const [name, setName] = useState('');
  const [systemType, setSystemType] = useState<SystemType>('nft');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [channels, setChannels] = useState('');
  const [plantsPerChannel, setPlantsPerChannel] = useState('');
  const [location, setLocation] = useState('');

  // Step 2: Hypothesis & Variables
  const [hypothesis, setHypothesis] = useState('');
  const [variables, setVariables] = useState<Array<{ name: string; value: string; controlValue: string }>>([]);
  const [controlDescription, setControlDescription] = useState('');
  const [controlSource, setControlSource] = useState('');

  // Step 3: Operating Costs
  const [equipment, setEquipment] = useState<Array<{
    id: string;
    name: string;
    category: EquipmentCategory;
    cost: number;
    quantity: number;
    vendor: string;
    purchaseLink: string;
  }>>([]);
  const [recurringCosts, setRecurringCosts] = useState<Array<{
    id: string;
    name: string;
    category: RecurringCostCategory;
    amount: number;
    frequency: 'monthly' | 'yearly';
  }>>([]);

  if (!isOpen) return null;

  const addVariable = () => {
    setVariables([...variables, { name: '', value: '', controlValue: '' }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: 'name' | 'value' | 'controlValue', value: string) => {
    const updated = [...variables];
    updated[index][field] = value;
    setVariables(updated);
  };

  const addEquipment = () => {
    setEquipment([...equipment, {
      id: crypto.randomUUID(),
      name: '',
      category: 'lighting',
      cost: 0,
      quantity: 1,
      vendor: '',
      purchaseLink: '',
    }]);
  };

  const removeEquipment = (id: string) => {
    setEquipment(equipment.filter(e => e.id !== id));
  };

  const updateEquipment = (id: string, updates: Partial<typeof equipment[0]>) => {
    setEquipment(equipment.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addRecurringCost = () => {
    setRecurringCosts([...recurringCosts, {
      id: crypto.randomUUID(),
      name: '',
      category: 'utilities',
      amount: 0,
      frequency: 'monthly',
    }]);
  };

  const removeRecurringCost = (id: string) => {
    setRecurringCosts(recurringCosts.filter(c => c.id !== id));
  };

  const updateRecurringCost = (id: string, updates: Partial<typeof recurringCosts[0]>) => {
    setRecurringCosts(recurringCosts.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const totalCapitalCost = equipment.reduce((sum, e) => sum + (e.cost * e.quantity), 0);
  const monthlyOperatingCost = recurringCosts.reduce((sum, c) => {
    const monthlyAmount = c.frequency === 'monthly' ? c.amount : c.amount / 12;
    return sum + monthlyAmount;
  }, 0);

  const canProceedStep1 = name && systemType && length && width && height && channels && plantsPerChannel && location;
  const canProceedStep2 = true; // Optional step
  const canSave = canProceedStep1;

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const system = await createSystem({
        name,
        systemType,
        dimensions: {
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
        },
        capacity: {
          channels: parseInt(channels),
          plantsPerChannel: parseInt(plantsPerChannel),
          totalPlants: parseInt(channels) * parseInt(plantsPerChannel),
        },
        location,
        status: 'active',
        hypothesis: hypothesis || undefined,
        variables: variables.filter(v => v.name && v.value),
        controlSetup: controlDescription && controlSource ? {
          description: controlDescription,
          source: controlSource,
        } : undefined,
        operatingCosts: {
          equipment,
          recurringCosts,
          totalCapitalCost,
          monthlyOperatingCost,
        },
      });

      onSuccess(system);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create system:', error);
      alert(t('operations.createSystem.failed'));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setName('');
    setSystemType('nft');
    setLength('');
    setWidth('');
    setHeight('');
    setChannels('');
    setPlantsPerChannel('');
    setLocation('');
    setHypothesis('');
    setVariables([]);
    setControlDescription('');
    setControlSource('');
    setEquipment([]);
    setRecurringCosts([]);
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
            <h2 className="text-2xl text-white">{t('operations.createSystem.title')}</h2>
            <p className="text-sm text-white/60 mt-1">{t('operations.createSystem.stepOf', { n: step })}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                s <= step ? 'bg-green-500' : 'bg-white/10'
              } ${s < 3 ? 'mr-2' : ''}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto hiper-scroll max-h-[calc(90vh-200px)]">
          {/* Step 1: Basic Configuration */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">{t('operations.createSystem.systemName')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('operations.createSystem.systemNamePh')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">{t('operations.createSystem.systemType')}</label>
                <Select value={systemType} onValueChange={v => setSystemType(v as SystemType)}>
                  <SelectTrigger className={OPS_SELECT_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={OPS_SELECT_CONTENT} collisionPadding={16}>
                    {SYSTEM_TYPES.map(st => (
                      <SelectItem key={st} value={st} className={OPS_SELECT_ITEM}>
                        {t(`systemTypesFull.${st}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">{t('operations.createSystem.length')}</label>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="2.5"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">{t('operations.createSystem.width')}</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="1.2"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">{t('operations.createSystem.height')}</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="0.8"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">{t('operations.createSystem.units')}</label>
                  <p className="text-xs text-white/40 mb-2">{t('operations.createSystem.unitsHint')}</p>
                  <input
                    type="number"
                    value={channels}
                    onChange={(e) => setChannels(e.target.value)}
                    placeholder="4"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">{t('operations.createSystem.plantsPerUnit')}</label>
                  <p className="text-xs text-white/40 mb-2">{t('operations.createSystem.plantsPerUnitHint')}</p>
                  <input
                    type="number"
                    value={plantsPerChannel}
                    onChange={(e) => setPlantsPerChannel(e.target.value)}
                    placeholder="10"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </div>

              {channels && plantsPerChannel && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <span className="text-sm text-white/70">{t('operations.createSystem.totalCapacity')} </span>
                  <span className="text-lg text-green-400 font-medium">
                    {parseInt(channels) * parseInt(plantsPerChannel)} {t('common.plants')}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm text-white/70 mb-2">{t('operations.createSystem.location')}</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('operations.createSystem.locationPh')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>
          )}

          {/* Step 2: Hypothesis & Variables */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  {t('operations.createSystem.hypothesisOptional')}
                </label>
                <p className="text-xs text-white/50 mb-2">{t('operations.createSystem.hypothesisHint')}</p>
                <textarea
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  placeholder={t('operations.createSystem.hypothesisPh')}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-white/70">{t('operations.createSystem.variables')}</label>
                  <button
                    onClick={addVariable}
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                  >
                    <Plus className="w-4 h-4" />
                    {t('operations.createSystem.addVariable')}
                  </button>
                </div>
                {variables.map((v, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => updateVariable(index, 'name', e.target.value)}
                      placeholder={t('operations.createSystem.variableName')}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                    />
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => updateVariable(index, 'value', e.target.value)}
                      placeholder={t('operations.createSystem.yourValue')}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                    />
                    <input
                      type="text"
                      value={v.controlValue}
                      onChange={(e) => updateVariable(index, 'controlValue', e.target.value)}
                      placeholder={t('operations.createSystem.controlValue')}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                    />
                    <button
                      onClick={() => removeVariable(index)}
                      className="text-white/40 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">{t('operations.createSystem.controlDescription')}</label>
                  <input
                    type="text"
                    value={controlDescription}
                    onChange={(e) => setControlDescription(e.target.value)}
                    placeholder={t('operations.createSystem.controlDescHint')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">{t('operations.createSystem.controlSource')}</label>
                  <input
                    type="text"
                    value={controlSource}
                    onChange={(e) => setControlSource(e.target.value)}
                    placeholder={t('operations.createSystem.controlSourcePh')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Operating Costs */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Equipment */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-white/70">{t('operations.createSystem.equipment')}</label>
                  <button
                    onClick={addEquipment}
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                  >
                    <Plus className="w-4 h-4" />
                    {t('operations.createSystem.addItem')}
                  </button>
                </div>
                <div className="space-y-2">
                  {equipment.map((item) => (
                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateEquipment(item.id, { name: e.target.value })}
                          placeholder={t('operations.costs.itemName')}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                        />
                        <Select
                          value={item.category}
                          onValueChange={v => updateEquipment(item.id, { category: v as EquipmentCategory })}
                        >
                          <SelectTrigger className={OPS_SELECT_TRIGGER_SM}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={OPS_SELECT_CONTENT} collisionPadding={16}>
                            <SelectItem value="lighting" className={OPS_SELECT_ITEM}>{t('equipmentCategory.lighting')}</SelectItem>
                            <SelectItem value="pumps" className={OPS_SELECT_ITEM}>{t('equipmentCategory.pumps')}</SelectItem>
                            <SelectItem value="nutrients" className={OPS_SELECT_ITEM}>{t('equipmentCategory.nutrients')}</SelectItem>
                            <SelectItem value="seeds" className={OPS_SELECT_ITEM}>{t('equipmentCategory.seeds')}</SelectItem>
                            <SelectItem value="structure" className={OPS_SELECT_ITEM}>{t('equipmentCategory.structure')}</SelectItem>
                            <SelectItem value="sensors" className={OPS_SELECT_ITEM}>{t('equipmentCategory.sensors')}</SelectItem>
                            <SelectItem value="other" className={OPS_SELECT_ITEM}>{t('equipmentCategory.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={item.cost || ''}
                          onChange={(e) => updateEquipment(item.id, { cost: parseFloat(e.target.value) || 0 })}
                          placeholder={t('operations.costs.costUsd')}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                        />
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => updateEquipment(item.id, { quantity: parseInt(e.target.value) || 1 })}
                          placeholder={t('operations.costs.qty')}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                        />
                        <button
                          onClick={() => removeEquipment(item.id)}
                          className="text-white/40 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.purchaseLink}
                        onChange={(e) => updateEquipment(item.id, { purchaseLink: e.target.value })}
                        placeholder={t('operations.costs.purchaseLink')}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recurring Costs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-white/70">{t('operations.createSystem.recurringCosts')}</label>
                  <button
                    onClick={addRecurringCost}
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                  >
                    <Plus className="w-4 h-4" />
                    {t('operations.createSystem.addCost')}
                  </button>
                </div>
                <div className="space-y-2">
                  {recurringCosts.map((cost) => (
                    <div key={cost.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="grid grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={cost.name}
                          onChange={(e) => updateRecurringCost(cost.id, { name: e.target.value })}
                          placeholder={t('operations.costs.costName')}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                        />
                        <Select
                          value={cost.category}
                          onValueChange={v => updateRecurringCost(cost.id, { category: v as RecurringCostCategory })}
                        >
                          <SelectTrigger className={OPS_SELECT_TRIGGER_SM}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={OPS_SELECT_CONTENT} collisionPadding={16}>
                            <SelectItem value="utilities" className={OPS_SELECT_ITEM}>{t('recurringCategory.utilities')}</SelectItem>
                            <SelectItem value="nutrients" className={OPS_SELECT_ITEM}>{t('recurringCategory.nutrients')}</SelectItem>
                            <SelectItem value="maintenance" className={OPS_SELECT_ITEM}>{t('recurringCategory.maintenance')}</SelectItem>
                            <SelectItem value="labor" className={OPS_SELECT_ITEM}>{t('recurringCategory.labor')}</SelectItem>
                            <SelectItem value="other" className={OPS_SELECT_ITEM}>{t('recurringCategory.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <input
                          type="number"
                          value={cost.amount || ''}
                          onChange={(e) => updateRecurringCost(cost.id, { amount: parseFloat(e.target.value) || 0 })}
                          placeholder={t('operations.costs.amount')}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                        />
                        <div className="flex gap-2">
                          <Select
                            value={cost.frequency}
                            onValueChange={v => updateRecurringCost(cost.id, { frequency: v as 'monthly' | 'yearly' })}
                          >
                            <SelectTrigger className={`flex-1 ${OPS_SELECT_TRIGGER_SM}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={OPS_SELECT_CONTENT} collisionPadding={16} side="top">
                              <SelectItem value="monthly" className={OPS_SELECT_ITEM}>{t('common.perMo')}</SelectItem>
                              <SelectItem value="yearly" className={OPS_SELECT_ITEM}>{t('common.perYr')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            onClick={() => removeRecurringCost(cost.id)}
                            className="text-white/40 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">{t('operations.createSystem.totalCapital')}</span>
                  <span className="text-lg text-white font-medium">${totalCapitalCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">{t('operations.createSystem.monthlyOperating')}</span>
                  <span className="text-lg text-green-400 font-medium">${monthlyOperatingCost.toFixed(2)} {t('common.perMo')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step > 1 ? t('common.back') : t('common.cancel')}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canProceedStep1}
              className={`flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full px-6 py-3 transition-all ${
                step === 1 && !canProceedStep1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {t('common.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className={`flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full px-6 py-3 transition-all ${
                !canSave || saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? t('operations.createSystem.creating') : t('operations.createSystem.create')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
