import { useState } from 'react';
import { Plus, Trash2, ExternalLink, DollarSign, Calendar, Pencil } from 'lucide-react';
import { HydroponicSystem } from '../../../storage/models';
import { updateSystem } from '../../../storage/operations/systems';
import { ConfirmDialog } from './modals/ConfirmDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { OPS_SELECT_CONTENT, OPS_SELECT_ITEM, OPS_SELECT_TRIGGER_SM } from './opsFormClasses';
import { useLanguage } from '../../contexts/LanguageContext';

interface SystemCostsTabProps {
  system: HydroponicSystem;
  onUpdate: () => void;
}

type EquipmentCategory = 'lighting' | 'pumps' | 'nutrients' | 'seeds' | 'structure' | 'sensors' | 'other';
type RecurringCategory = 'utilities' | 'nutrients' | 'maintenance' | 'labor' | 'other';

export function SystemCostsTab({ system, onUpdate }: SystemCostsTabProps) {
  const { t } = useLanguage();
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);
  const [pendingDeleteEquipmentId, setPendingDeleteEquipmentId] = useState<string | null>(null);
  const [pendingDeleteRecurringId, setPendingDeleteRecurringId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const resetEquipmentForm = () => {
    setEquipName('');
    setEquipCategory('lighting');
    setEquipCost('');
    setEquipQuantity('1');
    setEquipVendor('');
    setEquipLink('');
    setEditingEquipmentId(null);
    setShowAddEquipment(false);
  };

  const startEditEquipment = (item: typeof system.operatingCosts.equipment[0]) => {
    setEditingEquipmentId(item.id);
    setEquipName(item.name);
    setEquipCategory(item.category);
    setEquipCost(String(item.cost));
    setEquipQuantity(String(item.quantity));
    setEquipVendor(item.vendor ?? '');
    setEquipLink(item.purchaseLink ?? '');
    setShowAddEquipment(true);
  };

  const handleSaveEquipment = async () => {
    if (!equipName || !equipCost) return;

    const equipmentData = {
      id: editingEquipmentId ?? crypto.randomUUID(),
      name: equipName,
      category: equipCategory,
      cost: parseFloat(equipCost),
      quantity: parseInt(equipQuantity) || 1,
      vendor: equipVendor || undefined,
      purchaseLink: equipLink || undefined,
      purchaseDate: editingEquipmentId
        ? system.operatingCosts.equipment.find((e) => e.id === editingEquipmentId)?.purchaseDate ?? Date.now()
        : Date.now(),
    };

    const updatedEquipment = editingEquipmentId
      ? system.operatingCosts.equipment.map((e) => (e.id === editingEquipmentId ? equipmentData : e))
      : [...system.operatingCosts.equipment, equipmentData];
    const totalCapital = updatedEquipment.reduce((sum, e) => sum + (e.cost * e.quantity), 0);

    await updateSystem(system.id, {
      operatingCosts: {
        ...system.operatingCosts,
        equipment: updatedEquipment,
        totalCapitalCost: totalCapital,
      },
    });

    resetEquipmentForm();
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

    setPendingDeleteEquipmentId(null);
    onUpdate();
  };

  const resetRecurringForm = () => {
    setRecurringName('');
    setRecurringCategory('utilities');
    setRecurringAmount('');
    setRecurringFrequency('monthly');
    setEditingRecurringId(null);
    setShowAddRecurring(false);
  };

  const startEditRecurring = (cost: typeof system.operatingCosts.recurringCosts[0]) => {
    setEditingRecurringId(cost.id);
    setRecurringName(cost.name);
    setRecurringCategory(cost.category);
    setRecurringAmount(String(cost.amount));
    setRecurringFrequency(cost.frequency === 'yearly' ? 'yearly' : 'monthly');
    setShowAddRecurring(true);
  };

  const handleSaveRecurring = async () => {
    if (!recurringName || !recurringAmount) return;

    const costData = {
      id: editingRecurringId ?? crypto.randomUUID(),
      name: recurringName,
      category: recurringCategory,
      amount: parseFloat(recurringAmount),
      frequency: recurringFrequency,
    };

    const updatedRecurring = editingRecurringId
      ? system.operatingCosts.recurringCosts.map((c) => (c.id === editingRecurringId ? costData : c))
      : [...system.operatingCosts.recurringCosts, costData];
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

    resetRecurringForm();
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

    setPendingDeleteRecurringId(null);
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
            <span className="text-sm text-white/60">{t('operations.costs.totalCapital')}</span>
          </div>
          <div className="text-3xl text-white font-medium">
            ${system.operatingCosts.totalCapitalCost.toLocaleString()}
          </div>
          <div className="text-xs text-white/40 mt-1">
            {system.operatingCosts.equipment.length} {t('operations.costs.equipmentItems')}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-white/60">{t('operations.costs.monthlyOperating')}</span>
          </div>
          <div className="text-3xl text-white font-medium">
            ${system.operatingCosts.monthlyOperatingCost.toFixed(2)}
          </div>
          <div className="text-xs text-white/40 mt-1">
            {system.operatingCosts.recurringCosts.length} {t('operations.costs.recurringCostsCount')}
          </div>
        </div>
      </div>

      {/* Equipment */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl text-white">{t('operations.costs.equipment')}</h3>
          <button
            onClick={() => {
              if (showAddEquipment && !editingEquipmentId) {
                setShowAddEquipment(false);
              } else {
                resetEquipmentForm();
                setShowAddEquipment(true);
              }
            }}
            className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('operations.costs.addEquipment')}
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
                placeholder={t('operations.costs.itemName')}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
              <Select
                value={equipCategory}
                onValueChange={v => setEquipCategory(v as EquipmentCategory)}
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
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                value={equipCost}
                onChange={(e) => setEquipCost(e.target.value)}
                placeholder={t('operations.costs.costUsd')}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
              <input
                type="number"
                value={equipQuantity}
                onChange={(e) => setEquipQuantity(e.target.value)}
                placeholder={t('operations.costs.quantity')}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
              <input
                type="text"
                value={equipVendor}
                onChange={(e) => setEquipVendor(e.target.value)}
                placeholder={t('operations.costs.vendor')}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
            </div>
            <input
              type="text"
              value={equipLink}
              onChange={(e) => setEquipLink(e.target.value)}
              placeholder={t('operations.costs.purchaseLink')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEquipment}
                disabled={!equipName || !equipCost}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white transition-all disabled:opacity-50"
              >
                {editingEquipmentId ? t('operations.costs.saveChanges') : t('common.add')}
              </button>
              <button
                onClick={resetEquipmentForm}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                {t('common.cancel')}
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
                  <th className="text-left text-xs text-white/60 font-medium px-4 py-3">{t('operations.costs.item')}</th>
                  <th className="text-left text-xs text-white/60 font-medium px-4 py-3">{t('operations.costs.category')}</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">{t('operations.costs.cost')}</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">{t('operations.costs.qty')}</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">{t('operations.costs.total')}</th>
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
                          {t('common.viewLink')} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/60 capitalize">{t(`equipmentCategory.${item.category}`)}</span>
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditEquipment(item)}
                          className="text-white/40 hover:text-white transition-colors"
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPendingDeleteEquipmentId(item.id)}
                          className="text-white/40 hover:text-red-400 transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-white/60">{t('operations.costs.noEquipment')}</p>
          </div>
        )}
      </div>

      {/* Recurring Costs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl text-white">{t('operations.costs.recurringCosts')}</h3>
          <button
            onClick={() => {
              if (showAddRecurring && !editingRecurringId) {
                setShowAddRecurring(false);
              } else {
                resetRecurringForm();
                setShowAddRecurring(true);
              }
            }}
            className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('operations.costs.addCost')}
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
                placeholder={t('operations.costs.costName')}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
              <Select
                value={recurringCategory}
                onValueChange={v => setRecurringCategory(v as RecurringCategory)}
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={recurringAmount}
                onChange={(e) => setRecurringAmount(e.target.value)}
                placeholder={t('operations.costs.amountUsd')}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
              <Select
                value={recurringFrequency}
                onValueChange={v => setRecurringFrequency(v as 'monthly' | 'yearly')}
              >
                <SelectTrigger className={OPS_SELECT_TRIGGER_SM}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={OPS_SELECT_CONTENT} collisionPadding={16} side="top">
                  <SelectItem value="monthly" className={OPS_SELECT_ITEM}>{t('frequency.monthly')}</SelectItem>
                  <SelectItem value="yearly" className={OPS_SELECT_ITEM}>{t('frequency.yearly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveRecurring}
                disabled={!recurringName || !recurringAmount}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg px-4 py-2 text-sm text-white transition-all disabled:opacity-50"
              >
                {editingRecurringId ? t('operations.costs.saveChanges') : t('common.add')}
              </button>
              <button
                onClick={resetRecurringForm}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                {t('common.cancel')}
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
                  <th className="text-left text-xs text-white/60 font-medium px-4 py-3">{t('operations.costs.cost')}</th>
                  <th className="text-left text-xs text-white/60 font-medium px-4 py-3">{t('operations.costs.category')}</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">{t('operations.costs.amount')}</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">{t('operations.costs.frequency')}</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3">{t('operations.costs.monthly')}</th>
                  <th className="text-right text-xs text-white/60 font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {system.operatingCosts.recurringCosts.map((cost) => (
                  <tr key={cost.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{cost.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/60 capitalize">{t(`recurringCategory.${cost.category}`)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white">
                      ${cost.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-white/60 capitalize">{t(`frequency.${cost.frequency}`)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white font-medium">
                      ${(cost.frequency === 'monthly' ? cost.amount : cost.amount / 12).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditRecurring(cost)}
                          className="text-white/40 hover:text-white transition-colors"
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPendingDeleteRecurringId(cost.id)}
                          className="text-white/40 hover:text-red-400 transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-white/60">{t('operations.costs.noRecurring')}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteEquipmentId)}
        title={t('operations.costs.removeEquipmentTitle')}
        description={t('operations.costs.removeEquipmentBody', {
          name: system.operatingCosts.equipment.find((e) => e.id === pendingDeleteEquipmentId)?.name ?? t('operations.costs.item'),
        })}
        confirmLabel={t('common.remove')}
        destructive
        loading={deleting}
        onConfirm={async () => {
          if (!pendingDeleteEquipmentId) return;
          setDeleting(true);
          try {
            await handleRemoveEquipment(pendingDeleteEquipmentId);
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setPendingDeleteEquipmentId(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteRecurringId)}
        title={t('operations.costs.removeRecurringTitle')}
        description={t('operations.costs.removeRecurringBody', {
          name: system.operatingCosts.recurringCosts.find((c) => c.id === pendingDeleteRecurringId)?.name ?? t('operations.costs.cost'),
        })}
        confirmLabel={t('common.remove')}
        destructive
        loading={deleting}
        onConfirm={async () => {
          if (!pendingDeleteRecurringId) return;
          setDeleting(true);
          try {
            await handleRemoveRecurring(pendingDeleteRecurringId);
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setPendingDeleteRecurringId(null)}
      />
    </div>
  );
}
