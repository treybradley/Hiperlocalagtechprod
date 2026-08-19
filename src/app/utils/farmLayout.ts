import type { SystemBlock, SystemType } from '../contexts/FarmConfigContext';
import { CROPS, type CropDef } from '../data/crops';

export type LengthUnit = 'm' | 'ft';

export interface RoomSpec {
  width: number;
  depth: number;
  displayUnit: LengthUnit;
}

export const DEFAULT_ROOM: RoomSpec = {
  width: 4,
  depth: 6,
  displayUnit: 'm',
};

export const M_TO_FT = 3.28084;
export const FT_TO_M = 1 / M_TO_FT;

const MARGIN = 0.3;
const GAP = 0.18;

interface TypeSpec {
  unitW: number;
  unitD: number;
  height: number;
  kind: 'tank' | 'channel' | 'rack';
  tiers: number;
}

const TYPE_SPECS: Record<SystemType, TypeSpec> = {
  dwc: { unitW: 1.0, unitD: 0.5, height: 0.4, kind: 'tank', tiers: 1 },
  'ebb-flow': { unitW: 1.0, unitD: 0.5, height: 0.4, kind: 'tank', tiers: 1 },
  drip: { unitW: 1.0, unitD: 0.5, height: 0.4, kind: 'tank', tiers: 1 },
  soil: { unitW: 1.0, unitD: 0.5, height: 0.4, kind: 'tank', tiers: 1 },
  nft: { unitW: 2.0, unitD: 0.4, height: 0.5, kind: 'channel', tiers: 1 },
  aeroponics: { unitW: 2.0, unitD: 0.4, height: 0.5, kind: 'channel', tiers: 1 },
  microgreens: { unitW: 1.2, unitD: 0.55, height: 0.38, kind: 'rack', tiers: 1 },
};

export const TRAYS_PER_SHELF = 4;
export const MAX_RACK_SHELVES = 4;
const RACK_SHELF_PITCH = 0.38;
const RACK_BASE = 0.12;
const RACK_BAY_GAP = 0.08;

export const CROP_VOXEL_COLORS: Record<CropDef['category'], number> = {
  herb: 0x4ade80,
  green: 0x86efac,
  flower: 0xe879f9,
  microgreen: 0xa3e635,
};

export interface CropStripe {
  cropId: string;
  weight: number;
  color: number;
}

export interface PlacedModule {
  id: string;
  systemType: SystemType;
  x: number;
  z: number;
  rotY: number;
  w: number;
  d: number;
  h: number;
  kind: TypeSpec['kind'];
  tiers: number;
  cols: number;
  bays: number;
  bayRows: number;
  unitCount: number;
  stripes: CropStripe[];
  overflow: boolean;
}

export function totalUnits(block: SystemBlock): number {
  const sum = block.cropAllocations.reduce((s, a) => s + a.unitCount, 0);
  return Math.max(1, sum);
}

function aabbOverflow(x: number, z: number, w: number, d: number, rotY: number, room: RoomSpec): boolean {
  const hw = (rotY === 0 ? w : d) / 2;
  const hd = (rotY === 0 ? d : w) / 2;
  const minX = x - hw;
  const maxX = x + hw;
  const minZ = z - hd;
  const maxZ = z + hd;
  return minX < -0.02 || maxX > room.width + 0.02 || minZ < -0.02 || maxZ > room.depth + 0.02;
}

function usableWidth(room?: RoomSpec) {
  if (!room) return Number.POSITIVE_INFINITY;
  return Math.max(0.5, room.width - 2 * MARGIN);
}

