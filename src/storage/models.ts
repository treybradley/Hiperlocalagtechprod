// Core data models for HydroponicOps system

export interface HydroponicSystem {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;

  // Configuration
  systemType: 'nft' | 'dwc' | 'ebb-flow' | 'drip' | 'aeroponics';
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  capacity: {
    channels: number;
    plantsPerChannel: number;
    totalPlants: number;
  };
  location: string;
  status: 'active' | 'inactive' | 'maintenance';

  // Experiment/Hypothesis Fields (each system is an experiment)
  hypothesis?: string;
  variables: Array<{
    name: string;
    value: string;
    controlValue?: string;
  }>;
  controlSetup?: {
    description: string;
    source: string;
  };

  // Operating Costs & Financial Tracking
  operatingCosts: {
    equipment: Array<{
      id: string;
      name: string;
      category: 'lighting' | 'pumps' | 'nutrients' | 'seeds' | 'structure' | 'sensors' | 'other';
      cost: number;
      quantity: number;
      vendor?: string;
      purchaseLink?: string;
      purchaseDate?: number;
      warrantyMonths?: number;
    }>;
    recurringCosts: Array<{
      id: string;
      name: string;
      category: 'utilities' | 'nutrients' | 'maintenance' | 'labor' | 'other';
      amount: number;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    }>;
    totalCapitalCost: number;
    monthlyOperatingCost: number;
  };

  // Results & Performance
  results?: {
    totalHarvestKg: number;
    totalRevenue: number;
    roi: number;
    cyclesCompleted: number;
    avgCycleDuration: number;
    successRate: number;
    keyFindings: string;
    wouldRecommend: boolean;
  };

  // References
  activeCycleId?: string;
  totalCycles: number;
}

export interface GrowCycle {
  id: string;
  systemId: string;
  name: string;
  createdAt: number;
  updatedAt: number;

  cropType: string;
  seedDate: number;
  harvestDate?: number;

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
  harvestRevenue?: number;

  // Performance tracking
  dailyLogCount: number;
  photoCount: number;
  issueCount: number;
  resolvedIssueCount: number;

  // Cycle results
  cycleResults?: {
    success: boolean;
    yieldPerPlant: number;
    cycleDuration: number;
    totalCost: number;
    profitMargin: number;
    lessonsLearned: string;
  };

  status: 'planning' | 'active' | 'completed' | 'failed';
}

export interface DailyLog {
  id: string;
  growCycleId: string;
  systemId: string;
  timestamp: number;
  createdAt: number;

  // Environmental metrics
  environment: {
    temperature?: number;
    humidity?: number;
    ph?: number;
    ec?: number;
    waterTemp?: number;
    lightLevel?: number;
  };

  // Observations
  plantHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  observations: string;
  visualChanges?: string;

  // Tasks performed
  tasksPerformed: Array<{
    task: string;
    timestamp: number;
  }>;

  // Issues & resolutions
  issues: Array<{
    severity: 'low' | 'medium' | 'high';
    description: string;
    resolved: boolean;
    resolution?: string;
  }>;

  // Photos
  photoIds: string[];

  // Resource usage
  waterAdded?: number;
  nutrientsAdded?: string;

  // Experiment notes
  experimentNotes?: string;
}

export interface Photo {
  id: string;
  timestamp: number;
  createdAt: number;

  // Relationships
  systemId: string;
  growCycleId: string;
  dailyLogId?: string;

  // Image data
  imageData: string;
  thumbnail?: string;

  // Metadata
  caption?: string;
  tags: string[];

  // Photo details
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface Insight {
  id: string;
  createdAt: number;
  updatedAt: number;

  // Source
  sourceType: 'system' | 'cycle' | 'manual';
  sourceId?: string;

  // Content
  title: string;
  category: 'success' | 'failure' | 'observation' | 'optimization' | 'cost-saving';
  description: string;

  // Context
  systemTypes: string[];
  cropTypes: string[];
  tags: string[];

  // Financial impact
  financialImpact?: {
    type: 'cost-reduction' | 'yield-increase' | 'efficiency-gain';
    estimatedValue: number;
    unit: 'usd' | 'percent';
  };

  // Application
  actionable: boolean;
  recommendation?: string;

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
