import React, { useEffect, useState } from 'react';

export const ApiKeyModal: React.FC<{ onReady: () => void; forceSelection?: boolean }> = ({ onReady, forceSelection }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(!forceSelection);

  const checkKey = async () => {
    // If we are forcing selection (e.g. after a leaked key error), skip the auto-check
    if (forceSelection) {
      setLoading(false);
      return;
    }

    // First check if API key is available via environment variable (Replit secrets)
    const envApiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (envApiKey && envApiKey.length > 0) {
      setHasKey(true);
      onReady();
      setLoading(false);
      return;
    }

    // Fallback: Cast to any to safely access the injected aistudio property (Google AI Studio sandbox)
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const selected = await aistudio.hasSelectedApiKey();
      setHasKey(selected);
      if (selected) {
        onReady();
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
        console.error("Key selection failed", e);
      }
    }
  };

  if (loading || (hasKey && !forceSelection)) return null;

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
        <button
          onClick={handleSelectKey}
          className="w-full py-3 px-6 bg-[#451a03] hover:bg-[#78350f] text-amber-100 font-bold tracking-widest rounded-sm transition-all transform hover:scale-105 border border-amber-700/30 font-heading"
        >
          SELECT API KEY
        </button>
      </div>
    </div>
  );
};
