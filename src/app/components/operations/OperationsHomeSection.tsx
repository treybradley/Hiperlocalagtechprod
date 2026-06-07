import { useEffect, useState } from 'react';
import { Plus, Leaf, TrendingUp, Activity } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { HydroponicSystem } from '../../../storage/models';
import { getAllSystems } from '../../../storage/operations/systems';
import { formatRelativeTime } from '../../../storage/utils/dateHelpers';

interface OperationsHomeSectionProps {
  onCreateSystem: () => void;
  onViewSystem: (systemId: string) => void;
}

export function OperationsHomeSection({ onCreateSystem, onViewSystem }: OperationsHomeSectionProps) {
  const { t } = useLanguage();
  const [systems, setSystems] = useState<HydroponicSystem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystems();
  }, []);

  async function loadSystems() {
    try {
      const allSystems = await getAllSystems();
      setSystems(allSystems);
    } catch (error) {
      console.error('Failed to load systems:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate quick stats
  const totalRevenue = systems.reduce((sum, sys) => sum + (sys.results?.totalRevenue || 0), 0);
  const activeCycles = systems.filter(sys => sys.activeCycleId).length;
  const totalHarvest = systems.reduce((sum, sys) => sum + (sys.results?.totalHarvestKg || 0), 0);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      {/* Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-24">
        <div className="flex flex-col h-full gap-6 overflow-y-auto pl-[0px] pr-[16px] pt-[21px] pb-[96px]">

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-white tracking-tight text-[32px]">
                Your Systems
              </h1>
              {systems.length > 0 && (
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-white/60 text-sm">Revenue: </span>
                    <span className="text-white font-medium">${totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    <span className="text-white/60 text-sm">Active Cycles: </span>
                    <span className="text-white font-medium">{activeCycles}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-400" />
                    <span className="text-white/60 text-sm">Total Harvest: </span>
                    <span className="text-white font-medium">{totalHarvest.toFixed(1)} kg</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onCreateSystem}
              className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-lg transition-all duration-300 group hover:scale-105 px-[18px] py-[9px]"
            >
              <Plus className="w-5 h-5 text-green-400 shrink-0" />
              <span className="text-white hidden sm:inline text-[12px]">Create New System</span>
            </button>
          </div>

          {/* Empty State */}
          {!loading && systems.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-12 h-12 mx-auto mb-6 bg-green-500/10 rounded-md flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-green-400/50" />
                </div>
                <h2 className="text-2xl text-white mb-3">Create Your First System</h2>
                <p className="text-white/60 mb-6 leading-relaxed">
                  Start tracking your hydroponic operations. Build a system, log daily observations,
                  and watch your insights grow with every harvest.
                </p>
                <button
                  onClick={onCreateSystem}
                  className="inline-flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-md transition-all duration-300 hover:scale-105 px-[18px] py-[9px]"
                >
                  <Plus className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium text-[12px]">Get Started</span>
                </button>
              </div>
            </div>
          )}

          {/* Systems Grid */}
          {!loading && systems.length > 0 && (
            <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {systems.map((system) => (
                <div
                  key={system.id}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                  onClick={() => onViewSystem(system.id)}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs ${
                      system.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : system.status === 'maintenance'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-white/10 text-white/60 border border-white/20'
                    }`}>
                      {system.status}
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/70 border border-white/10">
                      {system.systemType.toUpperCase()}
                    </div>
                  </div>

                  {/* System Name */}
                  <h3 className="text-xl text-white mb-2 group-hover:text-green-400 transition-colors">
                    {system.name}
                  </h3>
                  <p className="text-sm text-white/60 mb-4">{system.location}</p>

                  {/* Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Total Cycles</span>
                      <span className="text-white">{system.totalCycles}</span>
                    </div>
                    {system.results && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">ROI</span>
                          <span className="text-green-400">{system.results.roi.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/50">Revenue</span>
                          <span className="text-white">${system.results.totalRevenue.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    {system.hypothesis && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <span className="text-xs text-white/40">Testing hypothesis</span>
                        <div className="mt-1 text-sm text-white/70 line-clamp-2">{system.hypothesis}</div>
                      </div>
                    )}
                  </div>

                  {/* Updated */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                    <span>Updated {formatRelativeTime(system.updatedAt)}</span>
                    <span className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-white/60">Loading systems...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
