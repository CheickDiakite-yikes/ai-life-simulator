import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, Character, GameState, LifeEvent } from './types';
import { generateInitialCharacter, advanceLife, getRealWorldContext } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { GreekBackground } from './components/GreekBackground';
import { ChatInterface } from './components/ChatInterface';
import { ApiKeyModal } from './components/ApiKeyModal';
import { apiService } from './services/apiService';
import { Play, Shuffle, UserPlus, Wand, ChevronLeft, ChevronRight, Sparkles, MapPin, User, Scroll } from 'lucide-react';

const App: React.FC = () => {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [forceKeySelection, setForceKeySelection] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [userId, setUserId] = useState<number | null>(null);
  const [currentSaveId, setCurrentSaveId] = useState<number | null>(null);
  
  const [selectedModeIndex, setSelectedModeIndex] = useState(0);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    character: {} as Character,
    history: [],
    currentEvent: null,
    currentDate: '',
    timeStep: 'Year',
    isLoading: false,
    mode: GameMode.REAL_LIFE,
    theme: 'modern'
  });

  const [customInputs, setCustomInputs] = useState({ name: '', location: '' });

  useEffect(() => {
    const initUser = async () => {
      try {
        const guestId = localStorage.getItem('aetheria_guest_id') || `guest_${Date.now()}`;
        localStorage.setItem('aetheria_guest_id', guestId);
        const user = await apiService.getOrCreateUser(guestId);
        setUserId(user.id);
      } catch (e) {
        console.log('Backend not available, running without persistence');
      }
    };
    initUser();
  }, []);

  const saveGameProgress = useCallback(async (state: GameState, saveId: number | null, previousEvent: LifeEvent | null) => {
    if (!userId) return saveId;
    
    try {
      if (!saveId) {
        const save = await apiService.createGameSave({
          userId,
          name: `${state.character.name}'s Life`,
          mode: state.mode,
          theme: state.theme,
          currentDate: state.currentDate,
          timeStep: state.timeStep,
          character: state.character,
          currentEvent: state.currentEvent,
          history: state.history
        });
        return save.id;
      } else {
        await apiService.updateGameSave(saveId, {
          currentDate: state.currentDate,
          timeStep: state.timeStep,
          character: state.character,
          currentEvent: state.currentEvent,
          newEvent: previousEvent
        });
        return saveId;
      }
    } catch (e) {
      console.error('Failed to save game:', e);
      return saveId;
    }
  }, [userId]);

  const modes = [
    {
      mode: GameMode.REAL_LIFE,
      title: "Real Life",
      subtitle: "Fate is blind",
      desc: "Experience total randomization. You have no control over your birth, genetics, or parents.",
      icon: Shuffle,
      color: "text-stone-600",
      iconColor: "text-amber-700",
      bgGradient: "bg-stone-100",
      border: "border-amber-700/40",
      buttonBg: "bg-[#451a03] hover:bg-[#78350f] text-amber-100 border border-amber-500/30",
    },
    {
      mode: GameMode.FAKE,
      title: "Custom Start",
      subtitle: "Design your destiny",
      desc: "Hand-pick your starting circumstances. Choose your name and birthplace.",
      icon: UserPlus,
      color: "text-stone-600",
      iconColor: "text-amber-700",
      bgGradient: "bg-stone-100",
      border: "border-amber-700/40",
      buttonBg: "bg-[#451a03] hover:bg-[#78350f] text-amber-100 border border-amber-500/30",
    },
    {
      mode: GameMode.ALTERNATIVE,
      title: "Alternative",
      subtitle: "Into the multiverse",
      desc: "A universe where magic, superheroes, and the supernatural are real possibilities.",
      icon: Wand,
      color: "text-stone-600",
      iconColor: "text-amber-700",
      bgGradient: "bg-stone-100",
      border: "border-amber-700/40",
      buttonBg: "bg-[#451a03] hover:bg-[#78350f] text-amber-100 border border-amber-500/30",
    }
  ];

  const handleApiError = (err: any) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Game Error:", msg);
    
    if (msg.includes("403") || msg.includes("leaked") || msg.includes("PERMISSION_DENIED") || msg.includes("Requested entity was not found")) {
       setForceKeySelection(true);
       setApiKeyReady(false);
       setError("API Key Error: The key was reported as leaked or invalid. Please select a new one.");
    } else {
       setError("The Oracles are silent: " + msg);
    }
  };

  const onKeyReady = () => {
    setApiKeyReady(true);
    setForceKeySelection(false);
    setError(null);
  };

  const startGame = async (mode: GameMode) => {
    setLoading(true);
    setError(null);
    try {
      const inputs = mode === GameMode.FAKE ? customInputs : undefined;
      const character = await generateInitialCharacter(mode, inputs);
      
      const initialEvent: LifeEvent = {
        year: 0,
        date: character.birthday,
        description: `You are born into this world. Your name is ${character.name}. You were born in ${character.location}. ${character.bio}`,
        type: 'major',
        choices: [
          { id: 'cry', text: 'Cry loudly', consequenceHint: 'Tests lung capacity' },
          { id: 'sleep', text: 'Sleep peacefully', consequenceHint: 'Parents are relieved' },
          { id: 'observe', text: 'Look around quietly', consequenceHint: 'Increases intelligence' }
        ]
      };

      const newState: GameState = {
        character,
        history: [],
        currentEvent: initialEvent,
        currentDate: character.birthday,
        timeStep: 'Year',
        isLoading: false,
        mode,
        theme: mode === GameMode.ALTERNATIVE ? 'fantasy' : 'modern'
      };
      
      setGameState(newState);
      setGameStarted(true);
      
      const newSaveId = await saveGameProgress(newState, null, null);
      if (newSaveId) setCurrentSaveId(newSaveId);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choiceId: string, choiceText: string) => {
    setGameState(prev => ({ ...prev, isLoading: true }));
    try {
      let context = "";
      if (Math.random() > 0.6) {
         context = await getRealWorldContext();
      }
      const { character, event } = await advanceLife(
        gameState.character,
        gameState.currentEvent,
        choiceText,
        gameState.currentDate,
        gameState.timeStep,
        context
      );
      
      const previousEvent = gameState.currentEvent;
      const newState = {
        ...gameState,
        character,
        currentEvent: event,
        currentDate: event.date,
        history: [...gameState.history, previousEvent!],
        isLoading: false
      };
      
      setGameState(newState);
      
      await saveGameProgress(newState, currentSaveId, previousEvent);
    } catch (err) {
      handleApiError(err);
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handlePlay = () => {
    handleChoice('auto_advance', `Passively advance time by 1 ${gameState.timeStep}.`);
  };

  const nextMode = () => {
    setSelectedModeIndex((prev) => (prev + 1) % modes.length);
  };

  const prevMode = () => {
    setSelectedModeIndex((prev) => (prev - 1 + modes.length) % modes.length);
  };

  // Touch/Swipe Handlers
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
      nextMode();
    }
    if (isRightSwipe) {
      prevMode();
    }
  };

  if (!apiKeyReady) {
    return (
      <>
        <GreekBackground />
        <ApiKeyModal onReady={onKeyReady} forceSelection={forceKeySelection} />
      </>
    );
  }

  if (!gameStarted) {
    const activeMode = modes[selectedModeIndex];

    return (
      <div className="h-screen w-full flex flex-col items-center overflow-hidden relative text-center font-serif">
        <GreekBackground />
        
        {/* Header */}
        <div className="flex-none pt-8 md:pt-12 pb-4 z-10">
          <h1 className="text-5xl md:text-7xl font-bold tracking-[0.2em] font-heading text-[#e7e5e4] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-2 gold-text">
            AETHERIA
          </h1>
          <div className="flex items-center justify-center gap-4">
             <div className="h-px w-12 bg-amber-600/50"></div>
             <p className="text-sm md:text-base text-stone-400 font-light tracking-widest uppercase font-heading">
               Initialize Simulation
             </p>
             <div className="h-px w-12 bg-amber-600/50"></div>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center relative z-10 px-4 min-h-0">
          
          {/* Mobile Navigation Arrows */}
          <button 
            onClick={prevMode}
            className="md:hidden absolute left-0 z-30 p-3 bg-stone-900/80 backdrop-blur-md rounded-r-xl border-y border-r border-amber-700/30 text-amber-100 hover:bg-stone-800 transition-colors shadow-lg"
            aria-label="Previous Mode"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            onClick={nextMode}
            className="md:hidden absolute right-0 z-30 p-3 bg-stone-900/80 backdrop-blur-md rounded-l-xl border-y border-l border-amber-700/30 text-amber-100 hover:bg-stone-800 transition-colors shadow-lg"
            aria-label="Next Mode"
          >
            <ChevronRight size={24} />
          </button>

          {/* Cards Wrapper */}
          <div 
            className="w-full flex md:gap-8 items-center justify-center h-full select-none relative"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {modes.map((mode, idx) => {
              const isActive = idx === selectedModeIndex;
              
              return (
                <div 
                  key={mode.mode}
                  onClick={() => !isActive && setSelectedModeIndex(idx)}
                  className={`
                    transition-all duration-500 ease-out
                    ${isActive 
                      ? 'opacity-100 scale-100 z-20 translate-x-0' 
                      : 'opacity-0 scale-95 z-10 absolute pointer-events-none md:relative md:opacity-60 md:scale-90 md:blur-[1px] md:pointer-events-auto md:hover:opacity-80'
                    }
                    w-full max-w-sm md:w-[350px] flex justify-center
                  `}
                >
                   {/* Card Body - Marble Tablet Look */}
                   <div className={`
                      w-full marble-texture border-4 ${isActive ? 'border-[#b45309]' : 'border-stone-600/30'} 
                      rounded-t-[40px] rounded-b-xl p-6 md:p-8 flex flex-col items-center text-center shadow-2xl
                      ${isActive ? 'shadow-[0_0_50px_rgba(0,0,0,0.7)]' : ''}
                      min-h-[480px] md:h-[500px] justify-between relative overflow-hidden bg-[#e7e5e4]
                   `}>
                      {/* Inner Border Decoration */}
                      <div className="absolute inset-2 border border-stone-400/30 rounded-t-[32px] rounded-b-lg pointer-events-none"></div>
                      
                      {/* Top Section */}
                      <div className="flex flex-col items-center relative z-10 w-full">
                        <div className="mb-4 md:mb-6 p-4">
                          <mode.icon size={56} className={`${mode.iconColor} drop-shadow-md`} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-bold text-stone-800 mb-2 font-heading tracking-wider">{mode.title}</h2>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-stone-500 border-b border-stone-300 pb-1">
                          {mode.subtitle}
                        </span>
                        <p className="text-sm text-stone-600 leading-relaxed mb-6 font-serif italic px-2">
                          {mode.desc}
                        </p>
                      </div>

                      {/* Middle/Bottom Section (Inputs or Decoration) */}
                      <div className="w-full relative z-10 mt-auto">
                        {mode.mode === GameMode.FAKE ? (
                           <div className="space-y-3 mb-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                             <div className="relative">
                               <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                               <input 
                                 type="text" 
                                 placeholder="Name" 
                                 value={customInputs.name}
                                 onChange={(e) => setCustomInputs({...customInputs, name: e.target.value})}
                                 className="w-full bg-stone-200/50 border border-stone-400/50 rounded-lg py-2.5 pl-9 pr-3 text-sm text-stone-800 placeholder-stone-500 focus:border-amber-600 focus:outline-none transition-colors font-serif"
                               />
                             </div>
                             <div className="relative">
                               <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                               <input 
                                 type="text" 
                                 placeholder="Birthplace" 
                                 value={customInputs.location}
                                 onChange={(e) => setCustomInputs({...customInputs, location: e.target.value})}
                                 className="w-full bg-stone-200/50 border border-stone-400/50 rounded-lg py-2.5 pl-9 pr-3 text-sm text-stone-800 placeholder-stone-500 focus:border-amber-600 focus:outline-none transition-colors font-serif"
                               />
                             </div>
                           </div>
                        ) : (
                          <div className="mb-8 opacity-40">
                             <Scroll size={32} className="mx-auto text-stone-400" />
                          </div>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); startGame(mode.mode); }}
                          disabled={loading}
                          className={`
                            w-full py-3.5 rounded-lg text-sm font-bold tracking-[0.15em] shadow-lg transition-all transform active:scale-95
                            ${mode.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed font-heading
                            relative overflow-hidden group
                          `}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                               <div className="w-4 h-4 border-2 border-amber-200/30 border-t-amber-100 rounded-full animate-spin"></div>
                               DIVINING...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                               INITIALIZE <Play size={12} fill="currentColor" />
                            </span>
                          )}
                        </button>
                      </div>

                   </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer / Indicators */}
        <div className="flex-none pb-8 md:pb-12 z-10 flex flex-col items-center gap-4">
           {/* Pagination Dots */}
           <div className="flex gap-2">
              {modes.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedModeIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === selectedModeIndex ? 'bg-amber-500 w-6' : 'bg-stone-600 hover:bg-stone-400'}`}
                />
              ))}
           </div>
           
           {error && (
             <div className="max-w-xs text-xs text-red-300 bg-red-900/40 border border-red-500/30 p-2 rounded text-center font-serif">
               {error}
             </div>
           )}
        </div>

      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <GreekBackground />
      <Dashboard 
        character={gameState.character}
        currentEvent={gameState.currentEvent}
        history={gameState.history}
        onChoice={handleChoice}
        isLoading={gameState.isLoading}
        timeStep={gameState.timeStep}
        onTimeStepChange={(step) => setGameState(prev => ({ ...prev, timeStep: step }))}
        currentDate={gameState.currentDate}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onPlay={handlePlay}
      />
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onOpen={() => setIsChatOpen(true)}
      />
    </div>
  );
};

export default App;