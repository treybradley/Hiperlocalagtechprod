export interface CropDef {
  id: string;
  name: string;
  category: 'herb' | 'green' | 'flower' | 'microgreen';
  unitLabel: string; // 'plant' or 'tray'
  defaultYieldPerUnitPerCycle: number; // kg per plant (or tray) per cycle
  defaultCyclesPerYear: number;
  defaultPricePerKg: number;
  defaultLossRate: number;
}

export const CROPS: CropDef[] = [
  { id: 'basil',          name: 'Sweet Basil',        category: 'herb',       unitLabel: 'plant', defaultYieldPerUnitPerCycle: 0.06, defaultCyclesPerYear: 10, defaultPricePerKg: 300, defaultLossRate: 5  },
  { id: 'mint',           name: 'Mint',               category: 'herb',       unitLabel: 'plant', defaultYieldPerUnitPerCycle: 0.05, defaultCyclesPerYear: 12, defaultPricePerKg: 250, defaultLossRate: 5  },
  { id: 'cilantro',       name: 'Cilantro',           category: 'herb',       unitLabel: 'plant', defaultYieldPerUnitPerCycle: 0.07, defaultCyclesPerYear: 10, defaultPricePerKg: 280, defaultLossRate: 5  },
  { id: 'arugula',        name: 'Arugula',            category: 'green',      unitLabel: 'plant', defaultYieldPerUnitPerCycle: 0.08, defaultCyclesPerYear: 12, defaultPricePerKg: 200, defaultLossRate: 5  },
  { id: 'lettuce',        name: 'Butterhead Lettuce', category: 'green',      unitLabel: 'plant', defaultYieldPerUnitPerCycle: 0.15, defaultCyclesPerYear: 10, defaultPricePerKg: 180, defaultLossRate: 5  },
  { id: 'edible-flowers', name: 'Edible Flowers',     category: 'flower',     unitLabel: 'plant', defaultYieldPerUnitPerCycle: 0.03, defaultCyclesPerYear: 8,  defaultPricePerKg: 800, defaultLossRate: 10 },
  { id: 'microgreens',    name: 'Microgreens',        category: 'microgreen', unitLabel: 'tray',  defaultYieldPerUnitPerCycle: 0.30, defaultCyclesPerYear: 24, defaultPricePerKg: 600, defaultLossRate: 8  },
  { id: 'pea-shoots',     name: 'Pea Shoots',         category: 'microgreen', unitLabel: 'tray',  defaultYieldPerUnitPerCycle: 0.25, defaultCyclesPerYear: 20, defaultPricePerKg: 350, defaultLossRate: 6  },
];

export const CROP_MAP = Object.fromEntries(CROPS.map(c => [c.id, c]));

export const CROP_CATEGORY_STYLES: Record<string, string> = {
  herb:       'bg-green-500/20 text-green-400 border-green-500/30',
  green:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  flower:     'bg-purple-500/20 text-purple-400 border-purple-500/30',
  microgreen: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

/** Shared system type — used by Design Your Farm and Operations */
export type SystemType =
  | 'nft'
  | 'dwc'
  | 'ebb-flow'
  | 'drip'
  | 'aeroponics'
  | 'microgreens'
  | 'soil';

export const SYSTEM_TYPES: SystemType[] = [
  'nft',
  'dwc',
  'ebb-flow',
  'drip',
  'aeroponics',
  'microgreens',
  'soil',
];

export const SYSTEM_TYPE_LABELS: Record<SystemType, string> = {
  nft:         'NFT',
  dwc:         'DWC',
  'ebb-flow':  'Ebb & Flow',
  drip:        'Drip',
  aeroponics:  'Aeroponics',
  microgreens: 'Microgreens Trays',
  soil:        'Soil',
};

/** Longer labels for forms / selects */
export const SYSTEM_TYPE_FULL_LABELS: Record<SystemType, string> = {
  nft:         'NFT (Nutrient Film Technique)',
  dwc:         'DWC (Deep Water Culture)',
  'ebb-flow':  'Ebb & Flow',
  drip:        'Drip System',
  aeroponics:  'Aeroponics',
  microgreens: 'Microgreens Trays',
  soil:        'Soil',
};
