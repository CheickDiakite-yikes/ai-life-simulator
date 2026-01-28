import { GameState, GameMode, LifeEvent } from '../types';
import { logDebug, logError } from './logger';

const API_BASE = '/api';

export interface SavedGame {
  id: number;
  userId: number;
  name: string;
  mode: string;
  theme: string | null;
  gameDate: string | null;
  timeStep: string | null;
  character: any;
  currentEvent: any;
  history: any;
  createdAt: string;
  updatedAt: string;
}

const generateSaveName = (gameState: GameState): string => {
  const modeNames: Record<string, string> = {
    [GameMode.REAL_LIFE]: 'Random Life',
    [GameMode.FAKE]: 'Custom',
    [GameMode.ALTERNATIVE]: 'Alternative'
  };
  
  const modeName = modeNames[gameState.mode] || 'Life';
  const charName = gameState.character?.name || 'Unknown';
  const location = gameState.character?.location?.split(',')[0] || '';
  
  return `${modeName}: ${charName}${location ? ` - ${location}` : ''}`;
};

export const saveGame = async (gameState: GameState, existingSaveId?: number): Promise<SavedGame> => {
  const saveName = generateSaveName(gameState);
  
  const gameStateData = {
    mode: gameState.mode,
    theme: gameState.theme,
    currentDate: gameState.currentDate,
    timeStep: gameState.timeStep,
    character: gameState.character,
    currentEvent: gameState.currentEvent,
    history: gameState.history
  };
  
  try {
    if (existingSaveId) {
      const response = await fetch(`${API_BASE}/saves/${existingSaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameState: gameStateData })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error('Failed to update save');
      }
      
      const save = await response.json();
      logDebug('Updated save', { saveId: existingSaveId });
      return save;
    } else {
      const response = await fetch(`${API_BASE}/saves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          saveName,
          gameState: gameStateData
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated');
        }
        throw new Error('Failed to create save');
      }
      
      const save = await response.json();
      logDebug('Created new save', { saveId: save.id });
      return save;
    }
  } catch (error) {
    logError('Failed to save game', error);
    throw error;
  }
};

export const loadSavedGames = async (): Promise<SavedGame[]> => {
  try {
    const response = await fetch(`${API_BASE}/saves`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return [];
      }
      throw new Error('Failed to load saves');
    }
    
    const saves = await response.json();
    logDebug('Loaded saved games', { count: saves.length });
    return saves;
  } catch (error) {
    logError('Failed to load saved games', error);
    return [];
  }
};

export const loadGame = async (saveId: number): Promise<GameState | null> => {
  try {
    const response = await fetch(`${API_BASE}/save/${saveId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to load save');
    }
    
    const save = await response.json();
    
    if (!save || !save.character) {
      throw new Error('Invalid save data');
    }
    
    const gameState: GameState = {
      character: save.character,
      history: (save.history as LifeEvent[]) || [],
      currentEvent: save.currentEvent,
      currentDate: save.gameDate || '',
      timeStep: (save.timeStep || 'Year') as any,
      isLoading: false,
      mode: save.mode as GameMode,
      theme: save.theme || 'modern'
    };
    
    logDebug('Loaded game', { saveId, characterName: gameState.character?.name, historyLength: gameState.history.length });
    return gameState;
  } catch (error) {
    logError('Failed to load game', error);
    return null;
  }
};

export const deleteSavedGame = async (saveId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/saves/${saveId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete save');
    }
    
    logDebug('Deleted save', { saveId });
    return true;
  } catch (error) {
    logError('Failed to delete save', error);
    return false;
  }
};

export const formatSaveDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};
