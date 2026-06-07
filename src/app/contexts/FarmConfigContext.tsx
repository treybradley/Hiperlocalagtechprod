import { createContext, useContext, useState, ReactNode } from 'react';
import { CROPS } from '../data/crops';

export type SystemType = 'nft' | 'dwc' | 'ebb-flow' | 'drip' | 'aeroponics' | 'microgreens';
type Environment = 'open-air' | 'climate-controlled';
type AutomationLevel = 'manual' | 'semi-auto' | 'full-auto';

export interface CropAllocation {
  cropId: string;
  plantsPerUnit: number; // how many of this crop per physical unit
  unitCount: number;     // how many units are dedicated to this crop
  // totalPlants = plantsPerUnit * unitCount (derived)
}

export interface SystemBlock {
  id: string;
  systemType: SystemType;
  cropAllocations: CropAllocation[];
  // totalUnits = sum(cropAllocations.unitCount) (derived)
}

export interface CropParams {
  yieldPerUnitPerCycle: number; // kg per plant (or tray for microgreens) per cycle
  cyclesPerYear: number;
  pricePerKg: number;
  lossRate: number;
}

function defaultCropParams(): Record<string, CropParams> {
  const out: Record<string, CropParams> = {};
  for (const c of CROPS) {
    out[c.id] = {
      yieldPerUnitPerCycle: c.defaultYieldPerUnitPerCycle,
      cyclesPerYear: c.defaultCyclesPerYear,
      pricePerKg: c.defaultPricePerKg,
      lossRate: c.defaultLossRate,
    };
  }
  return out;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface FarmConfig {
  systemBlocks: SystemBlock[];
  cropParams: Record<string, CropParams>;
  environment: Environment;
  lighting: number;
  automation: AutomationLevel;
}

interface FarmConfigContextType {
  config: FarmConfig;
  addSystemBlock: () => void;
  removeSystemBlock: (id: string) => void;
  updateSystemBlock: (id: string, partial: Pick<SystemBlock, 'systemType'>) => void;
  toggleCropInBlock: (blockId: string, cropId: string) => void;
  updateCropInBlock: (blockId: string, cropId: string, patch: Partial<Pick<CropAllocation, 'plantsPerUnit' | 'unitCount'>>) => void;
  updateCropParam: (cropId: string, param: Partial<CropParams>) => void;
  updateConfig: (partial: Partial<Omit<FarmConfig, 'systemBlocks' | 'cropParams'>>) => void;
}

const FarmConfigContext = createContext<FarmConfigContextType | undefined>(undefined);

const DEFAULT_BLOCKS: SystemBlock[] = [
  {
    id: 'block-1',
    systemType: 'dwc',
    cropAllocations: [
      { cropId: 'basil',          plantsPerUnit: 5, unitCount: 5 },
      { cropId: 'mint',           plantsPerUnit: 3, unitCount: 2 },
      { cropId: 'cilantro',       plantsPerUnit: 3, unitCount: 2 },
      { cropId: 'edible-flowers', plantsPerUnit: 1, unitCount: 1 },
    ],
  },
  {
    id: 'block-2',
    systemType: 'microgreens',
    cropAllocations: [
      { cropId: 'microgreens', plantsPerUnit: 1, unitCount: 20 },
    ],
  },
];

export function FarmConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<FarmConfig>({
    systemBlocks: DEFAULT_BLOCKS,
    cropParams: defaultCropParams(),
    environment: 'climate-controlled',
    lighting: 75,
    automation: 'semi-auto',
  });

  const addSystemBlock = () => {
    setConfig(prev => ({
      ...prev,
      systemBlocks: [
        ...prev.systemBlocks,
        { id: uid(), systemType: 'dwc', cropAllocations: [] as CropAllocation[] },
      ],
    }));
  };

  const removeSystemBlock = (id: string) => {
    setConfig(prev => ({
      ...prev,
      systemBlocks: prev.systemBlocks.filter(b => b.id !== id),
    }));
  };

  const updateSystemBlock = (id: string, partial: Partial<Omit<SystemBlock, 'id' | 'cropAllocations'>>) => {
    setConfig(prev => ({
      ...prev,
      systemBlocks: prev.systemBlocks.map(b => b.id === id ? { ...b, ...partial } : b),
    }));
  };

  const toggleCropInBlock = (blockId: string, cropId: string) => {
    setConfig(prev => ({
      ...prev,
      systemBlocks: prev.systemBlocks.map(b => {
        if (b.id !== blockId) return b;
        const exists = b.cropAllocations.find(a => a.cropId === cropId);
        const isMicro = b.systemType === 'microgreens';
        return {
          ...b,
          cropAllocations: exists
            ? b.cropAllocations.filter(a => a.cropId !== cropId)
            : [...b.cropAllocations, { cropId, plantsPerUnit: isMicro ? 1 : 1, unitCount: 1 }],
        };
      }),
    }));
  };

  const updateCropInBlock = (blockId: string, cropId: string, patch: Partial<Pick<CropAllocation, 'plantsPerUnit' | 'unitCount'>>) => {
    setConfig(prev => ({
      ...prev,
      systemBlocks: prev.systemBlocks.map(b => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          cropAllocations: b.cropAllocations.map(a =>
            a.cropId === cropId ? { ...a, ...patch } : a
          ),
        };
      }),
    }));
  };

  const updateCropParam = (cropId: string, param: Partial<CropParams>) => {
    setConfig(prev => ({
      ...prev,
      cropParams: {
        ...prev.cropParams,
        [cropId]: { ...prev.cropParams[cropId], ...param },
      },
    }));
  };

  const updateConfig = (partial: Partial<Omit<FarmConfig, 'systemBlocks' | 'cropParams'>>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  return (
    <FarmConfigContext.Provider value={{
      config, addSystemBlock, removeSystemBlock, updateSystemBlock,
      toggleCropInBlock, updateCropInBlock, updateCropParam, updateConfig,
    }}>
      {children}
    </FarmConfigContext.Provider>
  );
}

export function useFarmConfig() {
  const context = useContext(FarmConfigContext);
  if (!context) throw new Error('useFarmConfig must be used within FarmConfigProvider');
  return context;
}

/** Derives total units per crop across all system blocks.
 *  For microgreens blocks, 1 tray = 1 unit regardless of plantsPerUnit. */
export function getTotalPlantsByCrop(systemBlocks: SystemBlock[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const block of systemBlocks) {
    const isMicro = block.systemType === 'microgreens';
    for (const alloc of block.cropAllocations) {
      const count = isMicro ? alloc.unitCount : alloc.plantsPerUnit * alloc.unitCount;
      totals[alloc.cropId] = (totals[alloc.cropId] ?? 0) + count;
    }
  }
  return totals;
}
