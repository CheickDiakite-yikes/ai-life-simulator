import React from 'react';
import { SimulationConfig, RealismIntensity, WorldRegion } from '../types';
import { BIRTH_WEIGHT_PRESETS, normalizeWeights } from '../services/birthConfig';

interface SimulationSettingsProps {
  config: SimulationConfig;
  onChange: (config: SimulationConfig) => void;
}

const REGION_ORDER: WorldRegion[] = ['Africa', 'Americas', 'Asia', 'Europe', 'MiddleEast', 'Oceania'];

export const SimulationSettings: React.FC<SimulationSettingsProps> = ({ config, onChange }) => {
  const handleModeChange = (mode: SimulationConfig['birthConfig']['mode']) => {
    const preset = BIRTH_WEIGHT_PRESETS[mode];
    const weights = mode === 'custom' ? { ...config.birthConfig.weights } : { ...preset.weights };
    onChange({
      ...config,
      birthConfig: {
        mode,
        weights: normalizeWeights(weights)
      }
    });
  };

  const updateWeight = (region: WorldRegion, value: number) => {
    const nextWeights = normalizeWeights({
      ...config.birthConfig.weights,
      [region]: value
    });
    onChange({
      ...config,
      birthConfig: {
        ...config.birthConfig,
        mode: 'custom',
        weights: nextWeights
      }
    });
  };

  const handleRealism = (value: RealismIntensity) => {
    onChange({ ...config, realismIntensity: value });
  };

  const handleResearchToggle = () => {
    const nextResearch = !config.researchMode;
    onChange({
      ...config,
      researchMode: nextResearch,
      showCausality: nextResearch ? true : config.showCausality
    });
  };

  const handleCausalityToggle = () => {
    onChange({ ...config, showCausality: !config.showCausality });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-stone-900/60 backdrop-blur-sm border border-stone-700 rounded-xl p-4 md:p-6 text-left">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="text-xs md:text-sm font-heading tracking-widest uppercase text-stone-300">Simulation Settings</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-400">Research Mode</label>
          <button
            onClick={handleResearchToggle}
            className={`px-3 py-1 rounded-full text-[10px] font-heading tracking-widest border transition-colors ${
              config.researchMode
                ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
          >
            {config.researchMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-heading">Realism Intensity</label>
          <div className="flex gap-2">
            {(['gentle', 'true', 'harsh'] as RealismIntensity[]).map((level) => (
              <button
                key={level}
                onClick={() => handleRealism(level)}
                className={`flex-1 py-2 text-[11px] font-heading tracking-widest uppercase border rounded-lg transition-colors ${
                  config.realismIntensity === level
                    ? 'bg-amber-800/70 text-amber-100 border-amber-600/60'
                    : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-amber-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="text-xs text-stone-400">Show causal threads</label>
            <button
              onClick={handleCausalityToggle}
              className={`px-3 py-1 rounded-full text-[10px] font-heading tracking-widest border transition-colors ${
                config.showCausality
                  ? 'bg-amber-900/60 text-amber-200 border-amber-700/60'
                  : 'bg-stone-800 text-stone-400 border-stone-700'
              }`}
            >
              {config.showCausality ? 'VISIBLE' : 'HIDDEN'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-heading">Birth Distribution</label>
          <div className="flex gap-2">
            {(['global', 'balanced', 'custom'] as SimulationConfig['birthConfig']['mode'][]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`flex-1 py-2 text-[11px] font-heading tracking-widest uppercase border rounded-lg transition-colors ${
                  config.birthConfig.mode === mode
                    ? 'bg-sky-800/70 text-sky-100 border-sky-600/60'
                    : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-sky-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {REGION_ORDER.map((region) => (
              <div key={region} className="flex items-center gap-3">
                <span className="w-20 text-[10px] uppercase tracking-widest text-stone-500 font-heading">{region}</span>
                <div className="flex-1 bg-stone-800 rounded-full h-2 overflow-hidden border border-stone-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700"
                    style={{ width: `${config.birthConfig.weights[region]}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-400 w-10 text-right">{config.birthConfig.weights[region]}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {config.birthConfig.mode === 'custom' && (
        <div className="mt-4 border-t border-stone-700 pt-4">
          <p className="text-[10px] uppercase tracking-widest text-stone-500 font-heading mb-3">Custom Weights</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {REGION_ORDER.map((region) => (
              <div key={region} className="flex items-center gap-3">
                <span className="w-20 text-[10px] text-stone-400 font-heading">{region}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.birthConfig.weights[region]}
                  onChange={(e) => updateWeight(region, Number(e.target.value))}
                  className="flex-1 accent-amber-500"
                />
                <span className="text-[10px] text-stone-400 w-10 text-right">{config.birthConfig.weights[region]}%</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-stone-500 font-serif italic">
            Weights are normalized automatically to total 100.
          </p>
        </div>
      )}
    </div>
  );
};
