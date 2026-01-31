import React, { useState, useEffect, useRef } from 'react';
import { AltGenre, GameMode, Character, GameState, LifeEvent, SimulationConfig, TimeStep, WorldRegion } from './types';
import { generateInitialCharacter, advanceLife, getRealWorldContext } from './services/geminiLoader';
import { Dashboard } from './components/Dashboard';
import { GreekBackground } from './components/GreekBackground';
import { StarBackground } from './components/StarBackground';
import { ChatInterface } from './components/ChatInterface';
import { SavedGamesSection } from './components/SavedGamesSection';
import AuthPage, { AuthUser } from './components/AuthPage';
import { SettingsModal } from './components/SettingsModal';
import { EthicsModal } from './components/EthicsModal';
import { MultiLifeComparison } from './components/MultiLifeComparison';
import { Play, Shuffle, UserPlus, Wand, ChevronLeft, ChevronRight, MapPin, User, Scroll, LogOut, Settings } from 'lucide-react';
import { addRecentStart, getRecentStarts } from './services/simulationMemory';
import { addTimeStep, isOnOrBeforeToday, randomDateInYear } from './services/timeUtils';
import { logDebug, logError, logWarn } from './services/logger';
import { saveGame, loadSavedGames, loadGame, deleteSavedGame, SavedGame } from './services/saveGameService';
import { getDefaultBirthConfig } from './services/birthConfig';
import { updateStoryArcs } from './services/arcEngine';
import { pickAltGenre } from './services/altMechanics';

interface AppProps {
  onBackToLanding?: () => void;
}

