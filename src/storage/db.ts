import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { HydroponicSystem, GrowCycle, DailyLog, Photo, Insight } from './models';

interface HydroponicOpsDBSchema extends DBSchema {
  systems: {
    key: string;
    value: HydroponicSystem;
    indexes: {
      'by-status': string;
      'by-type': string;
      'by-created': number;
    };
  };
  growCycles: {
    key: string;
    value: GrowCycle;
    indexes: {
      'by-system': string;
      'by-stage': string;
      'by-status': string;
      'by-crop': string;
      'by-system-created': [string, number];
      'by-system-status': [string, string];
    };
  };
  dailyLogs: {
    key: string;
    value: DailyLog;
    indexes: {
      'by-system': string;
      'by-cycle': string;
      'by-time': number;
      'by-cycle-time': [string, number];
      'by-system-time': [string, number];
    };
  };
  photos: {
    key: string;
    value: Photo;
    indexes: {
      'by-system': string;
      'by-cycle': string;
      'by-log': string;
      'by-time': number;
      'by-system-time': [string, number];
    };
  };
  insights: {
    key: string;
    value: Insight;
    indexes: {
      'by-category': string;
      'by-source-type': string;
      'by-confidence': string;
    };
  };
}

let dbInstance: IDBPDatabase<HydroponicOpsDBSchema> | null = null;

export async function initDB(): Promise<IDBPDatabase<HydroponicOpsDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<HydroponicOpsDBSchema>('HydroponicOpsDB', 1, {
    upgrade(db) {
      // Create systems store
      const systemsStore = db.createObjectStore('systems', { keyPath: 'id' });
      systemsStore.createIndex('by-status', 'status');
      systemsStore.createIndex('by-type', 'systemType');
      systemsStore.createIndex('by-created', 'createdAt');

      // Create growCycles store
      const cyclesStore = db.createObjectStore('growCycles', { keyPath: 'id' });
      cyclesStore.createIndex('by-system', 'systemId');
      cyclesStore.createIndex('by-stage', 'currentStage');
      cyclesStore.createIndex('by-status', 'status');
      cyclesStore.createIndex('by-crop', 'cropType');
      cyclesStore.createIndex('by-system-created', ['systemId', 'createdAt']);
      cyclesStore.createIndex('by-system-status', ['systemId', 'status']);

      // Create dailyLogs store
      const logsStore = db.createObjectStore('dailyLogs', { keyPath: 'id' });
      logsStore.createIndex('by-system', 'systemId');
      logsStore.createIndex('by-cycle', 'growCycleId');
      logsStore.createIndex('by-time', 'timestamp');
      logsStore.createIndex('by-cycle-time', ['growCycleId', 'timestamp']);
      logsStore.createIndex('by-system-time', ['systemId', 'timestamp']);

      // Create photos store
      const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
      photosStore.createIndex('by-system', 'systemId');
      photosStore.createIndex('by-cycle', 'growCycleId');
      photosStore.createIndex('by-log', 'dailyLogId');
      photosStore.createIndex('by-time', 'timestamp');
      photosStore.createIndex('by-system-time', ['systemId', 'timestamp']);

      // Create insights store
      const insightsStore = db.createObjectStore('insights', { keyPath: 'id' });
      insightsStore.createIndex('by-category', 'category');
      insightsStore.createIndex('by-source-type', 'sourceType');
      insightsStore.createIndex('by-confidence', 'confidence');
    },
  });

  return dbInstance;
}

export async function getDB(): Promise<IDBPDatabase<HydroponicOpsDBSchema>> {
  if (!dbInstance) {
    await initDB();
  }
  return dbInstance!;
}
