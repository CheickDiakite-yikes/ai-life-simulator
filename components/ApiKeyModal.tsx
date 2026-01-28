import React, { useEffect, useState } from 'react';
import { clearStoredApiKey, getEnvApiKey, getStoredApiKey, isProbablyValidKey, setStoredApiKey } from '../services/apiKey';
import { logError, logWarn } from '../services/logger';

export const ApiKeyModal: React.FC<{ onReady: () => void; forceSelection?: boolean }> = ({ onReady, forceSelection }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(!forceSelection);
  const [manualKey, setManualKey] = useState('');
  const [manualError, setManualError] = useState('');

  const checkKey = async () => {
    // If we are forcing selection (e.g. after a leaked key error), skip the auto-check
    if (forceSelection) {
      setLoading(false);
      return;
    }

    const envKey = getEnvApiKey();
    if (envKey) {
      setHasKey(true);
      onReady();
      setLoading(false);
      return;
    }

    const storedKey = getStoredApiKey();
    if (storedKey) {
      setHasKey(true);
      onReady();
      setLoading(false);
      return;
    }

    // Cast to any to safely access the injected aistudio property
    const aistudio = (window as any).aistudio;
    if (aistudio?.hasSelectedApiKey) {
      try {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (selected) {
          onReady();
          setLoading(false);
          return;
        }
      } catch (error) {
        logWarn('Failed to check AI Studio key', error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceSelection]);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        // Assume success to avoid race condition as per instructions
        setHasKey(true);
        onReady();
      } catch (e) {
        logError("Key selection failed", e);
        // Fallback or retry logic could go here
      }
    }
  };

  const handleManualKey = () => {
    const trimmed = manualKey.trim();
    if (!isProbablyValidKey(trimmed)) {
      setManualError('Please enter a valid API key.');
      return;
    }
    setStoredApiKey(trimmed);
    setManualError('');
    setHasKey(true);
    onReady();
  };

  if (loading || (hasKey && !forceSelection)) return null;

  const hasAistudio = typeof window !== 'undefined' && !!(window as any).aistudio;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="bg-[#1c1917] border border-amber-700/50 p-8 rounded-sm max-w-md w-full shadow-2xl shadow-amber-900/20 text-center">
        <h2 className="text-2xl font-bold mb-4 font-heading tracking-wider text-amber-500">
          {forceSelection ? "API Key Issue" : "Aetheria Access"}
        </h2>
        <p className="text-stone-400 mb-6 font-serif">
          {forceSelection 
            ? "Your previous API key was reported as leaked or invalid. Please select a new API key to continue."
            : "To access the advanced AI features (Video Generation, High-Res Imaging, Thinking Models), you must connect your Google AI Studio account."
          }
        </p>
        <p className="text-xs text-stone-600 mb-6 font-serif">
           Requires a paid project for some models. See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-amber-400">billing documentation</a>.
        </p>

        {hasAistudio && (
          <button
            onClick={handleSelectKey}
            className="w-full py-3 px-6 bg-[#451a03] hover:bg-[#78350f] text-amber-100 font-bold tracking-widest rounded-sm transition-all transform hover:scale-105 border border-amber-700/30 font-heading"
          >
            SELECT API KEY
          </button>
        )}

        <div className="mt-6 text-left">
          <label className="text-xs text-stone-500 uppercase tracking-widest font-heading">Local API Key</label>
          <div className="flex gap-2 mt-2">
            <input
              type="password"
              value={manualKey}
              onChange={(e) => {
                setManualKey(e.target.value);
                if (manualError) setManualError('');
              }}
              placeholder="Paste API key for local dev"
              className="flex-1 bg-[#0c0a09] border border-stone-700 rounded-sm px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-amber-700 font-serif"
            />
            <button
              onClick={handleManualKey}
              className="px-4 py-2 bg-amber-800 rounded-sm text-amber-100 text-xs font-bold tracking-widest hover:bg-amber-700"
            >
              SAVE
            </button>
          </div>
          {manualError && (
            <p className="text-xs text-red-400 mt-2 font-serif">{manualError}</p>
          )}
          {forceSelection && (
            <button
              onClick={clearStoredApiKey}
              className="mt-3 text-xs text-stone-500 underline hover:text-amber-400"
            >
              Clear saved key
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
