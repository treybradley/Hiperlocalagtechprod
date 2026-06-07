import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { createSystem } from '../../../../storage/operations/systems';
import { HydroponicSystem } from '../../../../storage/models';

interface CreateSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (system: HydroponicSystem) => void;
}

type SystemType = 'nft' | 'dwc' | 'ebb-flow' | 'drip' | 'aeroponics';
type EquipmentCategory = 'lighting' | 'pumps' | 'nutrients' | 'seeds' | 'structure' | 'sensors' | 'other';
type RecurringCostCategory = 'utilities' | 'nutrients' | 'maintenance' | 'labor' | 'other';

export function CreateSystemModal({ isOpen, onClose, onSuccess }: CreateSystemModalProps) {
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
      alert('Failed to create system. Please try again.');
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
            <h2 className="text-2xl text-white">Create New System</h2>
            <p className="text-sm text-white/60 mt-1">Step {step} of 3</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Basic Configuration */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">System Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Rooftop NFT System A"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">System Type *</label>
                <select
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value as SystemType)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50"
                >
                  <option value="nft">NFT (Nutrient Film Technique)</option>
                  <option value="dwc">DWC (Deep Water Culture)</option>
                  <option value="ebb-flow">Ebb & Flow</option>
                  <option value="drip">Drip System</option>
                  <option value="aeroponics">Aeroponics</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Length (m) *</label>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="2.5"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Width (m) *</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="1.2"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Height (m) *</label>
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
                  <label className="block text-sm text-white/70 mb-2">Channels *</label>
                  <input
                    type="number"
                    value={channels}
                    onChange={(e) => setChannels(e.target.value)}
                    placeholder="4"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Plants per Channel *</label>
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
                  <span className="text-sm text-white/70">Total Capacity: </span>
                  <span className="text-lg text-green-400 font-medium">
                    {parseInt(channels) * parseInt(plantsPerChannel)} plants
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm text-white/70 mb-2">Location *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Rooftop North, Tulum"
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
                  Hypothesis (Optional)
                </label>
                <p className="text-xs text-white/50 mb-2">What are you testing with this system?</p>
                <textarea
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  placeholder="e.g., NFT with 40% blue LED spectrum will increase basil yield by 20%"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-white/70">Variables</label>
                  <button
                    onClick={addVariable}
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                  >
                    <Plus className="w-4 h-4" />
                    Add Variable
                  </button>
                </div>
                {variables.map((v, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => updateVariable(index, 'name', e.target.value)}
                      placeholder="Variable name"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                    />
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) => updateVariable(index, 'value', e.target.value)}
                      placeholder="Your value"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                    />
                    <input
                      type="text"
                      value={v.controlValue}
                      onChange={(e) => updateVariable(index, 'controlValue', e.target.value)}
                      placeholder="Control value"
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
                  <label className="block text-sm text-white/70 mb-2">Control Description</label>
                  <input
                    type="text"
                    value={controlDescription}
                    onChange={(e) => setControlDescription(e.target.value)}
                    placeholder="What you're comparing against"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Control Source</label>
                  <input
                    type="text"
                    value={controlSource}
                    onChange={(e) => setControlSource(e.target.value)}
                    placeholder="e.g., Industry standard"
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
                  <label className="block text-sm text-white/70">Equipment</label>
                  <button
                    onClick={addEquipment}
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
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
                          placeholder="Item name"
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                        />
                        <select
                          value={item.category}
                          onChange={(e) => updateEquipment(item.id, { category: e.target.value as EquipmentCategory })}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                        >
                          <option value="lighting">Lighting</option>
                          <option value="pumps">Pumps</option>
                          <option value="nutrients">Nutrients</option>
                          <option value="seeds">Seeds</option>
                          <option value="structure">Structure</option>
                          <option value="sensors">Sensors</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={item.cost || ''}
                          onChange={(e) => updateEquipment(item.id, { cost: parseFloat(e.target.value) || 0 })}
                          placeholder="Cost (USD)"
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                        />
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => updateEquipment(item.id, { quantity: parseInt(e.target.value) || 1 })}
                          placeholder="Qty"
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
                        placeholder="Purchase link (optional)"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recurring Costs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm text-white/70">Recurring Costs</label>
                  <button
                    onClick={addRecurringCost}
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                  >
                    <Plus className="w-4 h-4" />
                    Add Cost
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
                          placeholder="Cost name"
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                        />
                        <select
                          value={cost.category}
                          onChange={(e) => updateRecurringCost(cost.id, { category: e.target.value as RecurringCostCategory })}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                        >
                          <option value="utilities">Utilities</option>
                          <option value="nutrients">Nutrients</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="labor">Labor</option>
                          <option value="other">Other</option>
                        </select>
                        <input
                          type="number"
                          value={cost.amount || ''}
                          onChange={(e) => updateRecurringCost(cost.id, { amount: parseFloat(e.target.value) || 0 })}
                          placeholder="Amount"
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
                        />
                        <div className="flex gap-2">
                          <select
                            value={cost.frequency}
                            onChange={(e) => updateRecurringCost(cost.id, { frequency: e.target.value as 'monthly' | 'yearly' })}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
                          >
                            <option value="monthly">/ mo</option>
                            <option value="yearly">/ yr</option>
                          </select>
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
                  <span className="text-sm text-white/70">Total Capital Cost</span>
                  <span className="text-lg text-white font-medium">${totalCapitalCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Monthly Operating Cost</span>
                  <span className="text-lg text-green-400 font-medium">${monthlyOperatingCost.toFixed(2)} / mo</span>
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
            {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canProceedStep1}
              className={`flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full px-6 py-3 transition-all ${
                step === 1 && !canProceedStep1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Next
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
              {saving ? 'Creating...' : 'Create System'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
