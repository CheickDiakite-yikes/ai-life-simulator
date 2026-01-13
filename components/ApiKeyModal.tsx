import React, { useEffect, useState } from 'react';

// Removing conflicting global declaration as window.aistudio is already defined in the environment
// declare global {
//   interface Window {
//     aistudio?: {
//       hasSelectedApiKey: () => Promise<boolean>;
//       openSelectKey: () => Promise<void>;
//     };
//   }
// }

export const ApiKeyModal: React.FC<{ onReady: () => void; forceSelection?: boolean }> = ({ onReady, forceSelection }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(!forceSelection);

  const checkKey = async () => {
    // If we are forcing selection (e.g. after a leaked key error), skip the auto-check
    if (forceSelection) {
      setLoading(false);
      return;
    }

    // Cast to any to safely access the injected aistudio property
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
        // Fallback or retry logic could go here
      }
    }
  };

  if (loading || (hasKey && !forceSelection)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-purple-500/50 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-purple-900/20 text-center">
        <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
          {forceSelection ? "API Key Issue" : "Aetheria Access"}
        </h2>
        <p className="text-gray-300 mb-6">
          {forceSelection 
            ? "Your previous API key was reported as leaked or invalid. Please select a new API key to continue."
            : "To access the advanced AI features (Video Generation, High-Res Imaging, Thinking Models), you must connect your Google AI Studio account."
          }
        </p>
        <p className="text-xs text-gray-500 mb-6">
           Requires a paid project for some models. See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-purple-400">billing documentation</a>.
        </p>
        <button
          onClick={handleSelectKey}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
        >
          Select API Key
        </button>
      </div>
    </div>
  );
};