const App: React.FC<AppProps> = ({ onBackToLanding }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEthicsOpen, setIsEthicsOpen] = useState(false);
  
  // Selection Screen State
  const [selectedModeIndex, setSelectedModeIndex] = useState(0);
  
  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Saved Games State
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [currentSaveId, setCurrentSaveId] = useState<number | null>(null);
  const [loadingGameId, setLoadingGameId] = useState<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
    birthConfig: getDefaultBirthConfig(),
    realismIntensity: 'true',
    researchMode: false,
    showCausality: false,
    researchOptIn: false
  });

  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonLives, setComparisonLives] = useState<{ region: WorldRegion; character: Character }[]>([]);
  const [settingsModalMode, setSettingsModalMode] = useState<GameMode | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    character: {} as Character,
    history: [],
    currentEvent: null,
    currentDate: '',
    timeStep: 'Year',
    isLoading: false,
    mode: GameMode.REAL_LIFE,
    theme: 'modern',
    config: {
      birthConfig: getDefaultBirthConfig(),
      realismIntensity: 'true',
      researchMode: false,
      showCausality: false,
      researchOptIn: false
    },
    storyArcs: []
  });

  const [customInputs, setCustomInputs] = useState({ name: '', location: '' });
  const [startYearInput, setStartYearInput] = useState('');
  const [altGenreInput, setAltGenreInput] = useState<AltGenre | ''>('');

  const parseStartYear = (): number | null => {
    const year = Number(startYearInput);
    if (!Number.isFinite(year)) return null;
    if (year < 1000 || year > 3000) return null;
    return Math.floor(year);
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (err) {
        logError('Auth check failed', err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Load saved games when user is authenticated
  useEffect(() => {
    if (!user) {
      setSavedGames([]);
      return;
    }
    
    const fetchSavedGames = async () => {
      try {
        const games = await loadSavedGames();
        setSavedGames(games);
      } catch (err) {
        logError('Failed to load saved games', err);
      }
    };
    fetchSavedGames();
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
      setGameStarted(false);
      setCurrentSaveId(null);
      setSavedGames([]);
    } catch (err) {
      logError('Logout failed', err);
    }
  };

  // Auto-save when game state changes (debounced)
  useEffect(() => {
    if (!gameStarted || !gameState.character?.name) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const saved = await saveGame(gameState, currentSaveId || undefined);
        if (!currentSaveId) {
          setCurrentSaveId(saved.id);
        }
        logDebug('Auto-saved game', { saveId: saved.id });
      } catch (err) {
        logError('Auto-save failed', err);
      }
    }, 2000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [gameState.character, gameState.currentEvent, gameState.history.length, gameStarted]);

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
    logError("Game Error:", msg);
    
    if (msg.includes("401") || msg.includes("Not authenticated")) {
       setUser(null);
       setError("Session expired. Please log in again.");
    } else if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
       setError("API Error: Permission denied. Please contact support.");
    } else {
       setError("The Oracles are silent: " + msg);
    }
  };

  const startGame = async (mode: GameMode) => {
    setLoading(true);
    setError(null);
    try {
      const inputs = mode === GameMode.FAKE ? customInputs : undefined;
      if (mode === GameMode.FAKE) {
        if (!customInputs.name.trim() || !customInputs.location.trim()) {
          setError("Please provide both a name and a birthplace to begin.");
          setLoading(false);
          return;
        }
      }

      const recentStarts = getRecentStarts();
      const startYear = parseStartYear();
      const birthDate = startYear ? randomDateInYear(startYear) : null;
      const fixedTraits = birthDate ? { age: 0, birthday: birthDate } : undefined;
      const altGenre = mode === GameMode.ALTERNATIVE
        ? (altGenreInput ? altGenreInput : pickAltGenre())
        : undefined;
      const character = await generateInitialCharacter(mode, inputs, {
        recentStarts,
        config: simulationConfig,
        fixedTraits,
        altGenre
      });
      addRecentStart({
        name: character.name,
        location: character.location,
        ethnicity: character.ethnicity,
        bio: character.bio,
        mode
      });
      
      const initialEvent: LifeEvent = {
        year: 0,
        date: character.birthday,
        description: `You are born into this world. Your name is ${character.name}. You were born in ${character.location}. ${character.bio}`,
        type: 'major',
        lifeStage: character.lifeStage,
        milestones: ['Birth'],
        causes: [
          { factor: 'Birth circumstances', impact: 'high', evidence: 'Starting conditions set by family and environment.' }
        ],
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
        theme: mode === GameMode.ALTERNATIVE ? altGenre || 'fantasy' : 'modern',
        config: simulationConfig,
        storyArcs: []
      });
      setGameStarted(true);
      logDebug('Game started', { mode, location: character.location, ethnicity: character.ethnicity });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareLives = async () => {
    setComparisonOpen(true);
    setComparisonLoading(true);
    setComparisonLives([]);
    try {
      const regions: WorldRegion[] = ['Africa', 'Americas', 'Asia', 'Europe'];
      const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const recentStarts = getRecentStarts();
      const startYear = parseStartYear();
      const birthDate = startYear ? randomDateInYear(startYear) : null;
      const fixedBirth = birthDate ? { age: 0, birthday: birthDate } : undefined;
      const baseline = await generateInitialCharacter(GameMode.REAL_LIFE, undefined, {
        recentStarts,
        config: simulationConfig,
        seed,
        fixedTraits: fixedBirth
      });
      const fixedTraits = {
        name: baseline.name,
        gender: baseline.gender,
        ethnicity: baseline.ethnicity,
        age: baseline.age,
        birthday: baseline.birthday,
        attributes: {
          intelligence: baseline.attributes.intelligence,
          energy: baseline.attributes.energy
        }
      };
      const results = await Promise.all(
        regions.map((region) =>
          generateInitialCharacter(GameMode.REAL_LIFE, undefined, {
            recentStarts,
            config: simulationConfig,
            regionHint: region,
            seed,
            fixedTraits
          })
        )
      );
      const lives = results.map((character, index) => ({
        region: regions[index],
        character
      }));
      setComparisonLives(lives);
    } catch (error) {
      logError('Failed to generate comparison lives', error);
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleChoice = async (choiceId: string, choiceText: string) => {
    if (!gameState.currentEvent) {
      logWarn('No current event available to advance', { choiceId, choiceText });
      return;
    }
    setError(null);
    setGameState(prev => ({ ...prev, isLoading: true }));
    try {
      let context = "";
      const nextDate = addTimeStep(gameState.currentDate, gameState.timeStep) || gameState.currentDate;
      const withinRealWorldTimeline = isOnOrBeforeToday(nextDate);
      if (withinRealWorldTimeline) {
        context = await getRealWorldContext();
      }
      logDebug('Advancing with choice', { choiceId, timeStep: gameState.timeStep });
      const { character, event } = await advanceLife(
        gameState.character,
        gameState.currentEvent,
        choiceText,
        gameState.currentDate,
        gameState.timeStep,
        gameState.config,
        context,
        { mode: gameState.mode, altGenre: gameState.mode === GameMode.ALTERNATIVE ? (gameState.theme as AltGenre) : undefined }
      );
      const updatedArcs = updateStoryArcs({
        arcs: gameState.storyArcs,
        description: event.description,
        choiceText
      });
      setGameState(prev => ({
        ...prev,
        character,
        currentEvent: event,
        currentDate: event.date,
        history: [...prev.history, prev.currentEvent!],
        storyArcs: updatedArcs,
        isLoading: false
      }));
    } catch (err) {
      logError('handleChoice failed', { 
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        choiceId,
        choiceText,
        currentDate: gameState.currentDate
      });
      handleApiError(err);
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handlePlay = () => {
    handleChoice('auto_advance', `Passively advance time by 1 ${gameState.timeStep}.`);
  };

  const handleTimeStepChange = (step: TimeStep) => {
    logDebug('Time step changed', { from: gameState.timeStep, to: step });
    setGameState(prev => ({ ...prev, timeStep: step }));
  };

  const handleConfigChange = (nextConfig: SimulationConfig) => {
    const normalized = {
      ...nextConfig,
      researchOptIn: nextConfig.researchOptIn || false
    };
    setGameState(prev => ({ ...prev, config: normalized }));
    setSimulationConfig(normalized);
  };

  const handleLoadGame = async (saveId: number) => {
    setLoadingGameId(saveId);
    setError(null);
    try {
      const loadedState = await loadGame(saveId);
      if (loadedState) {
        const normalizedConfig: SimulationConfig = {
          birthConfig: loadedState.config?.birthConfig || simulationConfig.birthConfig,
          realismIntensity: loadedState.config?.realismIntensity || simulationConfig.realismIntensity,
          researchMode: loadedState.config?.researchMode || false,
          showCausality: loadedState.config?.showCausality || false,
          researchOptIn: loadedState.config?.researchOptIn ?? loadedState.config?.researchMode ?? false
        };
        setGameState({
          ...loadedState,
          config: normalizedConfig,
          storyArcs: loadedState.storyArcs || []
        });
        setSimulationConfig(normalizedConfig);
        setCurrentSaveId(saveId);
        setGameStarted(true);
        logDebug('Loaded saved game', { saveId, characterName: loadedState.character?.name });
      } else {
        setError('Failed to load saved game. The save may be corrupted.');
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoadingGameId(null);
    }
  };

  const handleDeleteGame = async (saveId: number) => {
    try {
      await deleteSavedGame(saveId);
      setSavedGames(prev => prev.filter(g => g.id !== saveId));
      logDebug('Deleted saved game', { saveId });
    } catch (err) {
      logError('Failed to delete saved game', err);
    }
  };

  const handleReturnToSelection = async () => {
    // First, force an immediate save of the current game
    if (gameState.character?.name) {
      try {
        const saved = await saveGame(gameState, currentSaveId || undefined);
        if (!currentSaveId) {
          setCurrentSaveId(saved.id);
        }
        logDebug('Saved game before returning to selection', { saveId: saved.id });
      } catch (err) {
        logError('Failed to save game before returning', err);
      }
    }
    
    // Refresh saved games list so the user sees their current game
    try {
      const games = await loadSavedGames();
      setSavedGames(games);
    } catch (err) {
      logError('Failed to refresh saved games', err);
    }
    
    // Return to selection screen
    setGameStarted(false);
    setCurrentSaveId(null);
    setSimulationConfig(gameState.config);
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

  const gameContext = gameStarted ? [
    `Mode: ${gameState.mode}`,
    `Date: ${gameState.currentDate} (Time step: ${gameState.timeStep})`,
    `Realism: ${gameState.config.realismIntensity}, Research: ${gameState.config.researchMode ? 'On' : 'Off'}`,
    `Character: ${gameState.character.name}, age ${gameState.character.age}, ${gameState.character.gender}, ${gameState.character.ethnicity}, location ${gameState.character.location}`,
    `Life Stage: ${gameState.character.lifeStage || 'Unknown'}`,
    `Vitals: health ${gameState.character.attributes?.health}, mental ${gameState.character.attributes?.happiness}, energy ${gameState.character.attributes?.energy}`,
    `Wealth: personal ${gameState.character.attributes?.personalWealth}, family ${gameState.character.attributes?.familyWealth}`,
    `Drives: ${gameState.character.drives ? JSON.stringify(gameState.character.drives) : 'Unknown'}`,
    `Systems: ${gameState.character.systems ? JSON.stringify(gameState.character.systems) : 'Unknown'}`,
    `Current Event: ${gameState.currentEvent?.description || 'None'}`,
    `Alt Genre: ${gameState.character.altGenre || 'None'}`,
    `Story Arcs: ${gameState.storyArcs.map(arc => `${arc.title} (${arc.status})`).join(' | ') || 'None'}`,
    `Recent Events: ${gameState.history.slice(-3).map(event => event.description).join(' | ') || 'None'}`
  ].join('\n') : '';

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif tracking-[0.3em] text-amber-500 mb-4">SIMILI</h1>
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show authentication page if not logged in
  if (!user) {
    return <AuthPage onAuthSuccess={setUser} />;
  }

  if (!gameStarted) {
    const activeMode = modes[selectedModeIndex];

    return (
      <div className="h-screen w-full flex flex-col items-center overflow-hidden relative text-center font-serif">
        <GreekBackground />
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-stone-800/80 backdrop-blur-sm border border-stone-600/50 rounded-lg text-stone-300 hover:text-amber-500 hover:border-amber-500/50 transition-colors text-sm"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
        
        {/* Header */}
        <div className="flex-none pt-4 md:pt-12 pb-2 md:pb-4 z-10">
          <h1 className="text-4xl md:text-7xl font-bold tracking-[0.15em] md:tracking-[0.2em] font-heading text-[#e7e5e4] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1 md:mb-2 gold-text">
            SIMILI
          </h1>
          <div className="flex items-center justify-center gap-2 md:gap-4">
             <div className="h-px w-8 md:w-12 bg-amber-600/50"></div>
             <p className="text-xs md:text-base text-stone-400 font-light tracking-wider md:tracking-widest uppercase font-heading">
               Welcome, {user.fullName.split(' ')[0]}
             </p>
             <div className="h-px w-8 md:w-12 bg-amber-600/50"></div>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="w-full max-w-6xl mx-auto flex items-start md:items-center justify-center relative z-20 px-10 md:px-4 pt-0 md:pt-0 md:flex-1 md:min-h-0">
          
          {/* Mobile Navigation Arrows - positioned outside the card area */}
          <button 
            onClick={prevMode}
            className="md:hidden absolute left-1 top-1/2 -translate-y-1/2 z-30 p-2 bg-stone-800/90 backdrop-blur-md rounded-full border border-amber-700/40 text-amber-400 hover:bg-stone-700 transition-colors shadow-lg"
            aria-label="Previous Mode"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={nextMode}
            className="md:hidden absolute right-1 top-1/2 -translate-y-1/2 z-30 p-2 bg-stone-800/90 backdrop-blur-md rounded-full border border-amber-700/40 text-amber-400 hover:bg-stone-700 transition-colors shadow-lg"
            aria-label="Next Mode"
          >
            <ChevronRight size={20} />
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
                      rounded-t-[32px] md:rounded-t-[40px] rounded-b-xl p-3 md:p-8 flex flex-col items-center text-center shadow-2xl
                      ${isActive ? 'shadow-[0_0_50px_rgba(0,0,0,0.7)]' : ''}
                      h-[320px] sm:h-[380px] md:h-[500px] justify-between relative overflow-visible bg-[#e7e5e4]
                   `}>
                      {/* Inner Border Decoration */}
                      <div className="absolute inset-1.5 md:inset-2 border border-stone-400/30 rounded-t-[26px] md:rounded-t-[32px] rounded-b-lg pointer-events-none"></div>
                      
                      {/* Top Section */}
                      <div className="flex flex-col items-center relative z-10 w-full">
                        <div className="mb-1 md:mb-6 p-1.5 md:p-4">
                          <mode.icon size={32} className={`${mode.iconColor} drop-shadow-md md:hidden`} strokeWidth={1.5} />
                          <mode.icon size={56} className={`${mode.iconColor} drop-shadow-md hidden md:block`} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-lg md:text-2xl font-bold text-stone-800 mb-0.5 md:mb-2 font-heading tracking-wider">{mode.title}</h2>
                        <span className="text-[9px] md:text-xs font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] mb-1 md:mb-4 text-stone-500 border-b border-stone-300 pb-0.5 md:pb-1">
                          {mode.subtitle}
                        </span>
                        <p className="text-[11px] md:text-sm text-stone-600 leading-snug md:leading-relaxed mb-2 md:mb-6 font-serif italic px-1 md:px-2 line-clamp-2 md:line-clamp-none">
                          {mode.desc}
                        </p>
                      </div>

                      {/* Middle/Bottom Section (Inputs or Decoration) */}
                      <div className="w-full relative z-10 mt-auto">
                        {mode.mode === GameMode.FAKE ? (
                           <div className="space-y-2 md:space-y-3 mb-3 md:mb-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                             <div className="relative">
                               <User size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 md:hidden" />
                               <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 hidden md:block" />
                               <input 
                                 type="text" 
                                 placeholder="Name" 
                                 value={customInputs.name}
                                 onChange={(e) => setCustomInputs({...customInputs, name: e.target.value})}
                                 className="w-full bg-stone-200/50 border border-stone-400/50 rounded-lg py-2 md:py-2.5 pl-7 md:pl-9 pr-2 md:pr-3 text-xs md:text-sm text-stone-800 placeholder-stone-500 focus:border-amber-600 focus:outline-none transition-colors font-serif"
                               />
                             </div>
                             <div className="relative">
                               <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 md:hidden" />
                               <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 hidden md:block" />
                               <input 
                                 type="text" 
                                 placeholder="Birthplace" 
                                 value={customInputs.location}
                                 onChange={(e) => setCustomInputs({...customInputs, location: e.target.value})}
                                 className="w-full bg-stone-200/50 border border-stone-400/50 rounded-lg py-2 md:py-2.5 pl-7 md:pl-9 pr-2 md:pr-3 text-xs md:text-sm text-stone-800 placeholder-stone-500 focus:border-amber-600 focus:outline-none transition-colors font-serif"
                               />
                             </div>
                           </div>
                        ) : mode.mode === GameMode.ALTERNATIVE ? (
                          <div className="space-y-1.5 md:space-y-3 mb-3 md:mb-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <label className="text-[9px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] text-stone-500 font-heading">Sub-Genre (Optional)</label>
                            <select
                              value={altGenreInput}
                              onChange={(e) => setAltGenreInput(e.target.value as AltGenre | '')}
                              className="w-full bg-stone-200/50 border border-stone-400/50 rounded-lg py-2 md:py-2.5 px-2 md:px-3 text-xs md:text-sm text-stone-800 focus:border-amber-600 focus:outline-none transition-colors font-serif"
                            >
                              <option value="">Random</option>
                              <option value="fantasy">Fantasy</option>
                              <option value="scifi">Sci-Fi</option>
                              <option value="superhero">Superhero</option>
                              <option value="horror">Horror</option>
                            </select>
                            <p className="text-[10px] md:text-xs text-stone-500 font-serif italic">
                              Leave blank for a random world.
                            </p>
                          </div>
                        ) : (
                          <div className="mb-4 md:mb-8 opacity-40">
                             <Scroll size={24} className="mx-auto text-stone-400 md:hidden" />
                             <Scroll size={32} className="mx-auto text-stone-400 hidden md:block" />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); startGame(mode.mode); }}
                            disabled={loading}
                            className={`
                              flex-1 py-2.5 md:py-3.5 rounded-lg text-xs md:text-sm font-bold tracking-[0.1em] md:tracking-[0.15em] shadow-lg transition-all transform active:scale-95
                              ${mode.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed font-heading
                              relative overflow-hidden group
                            `}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            {loading ? (
                              <span className="flex items-center justify-center gap-1.5 md:gap-2">
                                 <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-amber-200/30 border-t-amber-100 rounded-full animate-spin"></div>
                                 DIVINING...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-1.5 md:gap-2">
                                 INITIALIZE <Play size={10} className="md:hidden" fill="currentColor" /><Play size={12} className="hidden md:block" fill="currentColor" />
                              </span>
                            )}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSettingsModalMode(mode.mode); }}
                            className="px-2.5 md:px-3.5 py-2.5 md:py-3.5 rounded-lg bg-stone-300/80 hover:bg-stone-400/80 border border-stone-400/50 text-stone-700 transition-colors shadow-lg"
                            title="Simulation Settings"
                          >
                            <Settings size={16} className="md:hidden" />
                            <Settings size={18} className="hidden md:block" />
                          </button>
                        </div>
                      </div>

                   </div>
                </div>
              );
            })}
          </div>
        </div>

        
        {/* Saved Games Section */}
        {savedGames.length > 0 && (
          <SavedGamesSection
            savedGames={savedGames}
            onLoadGame={handleLoadGame}
            onDeleteGame={handleDeleteGame}
            isLoading={loadingGameId !== null}
            loadingGameId={loadingGameId}
          />
        )}

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

        <MultiLifeComparison
          isOpen={comparisonOpen}
          isLoading={comparisonLoading}
          lives={comparisonLives}
          onClose={() => setComparisonOpen(false)}
        />

        <SettingsModal
          isOpen={settingsModalMode !== null}
          onClose={() => setSettingsModalMode(null)}
          config={simulationConfig}
          onChange={setSimulationConfig}
          startYear={startYearInput}
          onStartYearChange={setStartYearInput}
          modeName={settingsModalMode ? modes.find(m => m.mode === settingsModalMode)?.title || 'Simulation' : 'Simulation'}
        />
      </div>
    );
  }

  const BackgroundComponent = gameState.theme === 'modern' ? GreekBackground : StarBackground;

  return (
    <div className="relative min-h-screen">
      <BackgroundComponent />
      <Dashboard 
        character={gameState.character}
        currentEvent={gameState.currentEvent}
        history={gameState.history}
        onChoice={handleChoice}
        isLoading={gameState.isLoading}
        timeStep={gameState.timeStep}
        onTimeStepChange={handleTimeStepChange}
        currentDate={gameState.currentDate}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onPlay={handlePlay}
        onReturnToSelection={handleReturnToSelection}
        config={gameState.config}
        storyArcs={gameState.storyArcs}
        onConfigChange={handleConfigChange}
        onOpenEthics={() => setIsEthicsOpen(true)}
        error={error}
      />
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        onOpen={() => setIsChatOpen(true)}
        gameContext={gameContext}
        saveId={currentSaveId}
      />
      <EthicsModal
        isOpen={isEthicsOpen}
        onClose={() => setIsEthicsOpen(false)}
        config={gameState.config}
      />
    </div>
  );
};

export default App;
