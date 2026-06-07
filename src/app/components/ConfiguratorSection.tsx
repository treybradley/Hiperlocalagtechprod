import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Plus, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarmConfig, SystemType } from '../contexts/FarmConfigContext';
import { CROPS, CROP_CATEGORY_STYLES, SYSTEM_TYPE_LABELS } from '../data/crops';

interface ConfiguratorSectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

const SYSTEM_TYPES: SystemType[] = ['nft', 'dwc', 'ebb-flow', 'drip', 'aeroponics', 'microgreens'];

function SmallNumberInput({ value, onChange, min = 1, step = 1 }: {
  value: number; onChange: (v: number) => void; min?: number; step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      step={step}
      onChange={e => onChange(Math.max(min, Number(e.target.value)))}
      onKeyDown={e => e.stopPropagation()}
      className="w-14 bg-white/5 border border-white/10 rounded-md px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-green-500/50"
    />
  );
}

export function ConfiguratorSection({ isActive }: ConfiguratorSectionProps) {
  const { t } = useLanguage();
  const { config, updateConfig, addSystemBlock, removeSystemBlock, updateSystemBlock, toggleCropInBlock, updateCropInBlock } = useFarmConfig();

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 opacity-30">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1774291981971-ec2ec7a8cd0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
          alt="Hydroponic growing system"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/95 to-[#0a0a0a]" />
      </div>

      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2 pb-24 pt-24">

          {/* Header */}
          <div className="flex-shrink-0">
            <h2 className="text-white font-thin tracking-tight text-[32px]">
              {t('configurator.subtitle')}
              <br />
              <span className="text-white/40">{t('configurator.subtitle2')}</span>
            </h2>
            <p className="text-white/50 text-xs md:text-sm max-w-2xl mt-1">
              {t('configurator.description')}
            </p>
          </div>

          {/* System Blocks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 uppercase tracking-wider">
                {config.systemBlocks.length} system{config.systemBlocks.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={addSystemBlock}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full text-xs hover:bg-green-500/25 transition-all"
              >
                <Plus className="w-3 h-3" />
                Add System
              </button>
            </div>

            {config.systemBlocks.map((block) => {
              const totalUnits  = block.cropAllocations.reduce((s, a) => s + a.unitCount, 0);
              const totalPlants = block.cropAllocations.reduce((s, a) => s + a.plantsPerUnit * a.unitCount, 0);
              const uniqueCrops = [...new Set(config.systemBlocks.flatMap(b => b.cropAllocations.map(a => a.cropId)))];
              const isMicro     = block.systemType === 'microgreens';
              const unitWord    = isMicro ? 'tray' : 'unit';

              return (
                <div key={block.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">

                  {/* Block header row: system type selector + derived stats */}
                  <div className="flex items-start gap-3 flex-wrap">
                    <Select
                      value={block.systemType}
                      onValueChange={v => updateSystemBlock(block.id, { systemType: v as SystemType })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/15 text-white w-auto min-w-[150px] text-sm shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SYSTEM_TYPES.map(st => (
                          <SelectItem key={st} value={st}>{SYSTEM_TYPE_LABELS[st]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Derived stats — read-only */}
                    <div className="flex items-center gap-3 flex-wrap flex-1">
                      <div className="text-center">
                        <div className="text-white text-sm">{totalUnits}</div>
                        <div className="text-white/30 text-[10px]">{unitWord}s</div>
                      </div>
                      {!isMicro && (
                        <>
                          <div className="w-px h-6 bg-white/10" />
                          <div className="text-center">
                            <div className="text-white text-sm">{totalPlants}</div>
                            <div className="text-white/30 text-[10px]">plants</div>
                          </div>
                        </>
                      )}
                      {block.cropAllocations.length > 0 && (
                        <>
                          <div className="w-px h-6 bg-white/10" />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {block.cropAllocations.map(alloc => {
                              const crop = CROPS.find(c => c.id === alloc.cropId);
                              const pct  = totalPlants > 0
                                ? Math.round((alloc.plantsPerUnit * alloc.unitCount / totalPlants) * 100)
                                : 0;
                              const style = CROP_CATEGORY_STYLES[crop?.category ?? 'herb'];
                              return (
                                <span key={alloc.cropId} className={`px-1.5 py-0.5 rounded-full border text-[10px] ${style}`}>
                                  {crop?.name} {pct}%
                                </span>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {config.systemBlocks.length > 1 && (
                      <button
                        onClick={() => removeSystemBlock(block.id)}
                        className="p-1.5 text-white/30 hover:text-red-400 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Crop allocation — inputs only */}
                  <div>
                    <div className="text-[10px] text-white/25 uppercase tracking-wider mb-3">
                      Crop allocation — {isMicro ? 'select crops and enter number of trays' : `select crops, then enter plants/${unitWord} × ${unitWord}s`}
                    </div>
                    <div className="space-y-2">
                      {CROPS.map(crop => {
                        const alloc  = block.cropAllocations.find(a => a.cropId === crop.id);
                        const active = !!alloc;
                        const style  = CROP_CATEGORY_STYLES[crop.category];
                        return (
                          <div key={crop.id} className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => toggleCropInBlock(block.id, crop.id)}
                              className={`px-2.5 py-1 rounded-full border text-xs transition-all shrink-0 ${
                                active ? style : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:border-white/20'
                              }`}
                            >
                              {crop.name}
                            </button>

                            {active && alloc && (
                              <div className="flex items-center gap-1.5 text-xs text-white/30">
                                {!isMicro && (
                                  <>
                                    <SmallNumberInput
                                      value={alloc.plantsPerUnit}
                                      onChange={v => updateCropInBlock(block.id, crop.id, { plantsPerUnit: v })}
                                    />
                                    <span>plants/unit</span>
                                    <span className="text-white/15">×</span>
                                  </>
                                )}
                                <SmallNumberInput
                                  value={alloc.unitCount}
                                  onChange={v => updateCropInBlock(block.id, crop.id, { unitCount: v })}
                                />
                                <span>{unitWord}s</span>
                                {!isMicro && (
                                  <span className="text-white/20 ml-1">
                                    = {alloc.plantsPerUnit * alloc.unitCount} plants
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {block.cropAllocations.length === 0 && (
                      <p className="text-xs text-white/25 mt-2">Tap a crop above to assign it to this system.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Other settings */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5">
            <span className="text-xs text-white/40 uppercase tracking-wider">Environment & Automation</span>

            <div className="space-y-2">
              <label className="text-xs text-white/60 uppercase tracking-wider">{t('configurator.environment')}</label>
              <Select value={config.environment} onValueChange={v => updateConfig({ environment: v as 'open-air' | 'climate-controlled' })}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open-air">{t('configurator.openAir')}</SelectItem>
                  <SelectItem value="climate-controlled">{t('configurator.climateControlled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-white/60 uppercase tracking-wider">{t('configurator.lighting')}</label>
                <span className="text-white text-sm">{config.lighting}%</span>
              </div>
              <Slider
                value={[config.lighting]}
                onValueChange={v => updateConfig({ lighting: v[0] })}
                min={25} max={100} step={5}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/60 uppercase tracking-wider">{t('configurator.automation')}</label>
              <Select value={config.automation} onValueChange={v => updateConfig({ automation: v as 'manual' | 'semi-auto' | 'full-auto' })}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{t('configurator.manual')}</SelectItem>
                  <SelectItem value="semi-auto">{t('configurator.semiAuto')}</SelectItem>
                  <SelectItem value="full-auto">{t('configurator.fullAuto')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
