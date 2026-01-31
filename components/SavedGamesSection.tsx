import React, { useState } from 'react';
import { Play, Trash2, Clock, MapPin, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  if (savedGames.length === 0) {
    return null;
  }

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case GameMode.REAL_LIFE:
        return 'RND';
      case GameMode.FAKE:
        return 'CUS';
      case GameMode.ALTERNATIVE:
        return 'ALT';
      default:
        return 'LIFE';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case GameMode.REAL_LIFE:
        return 'bg-blue-900/60 text-blue-300 border-blue-700/50';
      case GameMode.FAKE:
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';
      case GameMode.ALTERNATIVE:
        return 'bg-purple-900/60 text-purple-300 border-purple-700/50';
      default:
        return 'bg-amber-900/60 text-amber-300 border-amber-700/50';
    }
  };

  const nextSave = () => {
    setCurrentIndex((prev) => (prev + 1) % savedGames.length);
  };

  const prevSave = () => {
    setCurrentIndex((prev) => (prev - 1 + savedGames.length) % savedGames.length);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSave();
    } else if (isRightSwipe) {
      prevSave();
    }
  };

  const currentSave = savedGames[currentIndex];
  const gameState = currentSave.character ? currentSave : (currentSave as any).gameState || currentSave;
  const character = gameState?.character || {};
  const isLoadingThis = loadingGameId === currentSave.id;
  const isRecent = currentIndex === 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-4 pb-3 md:pb-4 pt-2 md:pt-4 mt-2 md:mt-4 z-30 flex-shrink-0 border-t border-amber-700/20">
      <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
        <div className="h-px w-4 md:w-6 bg-amber-600/40"></div>
        <h2 className="text-[10px] md:text-xs font-heading text-amber-500/80 uppercase tracking-wider md:tracking-widest">
          Continue Your Journey
        </h2>
        <div className="h-px w-4 md:w-6 bg-amber-600/40"></div>
      </div>
      
      <div 
        className="relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {savedGames.length > 1 && (
          <>
            <button
              onClick={prevSave}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1 md:p-1.5 bg-stone-800/90 backdrop-blur-sm border border-amber-700/40 rounded-full text-amber-400 hover:bg-stone-700 transition-colors shadow-lg -translate-x-1 md:-translate-x-2"
              aria-label="Previous save"
            >
              <ChevronLeft size={14} className="md:hidden" />
              <ChevronLeft size={16} className="hidden md:block" />
            </button>
            
            <button
              onClick={nextSave}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-1 md:p-1.5 bg-stone-800/90 backdrop-blur-sm border border-amber-700/40 rounded-full text-amber-400 hover:bg-stone-700 transition-colors shadow-lg translate-x-1 md:translate-x-2"
              aria-label="Next save"
            >
              <ChevronRight size={14} className="md:hidden" />
              <ChevronRight size={16} className="hidden md:block" />
            </button>
          </>
        )}

        <div className="mx-5 md:mx-6">
          <div
            className={`
              bg-stone-900/80 backdrop-blur-sm border rounded-lg overflow-hidden
              transition-all duration-300
              ${isRecent ? 'border-amber-600/50' : 'border-stone-700/50'}
            `}
          >
            {isRecent && (
              <div className="absolute top-0 left-5 right-5 md:left-6 md:right-6 h-0.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 rounded-t-lg"></div>
            )}
            
            <div className="p-2.5 md:p-3">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-stone-800 border-2 border-stone-600 flex items-center justify-center text-sm md:text-base font-heading text-stone-300 shadow-inner flex-shrink-0">
                  {character.name?.charAt(0) || '?'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-0.5">
                    <h3 className="text-xs md:text-sm font-semibold text-stone-200 truncate font-heading">
                      {character.name || 'Unknown'}
                    </h3>
                    <span className={`px-1 md:px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-heading tracking-wider border flex-shrink-0 ${getModeColor(currentSave.mode)}`}>
                      {getModeLabel(currentSave.mode)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] text-stone-500">
                    {character.age !== undefined && (
                      <span>Age {character.age}</span>
                    )}
                    {character.location && (
                      <>
                        <span className="text-stone-700">•</span>
                        <span className="flex items-center gap-0.5 md:gap-1">
                          <MapPin size={8} className="flex-shrink-0 md:hidden" />
                          <MapPin size={9} className="flex-shrink-0 hidden md:block" />
                          <span className="truncate max-w-[80px] md:max-w-[100px]">{character.location.split(',')[0]}</span>
                        </span>
                      </>
                    )}
                    <span className="text-stone-700">•</span>
                    <span className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                      <Clock size={8} className="md:hidden" />
                      <Clock size={9} className="hidden md:block" />
                      {formatSaveDate(currentSave.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-700/50">
                <button
                  onClick={() => onLoadGame(currentSave.id)}
                  disabled={isLoading}
                  className={`
                    flex-1 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-heading tracking-wider uppercase transition-all duration-200
                    disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2 shadow-lg
                    ${isRecent 
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border border-amber-500/30 shadow-amber-900/40' 
                      : 'bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-700 text-stone-200 border border-stone-600/50 shadow-stone-900/40'
                    }
                  `}
                >
                  {isLoadingThis ? (
                    <>
                      <Loader2 size={10} className="animate-spin md:hidden" />
                      <Loader2 size={12} className="animate-spin hidden md:block" />
                      <span>Loading</span>
                    </>
                  ) : (
                    <>
                      <Play size={9} fill="currentColor" className="md:hidden" />
                      <Play size={10} fill="currentColor" className="hidden md:block" />
                      {isRecent ? 'Resume' : 'Continue'}
                    </>
                  )}
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteGame(currentSave.id); }}
                  className="p-2 md:p-2.5 text-stone-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg md:rounded-xl transition-all duration-200 border border-stone-700/50 hover:border-red-800/30"
                  title="Delete save"
                >
                  <Trash2 size={14} className="md:hidden" />
                  <Trash2 size={16} className="hidden md:block" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {savedGames.length > 1 && (
          <div className="flex justify-center gap-1 md:gap-1.5 mt-1.5 md:mt-2">
            {savedGames.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-amber-500 w-2 md:w-3' 
                    : 'bg-stone-600 hover:bg-stone-500'
                }`}
                aria-label={`Go to save ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
