# Hydroponic Operations Journal & Experiment Tracking
## Implementation Plan

---

## Executive Summary

This plan extends the existing hydroponic business planning platform into a living operational system that tracks real-world growing cycles, experiments, and observations. The system uses **IndexedDB** for local-only storage (persists across browser sessions) and supports photo documentation, environmental metrics, and accumulated learning insights.

**Design Language:** Hybrid of Linear, Notion, Vercel dashboards, industrial environmental systems, architectural project management, greenhouse control software, and creative R&D tools. Premium, architectural, environmental, calm, technical yet artistic.

**Target Photo Load:** 7-14 photos per week (base64 encoded in IndexedDB)

---

## Data Architecture

### Core Philosophy

**Each system is an experiment.** Rather than separating "systems" from "experiments," every hydroponic system build inherently tests hypotheses through its configuration choices (system type, variables like lighting, nutrients, etc.). This simplifies the data model and reflects reality: you're always testing something, even if it's just "does NFT work better than DWC for basil?"

Observations are captured through daily logging, and results accumulate in the system's performance metrics over completed grow cycles.

### IndexedDB Schema Design

**Database Name:** `HydroponicOpsDB`  
**Version:** 1  
**Total Object Stores:** 5 (systems, growCycles, dailyLogs, photos, insights)

#### Object Stores

```typescript
// Store 1: systems
interface HydroponicSystem {
  id: string;                    // UUID
  name: string;                  // "Rooftop NFT System A"
  createdAt: number;             // Unix timestamp
  updatedAt: number;
  
  // Configuration (from existing configurator)
  systemType: 'nft' | 'dwc' | 'ebb-flow' | 'drip' | 'aeroponics';
  dimensions: {
    length: number;              // meters
    width: number;
    height: number;
  };
  capacity: {
    channels: number;
    plantsPerChannel: number;
    totalPlants: number;
  };
  location: string;              // "Rooftop North, Tulum"
  status: 'active' | 'inactive' | 'maintenance';
  
  // Experiment/Hypothesis Fields (each system is an experiment)
  hypothesis?: string;           // "NFT with 40% blue LED will increase basil yield by 20%"
  variables: Array<{
    name: string;                // "LED Blue Spectrum %"
    value: string;               // "40%"
    controlValue?: string;       // "20% (industry standard)"
  }>;
  controlSetup?: {
    description: string;         // What you're comparing against
    source: string;              // "Industry standard" | "Previous cycle" | "Peer system"
  };
  
  // Operating Costs & Financial Tracking
  operatingCosts: {
    equipment: Array<{
      id: string;
      name: string;              // "LED Grow Light 100W"
      category: 'lighting' | 'pumps' | 'nutrients' | 'seeds' | 'structure' | 'sensors' | 'other';
      cost: number;              // USD
      quantity: number;
      vendor?: string;           // "Amazon", "Local supplier"
      purchaseLink?: string;     // Amazon URL or other link
      purchaseDate?: number;     // Unix timestamp
      warrantyMonths?: number;
    }>;
    recurringCosts: Array<{
      id: string;
      name: string;              // "Electricity"
      category: 'utilities' | 'nutrients' | 'maintenance' | 'labor' | 'other';
      amount: number;            // USD per month
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    }>;
    totalCapitalCost: number;    // Sum of all equipment
    monthlyOperatingCost: number; // Sum of recurring costs
  };
  
  // Results & Performance (populated over time)
  results?: {
    totalHarvestKg: number;
    totalRevenue: number;        // USD
    roi: number;                 // Percentage
    cyclesCompleted: number;
    avgCycleDuration: number;    // Days
    successRate: number;         // Percentage (successful cycles / total cycles)
    keyFindings: string;         // Summary of what worked/didn't work
    wouldRecommend: boolean;
  };
  
  // Reference to grow cycles
  activeCycleId?: string;
  totalCycles: number;
}

// Store 2: growCycles
interface GrowCycle {
  id: string;
  systemId: string;              // Foreign key to systems
  name: string;                  // "Spring 2026 Basil Cycle"
  createdAt: number;
  updatedAt: number;
  
  cropType: string;              // "Genovese Basil"
  seedDate: number;              // Unix timestamp
  harvestDate?: number;          // null if ongoing
  
  // Stages with timestamps
  stages: {
    germination: { startDate: number; endDate?: number; };
    rootDevelopment: { startDate?: number; endDate?: number; };
    vegetativeGrowth: { startDate?: number; endDate?: number; };
    flowering?: { startDate?: number; endDate?: number; };
    harvest: { startDate?: number; endDate?: number; };
  };
  
  currentStage: 'germination' | 'rootDevelopment' | 'vegetativeGrowth' | 'flowering' | 'harvest' | 'completed';
  
  // Metrics
  initialPlantCount: number;
  currentPlantCount: number;
  totalHarvestKg?: number;
  harvestRevenue?: number;       // USD value of harvest
  
  // Performance tracking
  dailyLogCount: number;
  photoCount: number;
  issueCount: number;            // Total issues logged
  resolvedIssueCount: number;    // Issues that were resolved
  
  // Cycle results (populated on completion)
  cycleResults?: {
    success: boolean;
    yieldPerPlant: number;       // kg per plant
    cycleDuration: number;       // days from seed to harvest
    totalCost: number;           // Operating costs during this cycle
    profitMargin: number;        // (revenue - cost) / revenue
    lessonsLearned: string;      // Key takeaways
  };
  
  status: 'planning' | 'active' | 'completed' | 'failed';
}

// Store 3: dailyLogs
interface DailyLog {
  id: string;
  growCycleId: string;           // Foreign key to growCycles
  systemId: string;              // Foreign key to systems (for quick filtering)
  timestamp: number;             // Unix timestamp
  createdAt: number;
  
  // Environmental metrics
  environment: {
    temperature?: number;        // °C
    humidity?: number;           // %
    ph?: number;
    ec?: number;                 // Electrical conductivity (mS/cm)
    waterTemp?: number;          // °C
    lightLevel?: number;         // PPFD (μmol/m²/s)
  };
  
  // Observations (core of daily logging)
  plantHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  observations: string;          // Main observation notes - what you noticed today
  visualChanges?: string;        // Specific visual observations (color, size, new growth)
  
  // Tasks performed
  tasksPerformed: Array<{
    task: string;                // "Adjusted pH to 6.0"
    timestamp: number;
  }>;
  
  // Issues & resolutions
  issues: Array<{
    severity: 'low' | 'medium' | 'high';
    description: string;
    resolved: boolean;
    resolution?: string;         // How it was fixed
  }>;
  
  // Photos
  photoIds: string[];
  
  // Resource usage
  waterAdded?: number;           // Liters
  nutrientsAdded?: string;       // "10ml CalMag, 15ml Bloom"
  
  // Experiment notes (if testing variables on this system)
  experimentNotes?: string;      // Notes specific to hypothesis being tested
}

// Store 4: photos
interface Photo {
  id: string;
  timestamp: number;
  createdAt: number;
  
  // Relationships
  systemId: string;              // Foreign key to systems
  growCycleId: string;           // Foreign key to growCycles
  dailyLogId?: string;           // Optional - can be standalone
  
  // Image data
  imageData: string;             // Base64 encoded image
  thumbnail?: string;            // Base64 encoded thumbnail (150x150)
  
  // Metadata
  caption?: string;
  tags: string[];                // ["week-3", "flowering", "pest-damage", "control-group"]
  
  // Photo details
  fileSize: number;              // Bytes (for storage tracking)
  dimensions: {
    width: number;
    height: number;
  };
}

// Store 5: insights
interface Insight {
  id: string;
  createdAt: number;
  updatedAt: number;
  
  // Source
  sourceType: 'system' | 'cycle' | 'manual';
  sourceId?: string;             // Reference to system or cycle
  
  // Content
  title: string;                 // "NFT systems with 40% blue LED increase basil yield by 18%"
  category: 'success' | 'failure' | 'observation' | 'optimization' | 'cost-saving';
  description: string;
  
  // Context
  systemTypes: string[];         // ["nft", "dwc"]
  cropTypes: string[];           // ["Basil", "Lettuce"]
  tags: string[];                // ["lighting", "growth-rate", "roi"]
  
  // Financial impact (if applicable)
  financialImpact?: {
    type: 'cost-reduction' | 'yield-increase' | 'efficiency-gain';
    estimatedValue: number;      // USD or percentage
    unit: 'usd' | 'percent';
  };
  
  // Application
  actionable: boolean;
  recommendation?: string;       // "Apply this LED configuration to future basil cycles in NFT systems"
  
  // Validation
  confidence: 'low' | 'medium' | 'high';
  timesApplied: number;
  timesSuccessful: number;
  
  // Data backing
  dataPoints?: Array<{
    metric: string;
    value: number;
    comparisonValue?: number;
    unit: string;
  }>;
}
```

