import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Pencil } from 'lucide-react';
import type { StartupCostCategory, StartupCostItem } from '../../../storage/operations/financialPlans';
import {
  STARTUP_COST_CATEGORY_LABELS,
  computeStartupTotal,
  createStartupCostItem,
  fmtCurrency,
} from '../../utils/financialPlanHelpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { OPS_FORM_INPUT_SM, OPS_SELECT_CONTENT, OPS_SELECT_ITEM, OPS_SELECT_TRIGGER_SM } from './opsFormClasses';

const STARTUP_CATEGORIES = Object.keys(STARTUP_COST_CATEGORY_LABELS) as StartupCostCategory[];

interface StartupCostsEditorProps {
  items: StartupCostItem[];
  onChange: (items: StartupCostItem[]) => void;
}

function emptyFormState() {
  return {
    name: '',
    category: 'structure' as StartupCostCategory,
    cost: '',
    quantity: '1',
    vendor: '',
    purchaseLink: '',
  };
}

export function StartupCostsEditor({ items, onChange }: StartupCostsEditorProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyFormState);

  const total = computeStartupTotal(items);

  function resetForm() {
    setForm(emptyFormState());
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(item: StartupCostItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      cost: String(item.cost),
      quantity: String(item.quantity),
      vendor: item.vendor ?? '',
      purchaseLink: item.purchaseLink ?? '',
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.cost) return;

    const item = createStartupCostItem({
      id: editingId ?? undefined,
      name: form.name.trim(),
      category: form.category,
      cost: parseFloat(form.cost) || 0,
      quantity: parseInt(form.quantity, 10) || 1,
      vendor: form.vendor.trim() || undefined,
      purchaseLink: form.purchaseLink.trim() || undefined,
    });

    onChange(
      editingId
        ? items.map(existing => (existing.id === editingId ? item : existing))
        : [...items, item]
    );
    resetForm();
  }

  function handleRemove(id: string) {
    onChange(items.filter(item => item.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-white/50">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        <button
          type="button"
          onClick={() => {
            if (showForm && !editingId) {
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Item name"
              className={OPS_FORM_INPUT_SM}
            />
            <Select
              value={form.category}
              onValueChange={v => setForm(prev => ({ ...prev, category: v as StartupCostCategory }))}
            >
              <SelectTrigger className={OPS_SELECT_TRIGGER_SM}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={OPS_SELECT_CONTENT} collisionPadding={16}>
                {STARTUP_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat} className={OPS_SELECT_ITEM}>
                    {STARTUP_COST_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={form.cost}
              onChange={e => setForm(prev => ({ ...prev, cost: e.target.value }))}
              placeholder="Unit cost (USD)"
              min={0}
              className={OPS_FORM_INPUT_SM}
            />
            <input
              type="number"
              value={form.quantity}
              onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="Qty"
              min={1}
              className={OPS_FORM_INPUT_SM}
            />
          </div>
          <input
            type="text"
            value={form.vendor}
            onChange={e => setForm(prev => ({ ...prev, vendor: e.target.value }))}
            placeholder="Vendor (optional)"
            className={`w-full ${OPS_FORM_INPUT_SM}`}
          />
          <input
            type="url"
            value={form.purchaseLink}
            onChange={e => setForm(prev => ({ ...prev, purchaseLink: e.target.value }))}
            placeholder="Purchase link (optional)"
            className={`w-full ${OPS_FORM_INPUT_SM}`}
          />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={!form.name.trim() || !form.cost}
              className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-white transition-all disabled:opacity-50"
            >
              {editingId ? 'Save changes' : 'Add item'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length > 0 ? (
        <div className="space-y-2 max-h-72 overflow-y-auto hiper-scroll pr-0.5">
          {items.map(item => {
            const lineTotal = item.cost * item.quantity;
            return (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white truncate">{item.name}</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {STARTUP_COST_CATEGORY_LABELS[item.category]}
                      {item.vendor ? ` · ${item.vendor}` : ''}
                    </div>
                    {item.purchaseLink && (
                      <a
                        href={item.purchaseLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-amber-400/90 hover:text-amber-300 inline-flex items-center gap-1 mt-1"
                        onClick={e => e.stopPropagation()}
                      >
                        View link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm text-white font-medium">${fmtCurrency(lineTotal)}</div>
                    <div className="text-[10px] text-white/40">
                      ${fmtCurrency(item.cost)} × {item.quantity}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-white/40 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="text-white/40 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-4 text-center">
          <p className="text-xs text-white/40">No startup costs added yet</p>
        </div>
      )}

      <div className="flex justify-between text-sm pt-1 border-t border-amber-500/20">
        <span className="text-white/50">Total startup capital</span>
        <span className="text-white font-medium">${fmtCurrency(total)}</span>
      </div>
    </div>
  );
}
