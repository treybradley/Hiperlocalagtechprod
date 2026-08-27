import type { ActDefinition, DemoActId, DemoDayConfig } from './types';
import { STAT_LABELS } from './generateTulumMetrics';
import type { ExportStatKey } from '../app/components/operations/export/types';

function emptyStats(): DemoDayConfig['stats'] {
  const keys = Object.keys(STAT_LABELS) as ExportStatKey[];
  return Object.fromEntries(
    keys.map((key) => [key, { label: STAT_LABELS[key], value: '—' }]),
  ) as DemoDayConfig['stats'];
}

function day(
  dayNumber: number,
  dateLabel: string,
  observations: string,
  markerStart: number,
): DemoDayConfig {
  return {
    dayNumber,
    dateLabel,
    stageLabel: 'Vegetative Growth',
    plantHealthLabel: 'Excellent',
    observations,
    markerStart,
    stats: emptyStats(),
  };
}

export const ACT1_DAYS: DemoDayConfig[] = [
  day(
    31,
    'Aug 9, 2026',
    'Day 31 since transplant. First tendril extending from the newest node — still short, already on the move.',
    0,
  ),
  day(
    32,
    'Aug 10, 2026',
    'Circumnutation in full swing — the tendril sweeps through space in a slow circular motion, searching for a support.',
    1 / 3,
  ),
  day(
    33,
    'Aug 11, 2026',
    'Still no stake in the pot. The tendril keeps circling — reaching, retracting, reaching again.',
    2 / 3,
  ),
];

export const ACT2_DAYS: DemoDayConfig[] = [
  day(
    39,
    'Aug 17, 2026',
    'Tendril 2 locked onto the first stake. Finally gave it something to grab.',
    0,
  ),
  day(
    40,
    'Aug 18, 2026',
    'First anchor holding firm. A third tendril just starting to push out from new growth.',
    1 / 7,
  ),
  day(
    41,
    'Aug 19, 2026',
    'Third tendril active — same sweeping search pattern. Added room for it to climb.',
    2 / 7,
  ),
  day(
    42,
    'Aug 20, 2026',
    'Second stake set in the soil. Tendril 3 oriented toward it, beginning its approach.',
    3 / 7,
  ),
  day(
    43,
    'Aug 21, 2026',
    'First contact — tendril 3 curling around the second stake. Grip forming.',
    4 / 7,
  ),
  day(
    44,
    'Aug 22, 2026',
    'Wrap tightening on stake 2. Vine committing to the new support.',
    5 / 7,
  ),
  day(
    45,
    'Aug 23, 2026',
    'Three tendrils, two stakes, all secured. Maracuyá climbing on its own terms.',
    6 / 7,
  ),
];

/** Real-world span in America/Cancun (UTC−5). */
const ACT1_START = new Date('2026-08-09T15:46:00-05:00').getTime();
const ACT1_END = new Date('2026-08-11T12:00:00-05:00').getTime();
const ACT2_START = new Date('2026-08-17T15:13:00-05:00').getTime();
const ACT2_END = new Date('2026-08-23T04:00:00-05:00').getTime();

export const ACT_DEFINITIONS: ActDefinition[] = [
  {
    id: 'act1',
    label: 'Act I — The Search',
    subtitle: 'Days 31–33 · First tendril · circumnutation',
    videoRotation: 0,
    exportFilename: 'maracuya-act1-search',
    realWorldStartMs: ACT1_START,
    realWorldEndMs: ACT1_END,
    introDefault: {
      enabled: true,
      title: 'Maracuyá',
      subtitle: 'Day 31 · Transplanted July 9',
      durationSec: 2,
    },
    days: ACT1_DAYS,
  },
  {
    id: 'act2',
    label: 'Act II — The Climb',
    subtitle: 'Days 39–45 · Stakes & tendrils',
    videoRotation: 0,
    exportFilename: 'maracuya-act2-climb',
    realWorldStartMs: ACT2_START,
    realWorldEndMs: ACT2_END,
    introDefault: {
      enabled: true,
      title: 'Maracuyá',
      subtitle: 'Part 2 · Day 39 · Stakes & tendrils',
      durationSec: 2,
    },
    days: ACT2_DAYS,
  },
];

export function getActDefinition(id: DemoActId) {
  const act = ACT_DEFINITIONS.find((a) => a.id === id);
  if (!act) throw new Error(`Unknown act: ${id}`);
  return act;
}