#### Indexes

```typescript
// systems store
- Primary key: id
- Index: status
- Index: systemType
- Index: createdAt

// growCycles store
- Primary key: id
- Index: systemId
- Index: currentStage
- Index: status
- Index: cropType
- Compound index: [systemId, createdAt]
- Compound index: [systemId, status]

// dailyLogs store
- Primary key: id
- Index: systemId
- Index: growCycleId
- Index: timestamp
- Compound index: [growCycleId, timestamp]
- Compound index: [systemId, timestamp]

// photos store
- Primary key: id
- Index: systemId
- Index: growCycleId
- Index: dailyLogId
- Index: timestamp
- Index: tags (multiEntry: true)
- Compound index: [systemId, timestamp]

// insights store
- Primary key: id
- Index: category
- Index: systemTypes (multiEntry: true)
- Index: cropTypes (multiEntry: true)
- Index: tags (multiEntry: true)
- Index: confidence
- Index: sourceType
```

---

## Storage Layer Architecture

### File Structure

```
src/
  storage/
    db.ts                      // IndexedDB initialization & connection
    models.ts                  // TypeScript interfaces (exported)
    operations/
      systems.ts               // CRUD for HydroponicSystem
      growCycles.ts            // CRUD for GrowCycle
      dailyLogs.ts            // CRUD for DailyLog
      photos.ts               // CRUD for Photo (with compression)
      insights.ts             // CRUD for Insight
    utils/
      imageCompression.ts     // Base64 encoding, thumbnail generation
      dateHelpers.ts          // Unix timestamp utilities
      storageQuota.ts         // Monitor IndexedDB storage usage
      financialCalculations.ts // ROI, profit margin, cost aggregation
```

### Storage Utility Layer

```typescript
// src/storage/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

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

export async function initDB() {
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

export async function getDB() {
  if (!dbInstance) {
    await initDB();
  }
  return dbInstance!;
}
```

```typescript
// src/storage/operations/systems.ts
import { getDB } from '../db';
import { HydroponicSystem } from '../models';

export async function createSystem(system: Omit<HydroponicSystem, 'id' | 'createdAt' | 'updatedAt'>): Promise<HydroponicSystem> {
  const db = await getDB();
  const now = Date.now();
  const newSystem: HydroponicSystem = {
    ...system,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    totalCycles: 0,
  };
  
  await db.add('systems', newSystem);
  return newSystem;
}

export async function getSystem(id: string): Promise<HydroponicSystem | undefined> {
  const db = await getDB();
  return db.get('systems', id);
}

export async function getAllSystems(): Promise<HydroponicSystem[]> {
  const db = await getDB();
  return db.getAll('systems');
}

export async function updateSystem(id: string, updates: Partial<HydroponicSystem>): Promise<void> {
  const db = await getDB();
  const system = await db.get('systems', id);
  if (!system) throw new Error('System not found');
  
  const updated = { ...system, ...updates, updatedAt: Date.now() };
  await db.put('systems', updated);
}

export async function deleteSystem(id: string): Promise<void> {
  const db = await getDB();
  // Check for dependent grow cycles
  const cycles = await db.getAllFromIndex('growCycles', 'by-system', id);
  if (cycles.length > 0) {
    throw new Error('Cannot delete system with existing grow cycles');
  }
  await db.delete('systems', id);
}
```

