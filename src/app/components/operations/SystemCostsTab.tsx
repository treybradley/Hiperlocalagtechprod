import { useState } from 'react';
import { Plus, Trash2, ExternalLink, DollarSign, Calendar } from 'lucide-react';
import { HydroponicSystem } from '../../../storage/models';
import { updateSystem } from '../../../storage/operations/systems';

interface SystemCostsTabProps {
  system: HydroponicSystem;
  onUpdate: () => void;
}

type EquipmentCategory = 'lighting' | 'pumps' | 'nutrients' | 'seeds' | 'structure' | 'sensors' | 'other';
type RecurringCategory = 'utilities' | 'nutrients' | 'maintenance' | 'labor' | 'other';

export function SystemCostsTab({ system, onUpdate }: SystemCostsTabProps) {
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);

  // Equipment form state
  const [equipName, setEquipName] = useState('');
  const [equipCategory, setEquipCategory] = useState<EquipmentCategory>('lighting');
  const [equipCost, setEquipCost] = useState('');
  const [equipQuantity, setEquipQuantity] = useState('1');
  const [equipVendor, setEquipVendor] = useState('');
  const [equipLink, setEquipLink] = useState('');

  // Recurring cost form state
  const [recurringName, setRecurringName] = useState('');
  const [recurringCategory, setRecurringCategory] = useState<RecurringCategory>('utilities');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState<'monthly' | 'yearly'>('monthly');

  const handleAddEquipment = async () => {
    if (!equipName || !equipCost) return;

    const newEquipment = {
      id: crypto.randomUUID(),
      name: equipName,
      category: equipCategory,
      cost: parseFloat(equipCost),
      quantity: parseInt(equipQuantity) || 1,
      vendor: equipVendor || undefined,
      purchaseLink: equipLink || undefined,
      purchaseDate: Date.now(),
    };

    const updatedEquipment = [...system.operatingCosts.equipment, newEquipment];
    const totalCapital = updatedEquipment.reduce((sum, e) => sum + (e.cost * e.quantity), 0);

    await updateSystem(system.id, {
      operatingCosts: {
        ...system.operatingCosts,
        equipment: updatedEquipment,
        totalCapitalCost: totalCapital,
      },
    });

    // Reset form
    setEquipName('');
    setEquipCategory('lighting');
    setEquipCost('');
    setEquipQuantity('1');
    setEquipVendor('');
    setEquipLink('');
    setShowAddEquipment(false);
    onUpdate();
  };

  const handleRemoveEquipment = async (equipmentId: string) => {
    const updatedEquipment = system.operatingCosts.equipment.filter(e => e.id !== equipmentId);
    const totalCapital = updatedEquipment.reduce((sum, e) => sum + (e.cost * e.quantity), 0);

    await updateSystem(system.id, {
      operatingCosts: {
        ...system.operatingCosts,
        equipment: updatedEquipment,
        totalCapitalCost: totalCapital,
      },
    });

    onUpdate();
  };

  const handleAddRecurring = async () => {
    if (!recurringName || !recurringAmount) return;

    const newCost = {
      id: crypto.randomUUID(),
      name: recurringName,
      category: recurringCategory,
      amount: parseFloat(recurringAmount),
      frequency: recurringFrequency,
    };

    const updatedRecurring = [...system.operatingCosts.recurringCosts, newCost];
    const monthlyTotal = updatedRecurring.reduce((sum, c) => {
      const monthlyAmount = c.frequency === 'monthly' ? c.amount : c.amount / 12;
      return sum + monthlyAmount;
    }, 0);

    await updateSystem(system.id, {
      operatingCosts: {
        ...system.operatingCosts,
        recurringCosts: updatedRecurring,
        monthlyOperatingCost: monthlyTotal,
      },
    });

    // Reset form
    setRecurringName('');
    setRecurringCategory('utilities');
    setRecurringAmount('');
    setRecurringFrequency('monthly');
    setShowAddRecurring(false);
    onUpdate();
  };

  const handleRemoveRecurring = async (costId: string) => {
    const updatedRecurring = system.operatingCosts.recurringCosts.filter(c => c.id !== costId);
    const monthlyTotal = updatedRecurring.reduce((sum, c) => {
      const monthlyAmount = c.frequency === 'monthly' ? c.amount : c.amount / 12;
      return sum + monthlyAmount;
    }, 0);

    await updateSystem(system.id, {
      operatingCosts: {
        ...system.operatingCosts,
        recurringCosts: updatedRecurring,
        monthlyOperatingCost: monthlyTotal,
      },
    });

    onUpdate();
  };

  // Calculate category totals for equipment
  const equipmentByCategory = system.operatingCosts.equipment.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) acc[category] = 0;
    acc[category] += item.cost * item.quantity;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-sm text-white/60">Total Capital Cost</span>
          </div>
          <div className="text-3xl text-white font-medium">
            ${system.operatingCosts.totalCapitalCost.toLocaleString()}
          </div>
          <div className="text-xs text-white/40 mt-1">
            {system.operatingCosts.equipment.length} equipment items
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-white/60">Monthly Operating Cost</span>
          </div>
          <div className="text-3xl text-white font-medium">
            ${system.operatingCosts.monthlyOperatingCost.toFixed(2)}
          </div>
          <div className="text-xs text-white/40 mt-1">
            {system.operatingCosts.recurringCosts.length} recurring costs
          </div>
        </div>
      </div>

      {/* Equipment */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl text-white">Equipment</h3>
          <button
            onClick={() => setShowAddEquipment(!showAddEquipment)}
            className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Equipment
          </button>
        </div>

        {/* Add Equipment Form */}
        {showAddEquipment && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={equipName}
                onChange={(e) => setEquipName(e.target.value)}
                placeholder="Item name"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
              <select
                value={equipCategory}
                onChange={(e) => setEquipCategory(e.target.value as EquipmentCategory)}
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
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                value={equipCost}
                onChange={(e) => setEquipCost(e.target.value)}
                placeholder="Cost (USD)"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
              <input
                type="number"
                value={equipQuantity}
                onChange={(e) => setEquipQuantity(e.target.value)}
                placeholder="Quantity"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
              <input
                type="text"
                value={equipVendor}
                onChange={(e) => setEquipVendor(e.target.value)}
                placeholder="Vendor"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
            </div>
            <input
              type="text"
              value={equipLink}
              onChange={(e) => setEquipLink(e.target.value)}
              placeholder="Purchase link (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddEquipment}
                disabled={!equipName || !equipCost}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white transition-all disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddEquipment(false)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Equipment Table */}
        {system.operatingCosts.equipment.length > 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left text-xs text-white/60 font-medium px-4 py-3">Item</th>
                  <th className="text-left text-xs text-white/60 font-medium px-4 py-3">Category</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">Cost</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">Qty</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">Total</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {system.operatingCosts.equipment.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{item.name}</div>
                      {item.vendor && (
                        <div className="text-xs text-white/40">{item.vendor}</div>
                      )}
                      {item.purchaseLink && (
                        <a
                          href={item.purchaseLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-400 hover:text-green-300 inline-flex items-center gap-1 mt-1"
                        >
                          View Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/60 capitalize">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white">
                      ${item.cost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white font-medium">
                      ${(item.cost * item.quantity).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveEquipment(item.id)}
                        className="text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-white/60">No equipment added yet</p>
          </div>
        )}
      </div>

      {/* Recurring Costs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl text-white">Recurring Costs</h3>
          <button
            onClick={() => setShowAddRecurring(!showAddRecurring)}
            className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Cost
          </button>
        </div>

        {/* Add Recurring Form */}
        {showAddRecurring && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={recurringName}
                onChange={(e) => setRecurringName(e.target.value)}
                placeholder="Cost name"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
              <select
                value={recurringCategory}
                onChange={(e) => setRecurringCategory(e.target.value as RecurringCategory)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
              >
                <option value="utilities">Utilities</option>
                <option value="nutrients">Nutrients</option>
                <option value="maintenance">Maintenance</option>
                <option value="labor">Labor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={recurringAmount}
                onChange={(e) => setRecurringAmount(e.target.value)}
                placeholder="Amount (USD)"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
              <select
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value as 'monthly' | 'yearly')}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/50"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddRecurring}
                disabled={!recurringName || !recurringAmount}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white transition-all disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddRecurring(false)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Recurring Costs Table */}
        {system.operatingCosts.recurringCosts.length > 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left text-xs text-white/60 font-medium px-4 py-3">Cost</th>
                  <th className="text-left text-xs text-white/60 font-medium px-4 py-3">Category</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">Amount</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">Frequency</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">Monthly</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {system.operatingCosts.recurringCosts.map((cost) => (
                  <tr key={cost.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{cost.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/60 capitalize">{cost.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white">
                      ${cost.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-white/60 capitalize">{cost.frequency}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white font-medium">
                      ${(cost.frequency === 'monthly' ? cost.amount : cost.amount / 12).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveRecurring(cost.id)}
                        className="text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-white/60">No recurring costs added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
