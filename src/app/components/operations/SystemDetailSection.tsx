import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, TrendingUp, Activity, Calendar, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { HydroponicSystem, GrowCycle } from '../../../storage/models';
import { getSystem } from '../../../storage/operations/systems';
import { getGrowCyclesBySystem } from '../../../storage/operations/growCycles';
import { formatDate, getDaysSince, formatRelativeTime } from '../../../storage/utils/dateHelpers';
import { SystemCostsTab } from './SystemCostsTab';
import { SystemResultsTab } from './SystemResultsTab';
import { SYSTEM_TYPE_LABELS } from '../../data/crops';

interface SystemDetailSectionProps {
  systemId: string;
  onBack: () => void;
  onStartCycle: () => void;
  onViewCycle: (cycleId: string) => void;
}

type TabType = 'overview' | 'costs' | 'results';

export function SystemDetailSection({
  systemId,
  onBack,
  onStartCycle,
  onViewCycle,
}: SystemDetailSectionProps) {
  const { t } = useLanguage();
  const [system, setSystem] = useState<HydroponicSystem | null>(null);
  const [cycles, setCycles] = useState<GrowCycle[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemData();
  }, [systemId]);

  async function loadSystemData() {
    try {
      const [systemData, cyclesData] = await Promise.all([
        getSystem(systemId),
        getGrowCyclesBySystem(systemId),
      ]);

      if (systemData) {
        setSystem(systemData);
      }
      setCycles(cyclesData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to load system data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
        <div className="flex items-center justify-center h-full">
          <div className="text-white/60">Loading system...</div>
        </div>
      </div>
    );
  }

  if (!system) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
        <div className="flex items-center justify-center h-full">
          <div className="text-white/60">System not found</div>
        </div>
      </div>
    );
  }

  const activeCycle = cycles.find(c => c.id === system.activeCycleId);
  const completedCycles = cycles.filter(c => c.status === 'completed').length;

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      germination: 'Germination',
      rootDevelopment: 'Root Dev.',
      vegetativeGrowth: 'Vegetative',
      flowering: 'Flowering',
      harvest: 'Harvest',
      completed: 'Completed',
    };
    return labels[stage] || stage;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      {/* Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-4 py-8 md:py-12 pt-20 md:pt-28">
        <div className="flex flex-col h-full gap-6 overflow-y-auto hiper-scroll px-1 pb-24">

          {/* Header */}
          <div className="flex-shrink-0">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-light text-white/60 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Systems
            </button>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[32px] text-white tracking-tight">
                  {system.name}
                </h1>
                <div className={`px-3 py-1 rounded-full text-xs border ${
                  system.status === 'active'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : system.status === 'maintenance'
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-white/10 text-white/60 border-white/20'
                }`}>
                  {system.status}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/60">
                <span>{SYSTEM_TYPE_LABELS[system.systemType] ?? system.systemType}</span>
                <span>•</span>
                <span>{system.location}</span>
                <span>•</span>
                <span>{system.capacity.totalPlants} plants</span>
              </div>
            </div>

            {/* Hypothesis */}
            {system.hypothesis && (
              <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm text-white/50 uppercase tracking-wider mb-2">Hypothesis</h3>
                <p className="text-white/90">{system.hypothesis}</p>
                {system.variables.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {system.variables.map((v, i) => (
                      <div key={i} className="flex items-center gap-4 text-sm">
                        <span className="text-white/70">{v.name}:</span>
                        <span className="text-green-400">{v.value}</span>
                        {v.controlValue && (
                          <>
                            <span className="text-white/40">vs</span>
                            <span className="text-white/60">{v.controlValue}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex-shrink-0 border-b border-white/10">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('costs')}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'costs'
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Costs
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'results'
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Results
              </button>
            </div>
          </div>

          {/* Tab Content - Overview */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
          <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-white/60">Total Cycles</span>
              </div>
              <div className="text-3xl text-white">{system.totalCycles}</div>
              <div className="text-xs text-white/40 mt-1">{completedCycles} completed</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-green-400" />
                <span className="text-sm text-white/60">Active Cycle</span>
              </div>
              {activeCycle ? (
                <>
                  <div className="text-lg text-white line-clamp-1">{activeCycle.cropType}</div>
                  <div className="text-xs text-white/40 mt-1">
                    Day {getDaysSince(activeCycle.seedDate)} • {getStageLabel(activeCycle.currentStage)}
                  </div>
                </>
              ) : (
                <div className="text-white/40">No active cycle</div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-green-400" />
                <span className="text-sm text-white/60">Total Harvest</span>
              </div>
              <div className="text-3xl text-white">
                {system.results?.totalHarvestKg.toFixed(1) || '0.0'}
                <span className="text-lg text-white/40 ml-1">kg</span>
              </div>
              <div className="text-xs text-white/40 mt-1">
                ${system.results?.totalRevenue.toLocaleString() || '0'} revenue
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-white/60">ROI</span>
              </div>
              <div className="text-3xl text-green-400">
                {system.results?.roi.toFixed(1) || '0'}
                <span className="text-lg">%</span>
              </div>
              <div className="text-xs text-white/40 mt-1">
                {system.results?.successRate.toFixed(0) || '0'}% success rate
              </div>
            </div>
          </div>

          {/* Grow Cycles List */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl text-white">Grow Cycles</h2>
              <button
                onClick={onStartCycle}
                className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-md sm:px-5 sm:py-2 p-2 transition-all duration-300"
              >
                <Plus className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-white text-sm hidden sm:inline">Start New Cycle</span>
              </button>
            </div>

            {cycles.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-2xl flex items-center justify-center">
                  <Activity className="w-8 h-8 text-green-400/50" />
                </div>
                <h3 className="text-xl text-white mb-2">No Cycles Yet</h3>
                <p className="text-white/60 mb-6">Start your first grow cycle to begin tracking</p>
                <button
                  onClick={onStartCycle}
                  className="inline-flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm border border-green-500/40 hover:border-green-500/60 rounded-full px-6 py-3 transition-all duration-300"
                >
                  <Plus className="w-5 h-5 text-green-400" />
                  <span className="text-white">Start First Cycle</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    onClick={() => onViewCycle(cycle.id)}
                    className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl text-white group-hover:text-green-400 transition-colors mb-1">
                          {cycle.name}
                        </h3>
                        <p className="text-sm text-white/60">{cycle.cropType}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(cycle.status)}`}>
                        {cycle.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-white/40 mb-1">Stage</div>
                        <div className="text-sm text-white">{getStageLabel(cycle.currentStage)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/40 mb-1">Duration</div>
                        <div className="text-sm text-white">
                          {cycle.status === 'completed' && cycle.cycleResults
                            ? `${cycle.cycleResults.cycleDuration} days`
                            : `Day ${getDaysSince(cycle.seedDate)}`
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-white/40 mb-1">Plants</div>
                        <div className="text-sm text-white">{cycle.currentPlantCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/40 mb-1">Logs</div>
                        <div className="text-sm text-white">{cycle.dailyLogCount}</div>
                      </div>
                    </div>

                    {cycle.status === 'completed' && cycle.totalHarvestKg && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-sm text-white/60">Harvest: {cycle.totalHarvestKg.toFixed(1)} kg</span>
                        {cycle.harvestRevenue && (
                          <span className="text-sm text-green-400">${cycle.harvestRevenue.toLocaleString()}</span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-white/40">Started {formatDate(cycle.seedDate)}</span>
                      <span className="text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </>
          )}

          {/* Tab Content - Costs */}
          {activeTab === 'costs' && (
            <div className="flex-shrink-0">
              <SystemCostsTab system={system} onUpdate={loadSystemData} />
            </div>
          )}

          {/* Tab Content - Results */}
          {activeTab === 'results' && (
            <div className="flex-shrink-0">
              <SystemResultsTab system={system} cycles={cycles} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