### Image Compression Strategy

```typescript
// src/storage/utils/imageCompression.ts

export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<{ base64: string; width: number; height: number; fileSize: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Scale down if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', quality);
        const fileSize = Math.ceil((base64.length * 3) / 4); // Approximate byte size
        
        resolve({ base64, width, height, fileSize });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function createThumbnail(base64: string, size: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d')!;
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = base64;
  });
}

// Storage quota monitoring
export async function getStorageStats(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
  estimatedPhotosRemaining: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = (usage / quota) * 100;
    
    // Estimate remaining photos (assume ~200KB per compressed photo)
    const avgPhotoSize = 200 * 1024; // 200KB
    const remaining = quota - usage;
    const estimatedPhotosRemaining = Math.floor(remaining / avgPhotoSize);
    
    return { usage, quota, percentUsed, estimatedPhotosRemaining };
  }
  
  return { usage: 0, quota: 0, percentUsed: 0, estimatedPhotosRemaining: 0 };
}
```

---

## Navigation Structure

### New Route Architecture

```typescript
// src/app/App.tsx - Updated sections array

type SectionType = 
  // Existing planning sections
  | 'hero' | 'problem' | 'solution' | 'partnerships' | 'crops' 
  | 'configurator' | 'financial' | 'summary' | 'dashboard' | 'vision'
  // New operations sections
  | 'operations-home' | 'system-detail' | 'cycle-detail' | 'insights' | 'analytics' | 'financial-model';

const sections: SectionType[] = [
  // Planning Flow (existing)
  'hero',
  'problem',
  'solution',
  'partnerships',
  'crops',
  'configurator',
  'financial',
  'summary',
  'dashboard',
  'vision',
];

// Operations sections are separate - accessed via dedicated nav
const operationsSections: SectionType[] = [
  'operations-home',     // System overview + recent activity
  'system-detail',       // Individual system dashboard (tabs: Overview, Costs, Results)
  'cycle-detail',        // Grow cycle timeline + daily logs + photos
  'insights',            // Insights database
  'analytics',           // Analytics dashboard with charts
  'financial-model',     // Complete financial projections
];
```

### Top Navigation Enhancement

