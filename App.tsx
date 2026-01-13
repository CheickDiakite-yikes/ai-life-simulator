import React, { useState, useEffect } from 'react';
import { GameMode, Character, GameState, LifeEvent, TimeStep } from './types';
import { generateInitialCharacter, advanceLife, getRealWorldContext } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { StarBackground } from './components/StarBackground';
import { ChatInterface } from './components/ChatInterface';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Play, Shuffle, UserPlus, Wand } from 'lucide-react';

const App: React.FC = () => {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [forceKeySelection, setForceKeySelection] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const handleApiError = (err: any) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Game Error:", msg);
    
    // Check for auth/key errors including "leaked" and "403"
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
      // 1. Get Real World Context (Simulated news integration)
      let context = "";
      if (Math.random() > 0.6) { // 40% chance to fetch real news
         context = await getRealWorldContext();
      }

      // 2. Advance Life
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
        currentDate: event.date, // Update date from the new event
        history: [...prev.history, prev.currentEvent!],
        isLoading: false
      }));

    } catch (err) {
      handleApiError(err);
      setGameState(prev => ({ ...prev, isLoading: false }));
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative text-center">
        <StarBackground />
        
        <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-4xl w-full shadow-2xl relative z-10 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 animate-gradient-x">
            AETHERIA
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light">
            An immersive AI-native life simulator. Every choice shapes the universe. 
            Real-world events ripple through your destiny.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mode 1: Real Life */}
            <button 
              onClick={() => startGame(GameMode.REAL_LIFE)}
              disabled={loading}
              className="group relative p-6 rounded-xl border border-white/10 bg-black/40 hover:bg-purple-900/20 hover:border-purple-500 transition-all hover:-translate-y-1"
            >
              <div className="mb-4 bg-purple-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto group-hover:bg-purple-500 transition-colors">
                <Shuffle className="text-purple-300 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real Life</h3>
              <p className="text-sm text-gray-400">Total randomization. You don't choose who you are born as.</p>
            </button>

            {/* Mode 2: Custom */}
            <div className="group relative p-6 rounded-xl border border-white/10 bg-black/40 hover:bg-cyan-900/20 hover:border-cyan-500 transition-all hover:-translate-y-1">
              <div className="mb-4 bg-cyan-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto group-hover:bg-cyan-500 transition-colors">
                <UserPlus className="text-cyan-300 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Custom Start</h3>
              <p className="text-sm text-gray-400 mb-4">Design your birth circumstances.</p>
              
              <input 
                type="text" 
                placeholder="Name (Optional)" 
                className="w-full mb-2 bg-black/30 border border-white/20 rounded px-2 py-1 text-xs text-white placeholder-gray-500"
                value={customInputs.name}
                onChange={(e) => setCustomInputs({...customInputs, name: e.target.value})}
              />
               <input 
                type="text" 
                placeholder="Birthplace (Optional)" 
                className="w-full mb-2 bg-black/30 border border-white/20 rounded px-2 py-1 text-xs text-white placeholder-gray-500"
                value={customInputs.location}
                onChange={(e) => setCustomInputs({...customInputs, location: e.target.value})}
              />
              <button 
                onClick={() => startGame(GameMode.FAKE)}
                disabled={loading}
                className="w-full mt-2 py-1 bg-cyan-600/50 hover:bg-cyan-500 rounded text-xs font-bold text-white"
              >
                Begin Custom
              </button>
            </div>

            {/* Mode 3: Alternative */}
            <button 
              onClick={() => startGame(GameMode.ALTERNATIVE)}
              disabled={loading}
              className="group relative p-6 rounded-xl border border-white/10 bg-black/40 hover:bg-pink-900/20 hover:border-pink-500 transition-all hover:-translate-y-1"
            >
              <div className="mb-4 bg-pink-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto group-hover:bg-pink-500 transition-colors">
                <Wand className="text-pink-300 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Alternative</h3>
              <p className="text-sm text-gray-400">Fantasy elements, superheroes, and magic are possible.</p>
            </button>
          </div>

          {loading && (
            <div className="mt-8 text-purple-300 animate-pulse flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></span>
              Generating Universe...
            </div>
          )}
          {error && <p className="mt-8 text-red-400 bg-black/40 p-2 rounded border border-red-500/30">{error}</p>}
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
      />
      <ChatInterface />
    </div>
  );
};

export default App;