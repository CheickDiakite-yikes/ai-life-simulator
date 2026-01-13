export enum GameMode {
  REAL_LIFE = 'REAL_LIFE',
  FAKE = 'FAKE',
  ALTERNATIVE = 'ALTERNATIVE',
}

export type TimeStep = 'Day' | 'Week' | 'Month' | 'Year';

export interface CharacterAttributes {
  health: number;
  happiness: number; // Mapped to "Mental" in UI
  personalWealth: number; // Liquid cash available to the character
  familyWealth: number; // Household resources/safety net
  intelligence: number;
  social: number;
  energy: number;
}

export interface NewsItem {
  headline: string;
  category: string;
  date: string;
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
}

// Gemini specific types for better type safety in components
export type ImageAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9" | "2:3" | "3:2";
export type ImageResolution = "1K" | "2K" | "4K";
export type VideoAspectRatio = "16:9" | "9:16";