```tsx
// src/app/components/TopNavigation.tsx (NEW COMPONENT)

export function TopNavigation() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'planning' | 'operations'>('planning');
  
  return (
    <div className="fixed top-1 left-0 right-0 z-[110] px-4 pt-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-white font-medium">HydroOps</span>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-white/5 rounded-full p-1">
              <button
                onClick={() => setMode('planning')}
                className={`px-4 py-2 rounded-full transition-all ${
                  mode === 'planning'
                    ? 'bg-green-500/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {t('nav.planning')}
              </button>
              <button
                onClick={() => setMode('operations')}
                className={`px-4 py-2 rounded-full transition-all ${
                  mode === 'operations'
                    ? 'bg-green-500/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {t('nav.operations')}
              </button>
            </div>
            
            {/* Language + Settings */}
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <button className="text-white/60 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Operations Home Structure

```
Operations Home View
├── Header
│   ├── "Your Hydroponic Systems"
│   ├── Quick stats: Total Revenue, Active Cycles, Total Harvest (kg)
│   └── "+ Create New System" button
│
├── Systems Grid (if systems exist)
│   ├── System Card A
│   │   ├── System name + type badge + status
│   │   ├── Current cycle info (crop, stage, days remaining)
│   │   ├── Quick metrics (total cycles, ROI %, hypothesis status)
│   │   ├── Mini cost/revenue indicators
│   │   └── "View Details" button
│   └── System Card B
│
├── Recent Activity Timeline
│   ├── Latest daily logs across all systems
│   ├── Harvest events with revenue
│   ├── New insights generated
│   └── System milestones (new cycle started, hypothesis validated)
│
└── Quick Actions
    ├── "Log Today's Observations"
    ├── "View Analytics Dashboard"
    ├── "View Insights Database"
    └── "View Financial Model"
```

---

## Phase-by-Phase Implementation

### **Phase 1: Foundation** (Week 1)

**Goal:** Establish IndexedDB layer, navigation structure, and Operations home skeleton

#### Tasks

1. **Install dependencies**
   ```bash
   pnpm add idb uuid
   pnpm add -D @types/uuid
   ```

2. **Create storage layer** (`src/storage/`)
   - `models.ts` - TypeScript interfaces
   - `db.ts` - IndexedDB initialization
   - `operations/systems.ts` - System CRUD
   - `operations/growCycles.ts` - Grow Cycle CRUD
   - `utils/dateHelpers.ts` - Timestamp utilities

3. **Add TopNavigation component**
   - Create `src/app/components/TopNavigation.tsx`
   - Add mode toggle (Planning / Operations)
   - Integrate with App.tsx state

4. **Create OperationsHomeSection**
   - File: `src/app/components/operations/OperationsHomeSection.tsx`
   - Empty state: "Create your first hydroponic system"
   - Systems grid layout (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
   - "+ Create New System" button (modal trigger)

5. **Create System Creation Modal**
   - Component: `src/app/components/operations/CreateSystemModal.tsx`
   - Multi-step form (3 steps):
     
     **Step 1: Basic Configuration**
     - System name
     - System type (dropdown: NFT, DWC, Ebb & Flow, Drip, Aeroponics)
     - Dimensions (length, width, height)
     - Capacity (channels, plants per channel)
     - Location
     
     **Step 2: Hypothesis & Variables (Optional)**
     - Hypothesis textarea - "What are you testing with this system?"
     - Variables array (add multiple):
       - Variable name (e.g., "LED Blue Spectrum %")
       - Your value (e.g., "40%")
       - Control/baseline value (e.g., "20% - industry standard")
     - Control setup description
     
     **Step 3: Operating Costs**
     - Equipment items (add multiple):
       - Name, category, cost, quantity
       - Optional: vendor, purchase link (Amazon URL), warranty
     - Recurring costs (add multiple):
       - Name, category, amount, frequency
     - Auto-calculate total capital cost and monthly operating cost
   
   - Validation
   - Save to IndexedDB via `createSystem()`
   - Success feedback with animation
   - Option to "Start First Grow Cycle" immediately

6. **Update App.tsx routing**
   - Add `operationsMode: boolean` state
   - Conditional rendering: Planning sections vs Operations sections
   - Persist mode preference in localStorage

#### Deliverables
- ✅ IndexedDB initialized and tested
- ✅ Can create/read/update/delete systems
- ✅ Top navigation with mode toggle works
- ✅ Operations home displays systems grid
- ✅ Can create new system via modal
- ✅ Data persists across browser sessions

#### UI Reference
- Dark background `bg-[#0a0a0a]`
- System cards: translucent panels `bg-white/5 backdrop-blur-sm border border-white/10`
- Hover states: `hover:bg-white/10 hover:border-white/20`
- Accent color: `green-500` for active elements
- Empty state: Large centered icon + text (subtle, architectural)

---

### **Phase 2: Core Tracking** (Week 2-3)

**Goal:** Grow cycle management, stage tracking, daily logging (without photos)

#### Tasks

1. **System Detail View**
   - Component: `src/app/components/operations/SystemDetailSection.tsx`
   - Header: System name, type, status badge, edit button
   - Stats cards:
     - Total grow cycles
     - Active experiments
     - Current cycle info
     - System health score (placeholder)
   - Grow cycles list (timeline view)
   - "+ Start New Grow Cycle" button

2. **Create Grow Cycle Flow**
   - Modal: `CreateGrowCycleModal.tsx`
   - Form fields:
     - Cycle name
     - Crop type (dropdown seeded from CropDatabase)
     - Seed date (date picker)
     - Initial plant count
     - Target harvest date (optional)
   - Auto-set `currentStage` to 'germination'
   - Create initial daily log entry automatically
   - Link to system via `systemId`

3. **Grow Cycle Detail View**
   - Component: `GrowCycleDetailSection.tsx`
   - Header: Cycle name, crop type, stage badge, elapsed time
   - **Stage Progress Timeline**
     - Horizontal timeline with 5 stages
     - Visual indicator of current stage
     - Timestamps for completed stages
     - "Advance to Next Stage" button
   - **Metrics Overview**
     - Grid of current metrics (latest daily log)
     - Trend indicators (up/down/stable)
   - **Daily Logs Feed**
     - Reverse chronological list
     - Each log shows: date, plant health, key metrics, notes preview
     - Click to expand full details
   - "+ Add Daily Log" floating action button

4. **Daily Log Entry Form**
   - Modal: `DailyLogEntryModal.tsx`
   - Environmental metrics inputs:
     - Temperature (°C)
     - Humidity (%)
     - pH (range: 5.0-7.0)
     - EC (mS/cm)
     - Water temp (°C)
     - Light level (PPFD)
   - Plant health selector (visual: 5-star rating style)
   - Notes textarea
   - Tasks performed (add multiple)
   - Issues log (severity + description)
   - Save to IndexedDB
   - Update grow cycle's `dailyLogCount`

5. **Timeline Visualization Component**
   - Component: `src/app/components/operations/Timeline.tsx`
   - Reusable timeline renderer
   - Props: `events: Array<{ date: number; title: string; type: string; }>`
   - Visual styles:
     - Vertical line on left
     - Event nodes as circles
     - Date labels + event titles
     - Color-coded by type (stage change, harvest, experiment start/end)

6. **Stage Advancement Logic**
   - Function: `advanceGrowCycleStage(cycleId: string, newStage: string)`
   - Update `stages[currentStage].endDate`
   - Update `stages[newStage].startDate`
   - Update `currentStage`
   - Create timeline event
   - Validation: Cannot skip stages

#### Deliverables
- ✅ Can create grow cycles linked to systems
- ✅ System detail page shows all cycles
- ✅ Grow cycle detail page with stage timeline
- ✅ Can add daily logs with full environmental metrics
- ✅ Timeline view shows cycle history
- ✅ Can advance through growth stages
- ✅ All data persists and loads correctly

#### UI Reference
- Stage timeline: Horizontal with connecting line, gradient fills for completed stages
- Metrics cards: Sensor-style readout with large number + unit + small trend graph (placeholder)
- Daily log feed: Card-based, translucent, compact
- Form inputs: Dark mode inputs with subtle borders, focus states with green accent

---

### **Phase 3: Photos & Financial Tracking** (Week 3-4)

**Goal:** Photo upload/storage, comparison views, cost tracking, system results & ROI

#### Tasks

1. **Storage layer for photos**
   - Complete `src/storage/operations/photos.ts`
   - Complete `src/storage/utils/imageCompression.ts`
   - Functions:
     - `createPhoto()` - Upload, compress, generate thumbnail, save
     - `getPhoto(id)` - Retrieve full photo
     - `getPhotosByGrowCycle(cycleId)` - Get all photos for timeline
     - `deletePhoto(id)` - Remove from IndexedDB
   - Implement compression: max 1200px width, 0.8 quality
   - Generate 150x150 thumbnails

2. **Photo Upload Component**
   - Component: `PhotoUploadButton.tsx`
   - Drag-and-drop zone or file input
   - Preview before saving
   - Caption input
   - Tags input (comma-separated)
   - Progress indicator during compression
   - Success animation
   - Link to current grow cycle + daily log (if applicable)

3. **Photo Gallery View**
   - Component: `PhotoGallery.tsx`
   - Masonry grid layout (responsive)
   - Thumbnail display with lazy loading
   - Click to open lightbox (full-size view)
   - Show caption, date, tags
   - Filter by date range or tags
   - Sort options (newest first, oldest first)

4. **Photo Timeline Scrubber**
   - Component: `PhotoTimelineScrubber.tsx`
   - Horizontal scrollable timeline
   - Thumbnail strip with dates
   - Drag to scrub through time
   - Shows selected photo large above
   - Side-by-side comparison mode (select 2 photos)
   - "Compare" button to enter split view

5. **Cost Tracking & Management**
   - Component: `SystemCostsSection.tsx` (tab in System Detail view)
   - Display equipment table (sortable, filterable)
   - Display recurring costs table
   - "Add Equipment" button → modal
   - "Add Recurring Cost" button → modal
   - Edit/delete existing costs
   - Visual breakdown: pie chart of cost categories
   - Total capital vs operating costs cards
   
6. **Cycle Financial Tracking**
   - Add to `GrowCycleDetailSection.tsx`:
     - Costs incurred during cycle (pulled from system costs + cycle-specific)
     - Revenue input (price per kg × harvest kg)
     - Profit margin calculation
     - Break-even analysis display
   - Modal: `RecordHarvestModal.tsx`
     - Harvest weight (kg)
     - Price per kg
     - Auto-calculate revenue
     - Notes/quality assessment
     - Update cycle status to 'completed'
     - Trigger cycle results calculation

7. **System Results Dashboard**
   - Component: `SystemResultsSection.tsx` (tab in System Detail view)
   - Aggregate data from all completed cycles:
     - Total harvest (kg)
     - Total revenue (USD)
     - ROI calculation: (total revenue - total costs) / total costs × 100
     - Average cycle duration
     - Success rate (completed / total cycles)
     - Best performing crop
   - Hypothesis validation section:
     - If system has hypothesis, show:
       - Original hypothesis
       - Variables tested
       - Actual results vs control (if control data available)
       - "Mark hypothesis as validated/invalidated" toggle
       - Key findings textarea
   - "Generate Insight" button (creates Insight from system results)

8. **Update Daily Log Modal**
   - Add photo upload section
   - Link photos to current daily log
   - Show uploaded photos as thumbnails in log cards
   - Add experiment notes field (if system has hypothesis)

9. **Storage Quota Monitor**
   - Component: `StorageQuotaIndicator.tsx`
   - Display in Operations settings or bottom corner
   - Show: Used / Total, percentage bar
   - Estimated photos remaining
   - Warning at 80% capacity
   - Link to photo cleanup tool (future)

#### Deliverables
- ✅ Photos can be uploaded, compressed, and stored
- ✅ Photo gallery displays all photos with filtering
- ✅ Timeline scrubber allows photo comparison
- ✅ Equipment and recurring costs can be tracked per system
- ✅ Harvest can be recorded with revenue calculation
- ✅ Cycle financial metrics display (costs, revenue, profit)
- ✅ System results dashboard shows ROI and performance
- ✅ Hypothesis validation interface works
- ✅ Photos link to daily logs
- ✅ Storage quota monitoring works

#### UI Reference
- Photo grid: Masonry layout, hover reveals caption overlay
- Lightbox: Fullscreen dark overlay, photo centered, caption below
- Timeline scrubber: Spotify-style horizontal strip, smooth drag
- Comparison view: Vertical split or side-by-side with sync zoom
- Experiment cards: Scientific feel - clean typography, data tables

---

### **Phase 4: Insights, Dashboard Integration & Polish** (Week 5)

**Goal:** Learning database, integrate existing operations dashboard, analytics, mobile optimization

#### Tasks

1. **Integrate Existing Operations Dashboard**
   - Update `DashboardSection.tsx` to work with real system data:
     - System selector dropdown (if multiple systems)
     - Pull latest daily log for environmental metrics
     - Display real temperature, humidity, pH, EC from latest log
     - System uptime calculation (days since cycle start)
     - Real-time plant count from active cycle
     - Harvest countdown (days until target harvest)
   - Add "Quick Log" button to dashboard for fast data entry
   - Link dashboard cards to detailed views
   - Add data freshness indicator ("Last updated 2 hours ago")
   - Auto-refresh suggestion if data is stale (> 24 hours)
   
2. **Complete Financial Model Integration**
   - Component: `CompleteFinancialModelSection.tsx`
   - Pulls data from:
     - System operating costs
     - All completed cycle revenues
     - Ongoing cycle projected revenues (based on current plant count × crop price)
   - Displays:
     - Monthly cost breakdown (equipment amortization + recurring costs)
     - Revenue projections (based on cycle timelines)
     - Cash flow timeline chart
     - ROI by system and by crop type
     - Break-even analysis
   - Export to CSV/PDF for business planning
   
3. **Insights Database**
   - Complete `src/storage/operations/insights.ts`
   - Auto-generation from completed cycles (when system results are finalized)
   - Manual insight creation form
   - Component: `InsightsDatabaseSection.tsx`
     - Grid of insight cards
     - Filter by category, crop type, tags, system type
     - Search bar
     - Sort by confidence, times applied, date, financial impact
   - Insight card shows:
     - Title, category badge
     - Description
     - Recommendation (if actionable)
     - Confidence level (visual indicator)
     - "Times Applied" counter
     - Financial impact (if applicable)
     - Tags
     - Source system/cycle link

4. **Insight Creation Flow**
   - Auto-create from system results (checkbox in results form)
   - Manual creation via "+ Add Insight" button
   - Form fields:
     - Title, category, description
     - System types (multi-select)
     - Crop types (multi-select)
     - Tags
     - Actionable toggle + recommendation field
     - Confidence level
     - Financial impact (optional: cost reduction or yield increase)
     - Data points backing the insight

5. **Analytics Dashboard**
   - Component: `AnalyticsDashboard.tsx`
   - Accessible from Operations home
   - Metrics:
     - Total systems active
     - Total grow cycles completed
     - Average cycle duration by crop type
     - Total harvest weight (all time)
     - Total revenue generated
     - Average ROI across all systems
     - Success rate (completed vs failed cycles)
     - Total insights generated
   - Charts (simple bar/line charts using `recharts`):
     - Revenue timeline (USD over time)
     - Harvest timeline (kg over time)
     - Cost vs revenue by month
     - Environmental metric trends (avg temp, pH, etc. by cycle)
     - Cycle duration by crop type (bar chart)
   - Filter by date range, system, crop type

6. **Pattern Recognition UI**
   - Component: `PatternInsights.tsx`
   - Analyze correlations across systems and cycles:
     - "NFT systems with pH 5.8-6.2 yield 15% more basil than those with pH > 6.5"
     - "Cycles with 18hr light completed 5 days faster on average"
     - "Systems with hypothesis testing have 22% higher ROI"
   - Simple algorithm:
     - Group daily logs by system type and crop type
     - Calculate averages for environmental metrics
     - Compare successful vs failed cycles
     - Surface differences > 15%
     - Correlate costs with yields
   - Display as insight cards with data backing
   - "Apply This" button to create actionable insight

7. **Mobile Optimization Pass**
   - Review all Operations components on mobile viewports
   - Ensure:
     - Single-column layouts on mobile
     - Touch-friendly tap targets (min 44x44px)
     - Swipe gestures for photo timeline scrubber
     - Collapsible sections for long forms
     - Bottom sheet modals instead of centered modals
     - Sticky headers with scroll shadows
   - Test photo upload on mobile (file input + camera access)

8. **Visual Polish**
   - Animations:
     - Fade-in for cards (stagger delay)
     - Slide-in for modals
     - Progress bar animations for stage timeline
     - Smooth transitions between sections
   - Micro-interactions:
     - Button hover states with subtle scale
     - Input focus states with glow
     - Success checkmarks with bounce
     - Loading skeletons for data fetching
   - Accessibility:
     - ARIA labels for all interactive elements
     - Keyboard navigation support
     - Focus visible outlines
     - Screen reader announcements for state changes

9. **Data Export Foundation** (Basic CSV)
   - Functions:
     - `exportGrowCycleCSV(cycleId: string)` - Daily logs export
     - `exportSystemFinancialsCSV(systemId: string)` - Costs and revenue
     - `exportAllDataJSON()` - Full backup of all IndexedDB data
   - CSV columns for cycle export: Date, Temp, Humidity, pH, EC, Plant Health, Notes, Tasks, Issues
   - CSV columns for financials: Item, Category, Cost, Quantity, Date, Type (equipment/recurring)
   - Download trigger buttons in respective detail views
   - (Photo/video export with data overlay deferred to future phase)

10. **Empty States & Onboarding**
   - Enhance empty states with:
     - Illustrations (using SVG or Unsplash images)
     - "Get Started" guide cards
     - Sample data import option (pre-populate demo system with cycle data)
   - First-time user flow:
     - Welcome modal on first Operations visit
     - Tooltip tour for key features (systems → cycles → logs → insights)
     - "Create Your First System" CTA prominently displayed
     - Link to configurator: "Design your system first" option

11. **Error Handling & Validation**
   - Add error boundaries to main sections
   - Form validation with helpful error messages
   - IndexedDB error handling (quota exceeded, connection failed)
   - Retry logic for failed operations
   - Toast notifications for success/error states

12. **Performance Optimization**
    - Lazy load photo thumbnails (IntersectionObserver)
    - Virtualize long lists (daily logs, photos) using `react-window`
    - Debounce search inputs
    - Cache frequently accessed data in React state
    - Minimize IndexedDB queries (batch reads where possible)

#### Deliverables
- ✅ Existing operations dashboard integrated with real system data
- ✅ Complete financial model shows ROI and projections
- ✅ Insights database populated from system results
- ✅ Analytics dashboard with revenue/cost/harvest charts
- ✅ Pattern recognition surfaces correlations across systems
- ✅ Mobile experience optimized
- ✅ Animations and micro-interactions polished
- ✅ CSV export works for cycles and financials
- ✅ JSON backup export for full data
- ✅ Empty states and onboarding implemented
- ✅ Error handling comprehensive
- ✅ Performance optimized for 100+ photos

---

## Integration with Existing System

### Configurator → Operations Bridge

When user completes system design in configurator, offer to save as operational system:

```typescript
// In ConfiguratorSection.tsx

function handleSaveSystemDesign() {
  // Show modal: "Save this system to Operations?"
  // Option 1: "Just save configuration" (simple save)
  // Option 2: "Set up for tracking" (opens CreateSystemModal with pre-filled config)
  
  const systemConfig = {
    name: `${systemType} System`,
    systemType: systemType as 'nft' | 'dwc' | 'ebb-flow' | 'drip' | 'aeroponics',
    dimensions: {
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
    },
    capacity: {
      channels: parseInt(channels),
      plantsPerChannel: parseInt(plantsPerChannel),
      totalPlants: parseInt(channels) * parseInt(plantsPerChannel),
    },
    location: location || 'Tulum',
    status: 'active' as const,
    
    // User can add in Operations:
    // - Hypothesis & variables (what are you testing?)
    // - Operating costs (equipment purchased, recurring costs)
    variables: [],
    operatingCosts: {
      equipment: [],
      recurringCosts: [],
      totalCapitalCost: 0,
      monthlyOperatingCost: 0,
    },
  };
  
  // Save to IndexedDB
  createSystem(systemConfig).then((system) => {
    toast.success(`System saved! Add costs and hypothesis in Operations.`);
    
    // Auto-switch to Operations mode
    setOperationsMode(true);
    setCurrentOperationsSection('system-detail');
    setSelectedSystemId(system.id);
  });
}
```

**Alternative:** Add "Hypothesis" and "Budget" tabs to configurator itself, making it a comprehensive system design + setup flow.

### Crop Database → Grow Cycle Bridge

When creating grow cycle, pre-populate crop selector from CropDatabase:

```typescript
// In CreateGrowCycleModal.tsx

const cropOptions = [
  { value: 'basil-genovese', label: 'Genovese Basil', growthDays: 28 },
  { value: 'lettuce-butterhead', label: 'Butterhead Lettuce', growthDays: 35 },
  // ... from existing crop database
];

// Auto-suggest harvest date based on crop
function handleCropSelect(cropType: string) {
  const crop = cropOptions.find(c => c.value === cropType);
  if (crop) {
    const suggestedHarvestDate = Date.now() + (crop.growthDays * 24 * 60 * 60 * 1000);
    setTargetHarvestDate(suggestedHarvestDate);
  }
}
```

---

## Technical Considerations

### IndexedDB Storage Capacity

- **Default quota:** ~10% of free disk space (varies by browser)
- **Typical available:** 1-10 GB on modern devices
- **Photo storage estimate:**
  - Compressed photo: ~150-300 KB (1200px wide, 0.8 quality)
  - Thumbnail: ~10-15 KB (150x150)
  - **14 photos/week × 52 weeks = 728 photos/year**
  - Storage needed: ~109-218 MB/year (well within quota)
  - Can support 5+ years of data without issues

### Migration Path to Supabase (Future)

When scaling to multi-device sync:

1. **Export function:** `exportAllDataJSON()`
   - Serialize all IndexedDB stores to JSON
   - Download as backup file
   
2. **Import to Supabase:**
   - Create matching PostgreSQL schema
   - Upload photos to Supabase Storage
   - Convert base64 to file URLs
   - Maintain same data structure for easy migration

3. **Dual-mode operation:**
   - Add `storageMode: 'local' | 'cloud'` setting
   - Abstract storage layer with interface
   - `LocalStorageAdapter` (IndexedDB) and `CloudStorageAdapter` (Supabase)
   - Swap adapter based on user preference

### Performance Targets

- Photo upload + compression: < 2 seconds
- Daily log save: < 500ms
- Timeline view render (100 events): < 1 second
- Photo gallery load (50 thumbnails): < 2 seconds with lazy loading
- IndexedDB query (all grow cycles for system): < 100ms

### Browser Compatibility

- IndexedDB: Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- `crypto.randomUUID()`: Polyfill for older browsers
- File API: Standard support for photo upload
- Storage API (`navigator.storage.estimate`): Fallback for unsupported browsers

---

## Translations (i18n)

Add to `src/app/contexts/LanguageContext.tsx`:

```typescript
operations: {
  title: 'Operations',
  home: 'Systems Overview',
  createSystem: 'Create New System',
  createCycle: 'Start Grow Cycle',
  createExperiment: 'New Experiment',
  addLog: 'Add Daily Log',
  addPhoto: 'Upload Photo',
  viewInsights: 'Insights Database',
  analytics: 'Analytics',
  
  // System fields
  systemName: 'System Name',
  systemType: 'System Type',
  dimensions: 'Dimensions (L × W × H)',
  capacity: 'Plant Capacity',
  location: 'Location',
  status: 'Status',
  
  // Grow cycle
  cycleName: 'Cycle Name',
  cropType: 'Crop Type',
  seedDate: 'Seed Date',
  harvestDate: 'Target Harvest Date',
  currentStage: 'Current Stage',
  plantCount: 'Plant Count',
  
  // Stages
  germination: 'Germination',
  rootDevelopment: 'Root Development',
  vegetativeGrowth: 'Vegetative Growth',
  flowering: 'Flowering',
  harvest: 'Harvest',
  
  // Daily log
  temperature: 'Temperature',
  humidity: 'Humidity',
  ph: 'pH Level',
  ec: 'EC (mS/cm)',
  waterTemp: 'Water Temperature',
  lightLevel: 'Light Level (PPFD)',
  plantHealth: 'Plant Health',
  notes: 'Notes',
  tasksPerformed: 'Tasks Performed',
  issues: 'Issues',
  
  // Experiments
  hypothesis: 'Hypothesis',
  variables: 'Variables',
  observations: 'Observations',
  results: 'Results',
  conclusion: 'Conclusion',
  recommendations: 'Recommendations',
  
  // Insights
  insights: 'Insights',
  category: 'Category',
  confidence: 'Confidence',
  timesApplied: 'Times Applied',
  actionable: 'Actionable',
},
```

Spanish translations (`es`):

```typescript
operations: {
  title: 'Operaciones',
  home: 'Resumen de Sistemas',
  createSystem: 'Crear Nuevo Sistema',
  createCycle: 'Iniciar Ciclo de Cultivo',
  createExperiment: 'Nuevo Experimento',
  addLog: 'Agregar Registro Diario',
  addPhoto: 'Subir Foto',
  viewInsights: 'Base de Conocimientos',
  analytics: 'Analíticas',
  
  systemName: 'Nombre del Sistema',
  systemType: 'Tipo de Sistema',
  dimensions: 'Dimensiones (L × A × H)',
  capacity: 'Capacidad de Plantas',
  location: 'Ubicación',
  status: 'Estado',
  
  cycleName: 'Nombre del Ciclo',
  cropType: 'Tipo de Cultivo',
  seedDate: 'Fecha de Siembra',
  harvestDate: 'Fecha Objetivo de Cosecha',
  currentStage: 'Etapa Actual',
  plantCount: 'Cantidad de Plantas',
  
  germination: 'Germinación',
  rootDevelopment: 'Desarrollo de Raíces',
  vegetativeGrowth: 'Crecimiento Vegetativo',
  flowering: 'Floración',
  harvest: 'Cosecha',
  
  temperature: 'Temperatura',
  humidity: 'Humedad',
  ph: 'Nivel de pH',
  ec: 'CE (mS/cm)',
  waterTemp: 'Temperatura del Agua',
  lightLevel: 'Nivel de Luz (PPFD)',
  plantHealth: 'Salud de las Plantas',
  notes: 'Notas',
  tasksPerformed: 'Tareas Realizadas',
  issues: 'Problemas',
  
  hypothesis: 'Hipótesis',
  variables: 'Variables',
  observations: 'Observaciones',
  results: 'Resultados',
  conclusion: 'Conclusión',
  recommendations: 'Recomendaciones',
  
  insights: 'Conocimientos',
  category: 'Categoría',
  confidence: 'Confianza',
  timesApplied: 'Veces Aplicado',
  actionable: 'Accionable',
},
```

---

## File Structure Summary

```
src/
  storage/
    db.ts                           // IndexedDB setup
    models.ts                       // TypeScript interfaces
    operations/
      systems.ts
      growCycles.ts
      experiments.ts
      dailyLogs.ts
      photos.ts
      insights.ts
    utils/
      imageCompression.ts
      dateHelpers.ts
      storageQuota.ts
  
  app/
    App.tsx                         // Updated with Operations mode routing
    
    components/
      TopNavigation.tsx             // Planning/Operations toggle
      
      operations/
        OperationsHomeSection.tsx       // System overview
        SystemDetailSection.tsx         // Individual system with tabs
        SystemCostsSection.tsx          // Equipment & recurring costs
        SystemResultsSection.tsx        // ROI, hypothesis validation, performance
        GrowCycleDetailSection.tsx      // Cycle timeline + logs
        InsightsDatabaseSection.tsx     // Learning database
        AnalyticsDashboard.tsx          // Charts and metrics
        CompleteFinancialModelSection.tsx // Full financial projections
        
        Timeline.tsx                    // Reusable timeline component
        PhotoGallery.tsx                // Masonry photo grid
        PhotoTimelineScrubber.tsx       // Photo comparison tool
        StorageQuotaIndicator.tsx       // Storage monitor
        PatternInsights.tsx             // Correlation detector
        
        modals/
          CreateSystemModal.tsx         // Multi-step: config, hypothesis, costs
          CreateGrowCycleModal.tsx
          DailyLogEntryModal.tsx
          RecordHarvestModal.tsx        // Record harvest with revenue
          AddEquipmentModal.tsx
          AddRecurringCostModal.tsx
          PhotoUploadButton.tsx
          CreateInsightModal.tsx
      
      DashboardSection.tsx              // Updated to use real data
      
      // Existing components...
      HeroSection.tsx
      ProblemStatementSection.tsx
      SolutionSection.tsx
      // ... etc
```

---

## Success Metrics

### Phase 1
- [ ] User can create systems with hypothesis and operating costs
- [ ] Equipment and recurring costs tracked
- [ ] Data persists across browser sessions
- [ ] Mode toggle switches between Planning/Operations
- [ ] System cards display cost and configuration data

### Phase 2
- [ ] User can start grow cycles with crop selection
- [ ] Stage advancement works correctly
- [ ] Daily logs capture all environmental metrics and observations
- [ ] Timeline visualizes cycle history
- [ ] Can view all logs for a cycle chronologically

### Phase 3
- [ ] Photos upload, compress, and display
- [ ] Timeline scrubber allows photo comparison
- [ ] Equipment/costs can be added and edited
- [ ] Harvest can be recorded with revenue
- [ ] Cycle financial metrics calculate correctly
- [ ] System results show ROI and performance
- [ ] Hypothesis validation interface works
- [ ] Storage quota never exceeds 500MB for typical use

### Phase 4
- [ ] Existing operations dashboard pulls real system data
- [ ] Complete financial model integrates all systems
- [ ] Insights database populated from system results
- [ ] Analytics dashboard shows revenue, costs, harvest trends
- [ ] Pattern recognition identifies correlations
- [ ] Mobile experience feels native
- [ ] CSV export generates valid cycle and financial data
- [ ] JSON backup works for full data export

---

## Next Steps After Plan Approval

1. **Review this plan with user** - Confirm architecture, priorities, design direction
2. **Phase 1 kickoff** - Install dependencies, create storage layer
3. **Incremental builds** - Complete each phase, test thoroughly, get user feedback
4. **Iterate** - Adjust based on real-world usage and user input

---

## Notes

- **Local-first approach** maximizes simplicity and user privacy
- **IndexedDB is robust** for this use case (proven in apps like Figma, VSCode)
- **Photo compression** keeps storage manageable (14 photos/week = ~200 MB/year)
- **Modular architecture** allows easy feature additions
- **Future Supabase migration** is straightforward due to clean data layer abstraction
- **Design language** balances technical precision with creative expression

---

**End of Plan**
