import { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { GrowCycle, HydroponicSystem } from '../../../../storage/models';
import { completeGrowCycle } from '../../../../storage/operations/growCycles';
import { updateSystem } from '../../../../storage/operations/systems';
import { getDaysSince } from '../../../../storage/utils/dateHelpers';

interface RecordHarvestModalProps {
  isOpen: boolean;
  cycle: GrowCycle;
  system: HydroponicSystem;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordHarvestModal({
  isOpen,
  cycle,
  system,
  onClose,
  onSuccess,
}: RecordHarvestModalProps) {
  const [harvestWeight, setHarvestWeight] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [qualityNotes, setQualityNotes] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const harvestKg = parseFloat(harvestWeight) || 0;
  const price = parseFloat(pricePerKg) || 0;
  const revenue = harvestKg * price;

  // Calculate cycle duration
  const cycleDuration = getDaysSince(cycle.seedDate);

  // Estimate cycle cost (monthly operating cost * duration in months)
  const cycleCost = system.operatingCosts.monthlyOperatingCost * (cycleDuration / 30);

  // Calculate profit margin
  const profit = revenue - cycleCost;
  const profitMargin = revenue > 0 ? profit / revenue : 0;

  // Calculate yield per plant
  const yieldPerPlant = cycle.currentPlantCount > 0 ? harvestKg / cycle.currentPlantCount : 0;

  const canSave = harvestWeight && pricePerKg && lessonsLearned.trim();

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      // Complete the grow cycle with results
      await completeGrowCycle(cycle.id, {
        success: true,
        yieldPerPlant,
        cycleDuration,
        totalCost: cycleCost,
        profitMargin,
        lessonsLearned,
      });

      // Update cycle with harvest data
      await import('../../../../storage/operations/growCycles').then(({ updateGrowCycle }) => {
        updateGrowCycle(cycle.id, {
          totalHarvestKg: harvestKg,
          harvestRevenue: revenue,
        });
      });

      // Update system results
      const completedCyclesCount = system.results?.cyclesCompleted || 0;
      const previousHarvest = system.results?.totalHarvestKg || 0;
      const previousRevenue = system.results?.totalRevenue || 0;
      const previousAvgDuration = system.results?.avgCycleDuration || 0;

      const newTotalHarvest = previousHarvest + harvestKg;
      const newTotalRevenue = previousRevenue + revenue;
      const newCyclesCompleted = completedCyclesCount + 1;
      const newAvgDuration = ((previousAvgDuration * completedCyclesCount) + cycleDuration) / newCyclesCompleted;

      // Calculate new ROI
      const totalCost = system.operatingCosts.totalCapitalCost +
        (system.operatingCosts.monthlyOperatingCost * (newAvgDuration / 30) * newCyclesCompleted);
      const roi = totalCost > 0 ? ((newTotalRevenue - totalCost) / totalCost) * 100 : 0;

      // Calculate success rate (all cycles / total cycles)
      const allCyclesCount = system.totalCycles;
      const successRate = (newCyclesCompleted / allCyclesCount) * 100;

      await updateSystem(system.id, {
        results: {
          totalHarvestKg: newTotalHarvest,
          totalRevenue: newTotalRevenue,
          roi,
          cyclesCompleted: newCyclesCompleted,
          avgCycleDuration: newAvgDuration,
          successRate,
          keyFindings: system.results?.keyFindings || 'Results accumulating...',
          wouldRecommend: system.results?.wouldRecommend !== undefined ? system.results.wouldRecommend : true,
        },
      });

      onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to record harvest:', error);
      alert('Failed to record harvest. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setHarvestWeight('');
    setPricePerKg('');
    setQualityNotes('');
    setLessonsLearned('');
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
            <h2 className="text-2xl text-white">Record Harvest</h2>
            <p className="text-sm text-white/60 mt-1">{cycle.name} • {cycle.cropType}</p>
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
          {/* Harvest Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Harvest Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                value={harvestWeight}
                onChange={(e) => setHarvestWeight(e.target.value)}
                placeholder="10.5"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Price per kg (USD) *</label>
              <input
                type="number"
                step="0.01"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                placeholder="25.00"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
              />
            </div>
          </div>

          {/* Calculated Metrics */}
          {harvestKg > 0 && price > 0 && (
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-white/70">Calculated Metrics</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-white/40 mb-1">Revenue</div>
                  <div className="text-lg text-white">${revenue.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Cycle Cost</div>
                  <div className="text-lg text-white">${cycleCost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Profit</div>
                  <div className={`text-lg ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${profit.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Profit Margin</div>
                  <div className={`text-lg ${profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(profitMargin * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Yield/Plant</div>
                  <div className="text-lg text-white">{yieldPerPlant.toFixed(2)} kg</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Duration</div>
                  <div className="text-lg text-white">{cycleDuration} days</div>
                </div>
              </div>
            </div>
          )}

          {/* Quality Notes */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Quality Assessment (Optional)</label>
            <textarea
              value={qualityNotes}
              onChange={(e) => setQualityNotes(e.target.value)}
              placeholder="Overall quality, size, color, taste..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 resize-none"
            />
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Lessons Learned *</label>
            <textarea
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="What worked well? What would you do differently? Key takeaways..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 resize-none"
            />
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-white/70">
              <strong className="text-white">Note:</strong> Recording harvest will mark this cycle as completed
              and update your system's performance metrics and ROI calculations.
            </p>
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
            {saving ? 'Recording...' : 'Record Harvest'}
          </button>
        </div>
      </div>
    </div>
  );
}
