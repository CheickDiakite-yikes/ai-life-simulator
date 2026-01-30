import React, { useRef, useState, useEffect } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [savedGames]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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

  const needsScrolling = savedGames.length > 2;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-4 mt-4 z-30 flex-shrink-0 border-t border-amber-700/20">
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="h-px w-6 bg-amber-600/40"></div>
        <h2 className="text-xs font-heading text-amber-500/80 uppercase tracking-widest">
          Continue Your Journey
        </h2>
        <div className="h-px w-8 bg-amber-600/30"></div>
      </div>
      
      <div className="relative group/container">
        {needsScrolling && canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-stone-900/90 backdrop-blur-sm border border-stone-700 rounded-full text-stone-300 hover:text-amber-400 hover:border-amber-700/50 transition-all shadow-lg -translate-x-1/2"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        
        {needsScrolling && canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-stone-900/90 backdrop-blur-sm border border-stone-700 rounded-full text-stone-300 hover:text-amber-400 hover:border-amber-700/50 transition-all shadow-lg translate-x-1/2"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {needsScrolling && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0c0a09] to-transparent pointer-events-none z-10 transition-opacity" style={{ opacity: canScrollLeft ? 1 : 0 }}></div>
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0c0a09] to-transparent pointer-events-none z-10 transition-opacity" style={{ opacity: canScrollRight ? 1 : 0 }}></div>
          </>
        )}
        
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollButtons}
          className={`
            flex gap-3 pb-2
            ${needsScrolling ? 'overflow-x-auto snap-x snap-mandatory' : 'flex-wrap justify-center'}
          `}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {savedGames.map((save, index) => {
            const gameState = save.character ? save : (save as any).gameState || save;
            const character = gameState?.character || {};
            const isLoadingThis = loadingGameId === save.id;
            const isRecent = index === 0;
            
            return (
              <div
                key={save.id}
                className={`
                  group relative snap-start
                  bg-stone-900/80 backdrop-blur-sm border rounded-lg overflow-hidden
                  transition-all duration-300 hover:border-amber-600/60
                  ${needsScrolling ? 'flex-shrink-0 w-[300px] sm:w-[340px]' : 'flex-1 min-w-[280px] max-w-[400px]'}
                  ${isRecent ? 'border-amber-600/50' : 'border-stone-700/50'}
                `}
              >
                {isRecent && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600"></div>
                )}
                
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-stone-800 border-2 border-stone-600 flex items-center justify-center text-lg font-heading text-stone-300 shadow-inner flex-shrink-0">
                      {character.name?.charAt(0) || '?'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-stone-200 truncate font-heading">
                          {character.name || 'Unknown'}
                        </h3>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-heading tracking-wider border flex-shrink-0 ${getModeColor(save.mode)}`}>
                          {getModeLabel(save.mode)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] text-stone-500">
                        {character.age !== undefined && (
                          <span>Age {character.age}</span>
                        )}
                        {character.location && (
                          <>
                            <span className="text-stone-700">•</span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin size={9} className="flex-shrink-0" />
                              <span className="truncate">{character.location.split(',')[0]}</span>
                            </span>
                          </>
                        )}
                        <span className="text-stone-700">•</span>
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Clock size={9} />
                          {formatSaveDate(save.updatedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onLoadGame(save.id)}
                        disabled={isLoading}
                        className={`
                          px-4 py-2 rounded-lg text-xs font-heading tracking-wide transition-all 
                          disabled:opacity-50 flex items-center gap-2
                          ${isRecent 
                            ? 'bg-amber-700/80 hover:bg-amber-600 border border-amber-600/50 text-amber-100' 
                            : 'bg-stone-800 hover:bg-amber-900/50 border border-stone-700 hover:border-amber-700/50 text-stone-300 hover:text-amber-200'
                          }
                        `}
                      >
                        {isLoadingThis ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span className="hidden sm:inline">Loading</span>
                          </>
                        ) : (
                          <>
                            <Play size={10} fill="currentColor" />
                            {isRecent ? 'Resume' : 'Continue'}
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteGame(save.id); }}
                        className="p-2 text-stone-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-60 hover:opacity-100"
                        title="Delete save"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {savedGames.length > 2 && (
        <p className="text-center text-[10px] text-stone-600 mt-2 font-serif italic sm:hidden">
          Swipe to see more
        </p>
      )}
    </div>
  );
};
