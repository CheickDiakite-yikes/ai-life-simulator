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
      const cardWidth = 200;
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
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
        return 'bg-blue-900/50 text-blue-300 border-blue-700/50';
      case GameMode.FAKE:
        return 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50';
      case GameMode.ALTERNATIVE:
        return 'bg-purple-900/50 text-purple-300 border-purple-700/50';
      default:
        return 'bg-amber-900/50 text-amber-300 border-amber-700/50';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-6 z-10">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="h-px w-8 bg-amber-600/30"></div>
        <h2 className="text-sm font-heading text-stone-400 uppercase tracking-widest">
          Continue Your Journey
        </h2>
        <div className="h-px w-8 bg-amber-600/30"></div>
      </div>
      
      <div className="relative group/container">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-stone-900/90 backdrop-blur-sm border border-stone-700 rounded-full text-stone-300 hover:text-amber-400 hover:border-amber-700/50 transition-all shadow-lg opacity-0 group-hover/container:opacity-100 md:opacity-100 -translate-x-1/2"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-stone-900/90 backdrop-blur-sm border border-stone-700 rounded-full text-stone-300 hover:text-amber-400 hover:border-amber-700/50 transition-all shadow-lg opacity-0 group-hover/container:opacity-100 md:opacity-100 translate-x-1/2"
          >
            <ChevronRight size={20} />
          </button>
        )}

        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0c0a09] to-transparent pointer-events-none z-10 opacity-0 transition-opacity" style={{ opacity: canScrollLeft ? 1 : 0 }}></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0c0a09] to-transparent pointer-events-none z-10 opacity-0 transition-opacity" style={{ opacity: canScrollRight ? 1 : 0 }}></div>
        
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollButtons}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1 snap-x snap-mandatory"
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
                  group relative flex-shrink-0 w-[180px] sm:w-[200px] snap-start
                  bg-stone-900/80 backdrop-blur-sm border rounded-xl overflow-hidden
                  transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                  ${isRecent ? 'border-amber-600/50 ring-1 ring-amber-500/20' : 'border-stone-700/50 hover:border-amber-700/50'}
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {isRecent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600"></div>
                )}
                
                <div className="relative z-10 p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-600 flex items-center justify-center text-lg font-heading text-stone-300 shadow-inner">
                      {character.name?.charAt(0) || '?'}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-heading tracking-wider border ${getModeColor(save.mode)}`}>
                        {getModeLabel(save.mode)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteGame(save.id); }}
                        className="p-1 text-stone-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete save"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-semibold text-stone-200 truncate font-heading mb-1">
                    {character.name || 'Unknown'}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-[10px] text-stone-500 mb-1">
                    {character.age !== undefined && (
                      <span className="px-1.5 py-0.5 bg-stone-800/80 rounded text-stone-400">
                        Age {character.age}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 text-[10px] text-stone-500 mb-3">
                    {character.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={9} className="flex-shrink-0 text-stone-600" />
                        <span className="truncate">{character.location.split(',')[0]}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={9} className="flex-shrink-0 text-stone-600" />
                      {formatSaveDate(save.updatedAt)}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onLoadGame(save.id)}
                    disabled={isLoading}
                    className={`
                      w-full py-2 rounded-lg text-xs font-heading tracking-wide transition-all 
                      disabled:opacity-50 flex items-center justify-center gap-2
                      ${isRecent 
                        ? 'bg-amber-700/80 hover:bg-amber-600/80 border border-amber-600/50 text-amber-100' 
                        : 'bg-stone-800/80 hover:bg-amber-900/50 border border-stone-700/50 hover:border-amber-700/50 text-stone-300 hover:text-amber-200'
                      }
                    `}
                  >
                    {isLoadingThis ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Play size={10} fill="currentColor" />
                        {isRecent ? 'Resume' : 'Continue'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {savedGames.length > 1 && (
        <p className="text-center text-[10px] text-stone-600 mt-3 font-serif italic">
          {savedGames.length} saved {savedGames.length === 1 ? 'journey' : 'journeys'} 
          <span className="hidden sm:inline"> - scroll to see more</span>
        </p>
      )}
    </div>
  );
};
