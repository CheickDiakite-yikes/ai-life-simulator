export enum GameMode {
  REAL_LIFE = 'REAL_LIFE',
  FAKE = 'FAKE',
  ALTERNATIVE = 'ALTERNATIVE',
}

export type TimeStep = 'Day' | 'Week' | 'Month' | 'Year';
export type LifeStage = 'Infancy' | 'Childhood' | 'Adolescence' | 'YoungAdult' | 'Midlife' | 'Elderhood';
export type RealismIntensity = 'gentle' | 'true' | 'harsh';
export type AltGenre = 'fantasy' | 'scifi' | 'superhero' | 'horror';

export type WorldRegion = 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania' | 'MiddleEast';

export interface BirthWeightingConfig {
  mode: 'global' | 'balanced' | 'custom';
  weights: Record<WorldRegion, number>;
}

export interface SimulationConfig {
  birthConfig: BirthWeightingConfig;
  realismIntensity: RealismIntensity;
  researchMode: boolean;
  showCausality: boolean;
}

export interface CharacterAttributes {
  health: number;
  happiness: number; // Mapped to "Mental" in UI
  personalWealth: number; // Liquid cash available to the character
  familyWealth: number; // Household resources/safety net
  intelligence: number;
  social: number;
  energy: number;
}

export interface OpportunitySystems {
  healthcareAccess: number; // 0-100
  schoolQuality: number; // 0-100
  laborMarket: number; // 0-100
  safety: number; // 0-100
  discrimination: number; // 0-100 (higher = more discrimination pressure)
  socialCapital: number; // 0-100
  migrationPolicy: number; // 0-100
  housingStability: number; // 0-100
}

export interface EducationStatus {
  level: 'None' | 'Primary' | 'Secondary' | 'Tertiary' | 'Vocational' | 'Postgraduate';
  enrolled: boolean;
  institutionQuality?: number; // 0-100
}

export interface CareerStatus {
  status: 'Unemployed' | 'Student' | 'Employed' | 'SelfEmployed' | 'Caretaker' | 'Retired';
  sector?: string;
  stability?: number; // 0-100
}

export interface RelationshipStatus {
  status: 'Single' | 'Dating' | 'Partnered' | 'Married' | 'Separated' | 'Widowed';
  dependents?: number;
  caregiverLoad?: number; // 0-100
}

export interface LegacyMetrics {
  children?: number;
  communityReputation?: number; // 0-100
  culturalImpact?: number; // 0-100
  generationalWealth?: number; // 0-100
}

export interface DriveStats {
  belonging: number; // 0-100
  mastery: number; // 0-100
  autonomy: number; // 0-100
  meaning: number; // 0-100
}

export interface ResearchAnalysis {
  summary: string;
  systemicFactors?: string[];
  agencyNotes?: string[];
  uncertainty?: string;
}

export interface NewsItem {
  headline: string;
  category: string;
  date: string;
}

export interface CausalFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  evidence?: string;
}

export interface NarrativeArc {
  id: string;
  title: string;
  theme: 'mentor' | 'illness' | 'migration' | 'passion' | 'injustice' | 'love' | 'loss' | 'calling';
  status: 'emerging' | 'active' | 'resolved';
  intensity: number; // 0-100
  milestones?: string[];
}

export interface MacroEvent {
  headline: string;
  category: 'CLIMATE' | 'ECONOMY' | 'TECH' | 'POLITICS' | 'CONFLICT' | 'HEALTH' | 'SOCIAL';
  scope: 'global' | 'regional' | 'local';
  date: string;
  impactSummary?: string;
}

export interface Character {
  name: string;
  age: number;
  birthday: string; // YYYY-MM-DD
  gender: string;
  ethnicity: string; // Crucial for intersectional realism
  location: string;
  occupation: string;
  attributes: CharacterAttributes;
  bio: string;
  inventory: string[];
  relationships: { name: string; relation: string; status: string }[];
  statusEffects: string[]; // e.g., "Sick", "Married", "Superpowered"
  // Hidden metrics for long-term consequence tracking (e.g., { "lung_damage": 15, "criminal_risk": 5 })
  hiddenMetrics: Record<string, number>;
  lifeStage?: LifeStage;
  education?: EducationStatus;
  career?: CareerStatus;
  relationshipStatus?: RelationshipStatus;
  systems?: OpportunitySystems;
  legacy?: LegacyMetrics;
  drives?: DriveStats;
  altGenre?: AltGenre;
}

export interface LifeEvent {
  year: number;
  date: string; // YYYY-MM-DD
  description: string;
  visualPrompt?: string; // Specific prompt for generating images/video
  type: 'neutral' | 'positive' | 'negative' | 'major';
  choices?: Choice[];
  selectedChoice?: string; // The text of the choice the user made to reach this event
  news?: NewsItem[]; 
  causes?: CausalFactor[];
  counterfactuals?: string[];
  macroEvents?: MacroEvent[];
  lifeStage?: LifeStage;
  milestones?: string[];
  analysis?: ResearchAnalysis;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
}

export interface Choice {
  id: string;
  text: string;
  consequenceHint?: string;
}

export interface GameState {
  character: Character;
  history: LifeEvent[];
  currentEvent: LifeEvent | null;
  currentDate: string; // YYYY-MM-DD
  timeStep: TimeStep;
  isLoading: boolean;
  mode: GameMode;
  theme: string; // "modern", "fantasy", "scifi"
  config: SimulationConfig;
  storyArcs: NarrativeArc[];
}

// Gemini specific types for better type safety in components
export type ImageAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9" | "2:3" | "3:2";
export type ImageResolution = "1K" | "2K" | "4K";
export type VideoAspectRatio = "16:9" | "9:16";
