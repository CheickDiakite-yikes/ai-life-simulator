import React from 'react';
import { Play, Trash2, Clock, User, MapPin, Loader2 } from 'lucide-react';
import { SavedGame, formatSaveDate } from '../services/saveGameService';
import { GameMode } from '../types';

interface SavedGamesSectionProps {
  savedGames: SavedGame[];
  onLoadGame: (saveId: number) => void;
  onDeleteGame: (saveId: number) => void;
  isLoading: boolean;
  loadingGameId: number | null;
}

export const SavedGamesSection: React.FC<SavedGamesSectionProps> = ({
  savedGames,
  onLoadGame,
  onDeleteGame,
  isLoading,
  loadingGameId
}) => {
  if (savedGames.length === 0) {
    return null;
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case GameMode.REAL_LIFE:
        return '🎲';
      case GameMode.FAKE:
        return '✨';
      case GameMode.ALTERNATIVE:
        return '🪄';
      default:
        return '📖';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case GameMode.REAL_LIFE:
        return 'Random';
      case GameMode.FAKE:
        return 'Custom';
      case GameMode.ALTERNATIVE:
        return 'Alt';
      default:
        return 'Life';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-6 z-10">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="h-px w-8 bg-amber-600/30"></div>
        <h2 className="text-sm font-heading text-stone-400 uppercase tracking-widest">
          Continue Your Journey
        </h2>
        <div className="h-px w-8 bg-amber-600/30"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {savedGames.slice(0, 6).map((save) => {
          const gameState = save.character ? save : (save as any).gameState || save;
          const character = gameState?.character || {};
          const isLoadingThis = loadingGameId === save.id;
          
          return (
            <div
              key={save.id}
              className="group relative bg-stone-900/80 backdrop-blur-sm border border-stone-700/50 rounded-lg p-3 hover:border-amber-700/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg flex-shrink-0">{getModeIcon(save.mode)}</span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-stone-200 truncate font-heading">
                        {character.name || 'Unknown'}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-stone-500">
                        <span className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-500/80 font-heading">
                          {getModeLabel(save.mode)}
                        </span>
                        {character.age !== undefined && (
                          <span className="text-stone-500">Age {character.age}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteGame(save.id); }}
                    className="p-1.5 text-stone-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete save"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 text-[10px] text-stone-500 mb-3">
                  {character.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={10} className="flex-shrink-0" />
                      <span className="truncate">{character.location.split(',')[0]}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Clock size={10} />
                    {formatSaveDate(save.updatedAt)}
                  </span>
                </div>
                
                <button
                  onClick={() => onLoadGame(save.id)}
                  disabled={isLoading}
                  className="w-full py-2 bg-amber-900/30 hover:bg-amber-800/50 border border-amber-700/30 hover:border-amber-600/50 rounded text-xs text-amber-200 font-heading tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoadingThis ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play size={12} fill="currentColor" />
                      Continue
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {savedGames.length > 6 && (
        <p className="text-center text-xs text-stone-600 mt-3 font-serif italic">
          Showing 6 of {savedGames.length} saved games
        </p>
      )}
    </div>
  );
};
