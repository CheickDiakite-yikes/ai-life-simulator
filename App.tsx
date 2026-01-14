import React, { useState } from 'react';
import { GameMode, Character, GameState, LifeEvent } from './types';
import { generateInitialCharacter, advanceLife, getRealWorldContext } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { StarBackground } from './components/StarBackground';
import { ChatInterface } from './components/ChatInterface';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Play, Shuffle, UserPlus, Wand, ChevronLeft, ChevronRight, Sparkles, MapPin, User } from 'lucide-react';

const App: React.FC = () => {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [forceKeySelection, setForceKeySelection] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Selection Screen State
  const [selectedModeIndex, setSelectedModeIndex] = useState(0);
  
  // Swipe State
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

  const modes = [
    {
      mode: GameMode.REAL_LIFE,
      title: "Real Life",
      subtitle: "Fate is blind",
      desc: "Experience total randomization. You have no control over your birth, genetics, or parents.",
      icon: Shuffle,
      color: "text-purple-400",
      bgGradient: "from-purple-500/20 to-indigo-500/10",
      border: "border-purple-500/30",
      buttonBg: "bg-purple-600 hover:bg-purple-500",
    },
    {
      mode: GameMode.FAKE,
      title: "Custom Start",
      subtitle: "Design your destiny",
      desc: "Hand-pick your starting circumstances. Choose your name and birthplace.",
      icon: UserPlus,
      color: "text-cyan-400",
      bgGradient: "from-cyan-500/20 to-blue-500/10",
      border: "border-cyan-500/30",
      buttonBg: "bg-cyan-600 hover:bg-cyan-500",
    },
    {
      mode: GameMode.ALTERNATIVE,
      title: "Alternative",
      subtitle: "Into the multiverse",
      desc: "A universe where magic, superheroes, and the supernatural are real possibilities.",
      icon: Wand,
      color: "text-pink-400",
      bgGradient: "from-pink-500/20 to-rose-500/10",
      border: "border-pink-500/30",
      buttonBg: "bg-pink-600 hover:bg-pink-500",
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
       setError("Cosmic interference detected: " + msg);
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

      setGameState({
        character,
        history: [],
        currentEvent: initialEvent,
        currentDate: character.birthday,
        timeStep: 'Year',
        isLoading: false,
        mode,
        theme: mode === GameMode.ALTERNATIVE ? 'fantasy' : 'modern'
      });
      setGameStarted(true);
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
      setGameState(prev => ({
        ...prev,
        character,
        currentEvent: event,
        currentDate: event.date,
        history: [...prev.history, prev.currentEvent!],
        isLoading: false
      }));
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
        <StarBackground />
        <ApiKeyModal onReady={onKeyReady} forceSelection={forceKeySelection} />
      </>
    );
  }

  if (!gameStarted) {
    const activeMode = modes[selectedModeIndex];

    return (
      <div className="h-screen w-full flex flex-col items-center overflow-hidden relative text-center font-sans">
        <StarBackground />
        
        {/* Header */}
        <div className="flex-none pt-8 md:pt-12 pb-4 z-10">
          <h1 className="text-4xl md:text-6xl font-bold tracking-widest font-heading bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 animate-gradient-x mb-2">
            AETHERIA
          </h1>
          <p className="text-sm md:text-base text-gray-400 font-light tracking-wide uppercase">
            Initialize Simulation
          </p>
        </div>

        {/* Carousel Container */}
        <div className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center relative z-10 px-4">
          
          {/* Mobile Navigation Arrows */}
          <button 
            onClick={prevMode}
            className="md:hidden absolute left-2 z-20 p-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            onClick={nextMode}
            className="md:hidden absolute right-2 z-20 p-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={24} />
          </button>

          {/* Cards Wrapper - Added swipe handlers */}
          <div 
            className="w-full flex md:gap-8 items-center justify-center h-full select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {modes.map((mode, idx) => {
              const isActive = idx === selectedModeIndex;
              // On mobile, only render the active card. On desktop, render all but highlight active.
              const isHiddenOnMobile = !isActive;
              
              return (
                <div 
                  key={mode.mode}
                  onClick={() => !isActive && setSelectedModeIndex(idx)}
                  className={`
                    transition-all duration-500 ease-in-out
                    ${isHiddenOnMobile ? 'hidden md:flex md:scale-90 md:opacity-50 md:blur-[1px] cursor-pointer hover:opacity-75' : 'flex scale-100 opacity-100 blur-0'}
                    ${isActive ? 'md:scale-105 md:opacity-100 md:blur-0 z-20 cursor-default' : 'z-10'}
                    relative w-full md:w-[350px] max-w-sm
                  `}
                >
                   {/* Card Body */}
                   <div className={`
                      w-full bg-[#0B101B]/80 backdrop-blur-xl border ${isActive ? mode.border : 'border-white/5'} 
                      rounded-3xl p-6 md:p-8 flex flex-col items-center text-center shadow-2xl
                      ${isActive ? 'shadow-[0_0_50px_rgba(0,0,0,0.5)]' : ''}
                      h-[55vh] md:h-[500px] justify-between
                   `}>
                      
                      {/* Top Section */}
                      <div className="flex flex-col items-center">
                        <div className={`mb-6 p-4 rounded-2xl bg-gradient-to-br ${mode.bgGradient} border border-white/10 shadow-inner`}>
                          <mode.icon size={48} className={mode.color} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">{mode.title}</h2>
                        <span className={`text-xs font-bold uppercase tracking-widest mb-4 ${mode.color} opacity-80`}>
                          {mode.subtitle}
                        </span>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6">
                          {mode.desc}
                        </p>
                      </div>

                      {/* Middle/Bottom Section (Inputs or Decoration) */}
                      <div className="w-full">
                        {mode.mode === GameMode.FAKE ? (
                           <div className="space-y-3 mb-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                             <div className="relative">
                               <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                               <input 
                                 type="text" 
                                 placeholder="Name" 
                                 value={customInputs.name}
                                 onChange={(e) => setCustomInputs({...customInputs, name: e.target.value})}
                                 className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
                               />
                             </div>
                             <div className="relative">
                               <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                               <input 
                                 type="text" 
                                 placeholder="Birthplace" 
                                 value={customInputs.location}
                                 onChange={(e) => setCustomInputs({...customInputs, location: e.target.value})}
                                 className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
                               />
                             </div>
                           </div>
                        ) : (
                          <div className="mb-8 opacity-20">
                             <Sparkles size={40} className={`mx-auto animate-pulse ${mode.color}`} />
                          </div>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); startGame(mode.mode); }}
                          disabled={loading}
                          className={`
                            w-full py-3.5 rounded-xl text-sm font-bold text-white tracking-wide shadow-lg transition-all transform active:scale-95
                            ${mode.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                               INITIALIZING...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                               INITIALIZE <Play size={14} fill="currentColor" />
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
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === selectedModeIndex ? 'bg-white w-6' : 'bg-white/20 hover:bg-white/40'}`}
                />
              ))}
           </div>
           
           {error && (
             <div className="max-w-xs text-xs text-red-400 bg-red-900/20 border border-red-500/20 p-2 rounded text-center">
               {error}
             </div>
           )}
        </div>

      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <StarBackground />
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