export function moduleFootprint(block: SystemBlock, room?: RoomSpec): {
  w: number;
  d: number;
  h: number;
  kind: TypeSpec['kind'];
  tiers: number;
  cols: number;
  bays: number;
  bayRows: number;
} {
  const spec = TYPE_SPECS[block.systemType];
  const units = totalUnits(block);
  const maxW = usableWidth(room);

  if (spec.kind === 'rack') {
    const traysPerBay = TRAYS_PER_SHELF * MAX_RACK_SHELVES;
    const totalBays = Math.max(1, Math.ceil(units / traysPerBay));
    const maxBaysAlong = Math.max(
      1,
      Math.floor((maxW + RACK_BAY_GAP) / (spec.unitW + RACK_BAY_GAP)),
    );
    const baysAlong = Math.min(totalBays, maxBaysAlong);
    const bayRows = Math.ceil(totalBays / baysAlong);
    const tiers = Math.min(
      MAX_RACK_SHELVES,
      Math.max(1, Math.ceil(units / TRAYS_PER_SHELF)),
    );
    return {
      w: baysAlong * spec.unitW + (baysAlong - 1) * RACK_BAY_GAP,
      d: bayRows * spec.unitD + (bayRows - 1) * RACK_BAY_GAP,
      h: RACK_BASE + tiers * RACK_SHELF_PITCH,
      kind: spec.kind,
      tiers,
      cols: TRAYS_PER_SHELF,
      bays: totalBays,
      bayRows,
    };
  }

  const maxCols = Math.max(1, Math.floor(maxW / spec.unitW) || 1);
  const cols = Math.min(units, maxCols);
  const rows = Math.ceil(units / cols);
  return {
    w: cols * spec.unitW,
    d: rows * spec.unitD,
    h: spec.height,
    kind: spec.kind,
    tiers: spec.tiers,
    cols,
    bays: 1,
    bayRows: 1,
  };
}

function stripesFor(block: SystemBlock): CropStripe[] {
  const total = block.cropAllocations.reduce((s, a) => s + a.unitCount, 0);
  if (total <= 0) return [];
  return block.cropAllocations.map((a) => {
    const crop = CROPS.find((c) => c.id === a.cropId);
    return {
      cropId: a.cropId,
      weight: a.unitCount / total,
      color: CROP_VOXEL_COLORS[crop?.category ?? 'herb'],
    };
  });
}

/** Row-pack from the back wall toward the front, wrapping into leftover floor. */
export function autoPackModules(blocks: SystemBlock[], room: RoomSpec): PlacedModule[] {
  const placed: PlacedModule[] = [];
  const aisle = Math.max(GAP, 0.35);
  let rowBack = room.depth - MARGIN;
  let rowX = MARGIN;
  let rowMaxD = 0;

  for (const block of blocks) {
    const fp = moduleFootprint(block, room);
    const innerRight = room.width - MARGIN;

    if (rowX > MARGIN && rowX + fp.w > innerRight + 0.001) {
      rowBack -= rowMaxD + aisle;
      rowX = MARGIN;
      rowMaxD = 0;
    }

    const x = rowX + fp.w / 2;
    const z = rowBack - fp.d / 2;
    rowX += fp.w + GAP;
    rowMaxD = Math.max(rowMaxD, fp.d);

    placed.push({
      id: block.id,
      systemType: block.systemType,
      x,
      z,
      rotY: 0,
      w: fp.w,
      d: fp.d,
      h: fp.h,
      kind: fp.kind,
      tiers: fp.tiers,
      cols: fp.cols,
      bays: fp.bays,
      bayRows: fp.bayRows,
      unitCount: totalUnits(block),
      stripes: stripesFor(block),
      overflow: aabbOverflow(x, z, fp.w, fp.d, 0, room),
    });
  }

  return placed;
}

export function metersToDisplay(m: number, unit: LengthUnit): number {
  const v = unit === 'ft' ? m * M_TO_FT : m;
  return Math.round(v * 10) / 10;
}

export function displayToMeters(v: number, unit: LengthUnit): number {
  return unit === 'ft' ? v * FT_TO_M : v;
}

export function normalizeRoom(room?: Partial<RoomSpec> | null): RoomSpec {
  return {
    width: typeof room?.width === 'number' && room.width > 0 ? room.width : DEFAULT_ROOM.width,
    depth: typeof room?.depth === 'number' && room.depth > 0 ? room.depth : DEFAULT_ROOM.depth,
    displayUnit: room?.displayUnit === 'ft' ? 'ft' : 'm',
  };
}
