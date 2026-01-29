import React from 'react';
import { SimulationConfig, RealismIntensity, WorldRegion } from '../types';
import { BIRTH_WEIGHT_PRESETS, normalizeWeights } from '../services/birthConfig';
import { X, Settings, Calendar } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulationConfig;
  onChange: (config: SimulationConfig) => void;
  startYear: string;
  onStartYearChange: (year: string) => void;
  modeName: string;
}

const REGION_ORDER: WorldRegion[] = ['Africa', 'Americas', 'Asia', 'Europe', 'MiddleEast', 'Oceania'];

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  config, 
  onChange,
  startYear,
  onStartYearChange,
  modeName
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-stone-900 border border-amber-700/40 rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-stone-900 border-b border-stone-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-amber-500" />
            <h2 className="text-lg font-heading tracking-wider text-stone-200">
              {modeName} Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors text-stone-400 hover:text-stone-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-widest text-stone-400 font-heading">Realism Intensity</label>
              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-500">Research</label>
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
            <div className="flex gap-2">
              {(['gentle', 'true', 'harsh'] as RealismIntensity[]).map((level) => (
                <button
                  key={level}
                  onClick={() => handleRealism(level)}
                  className={`flex-1 py-2.5 text-[11px] font-heading tracking-widest uppercase border rounded-lg transition-colors ${
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

          <div className="border-t border-stone-700 pt-6 space-y-4">
            <label className="text-xs uppercase tracking-widest text-stone-400 font-heading">Birth Distribution</label>
            <div className="flex gap-2">
              {(['global', 'balanced', 'custom'] as SimulationConfig['birthConfig']['mode'][]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`flex-1 py-2.5 text-[11px] font-heading tracking-widest uppercase border rounded-lg transition-colors ${
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

            {config.birthConfig.mode === 'custom' && (
              <div className="mt-4 border-t border-stone-700 pt-4">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-heading mb-3">Custom Weights</p>
                <div className="space-y-3">
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

          <div className="border-t border-stone-700 pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-500" />
              <label className="text-xs uppercase tracking-widest text-stone-400 font-heading">Start Year</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1000}
                max={3000}
                placeholder="e.g., 1994"
                value={startYear}
                onChange={(e) => onStartYearChange(e.target.value)}
                className="w-32 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:border-amber-600 focus:outline-none font-serif"
              />
              <p className="text-xs text-stone-500 font-serif">
                Leave blank to randomize birth year
              </p>
            </div>
            <p className="text-[11px] text-stone-600 font-serif italic">
              If set, the character starts as a newborn in that year.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-stone-900 border-t border-stone-700 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-amber-800/70 hover:bg-amber-700/70 text-amber-100 border border-amber-600/60 rounded-lg text-sm font-heading tracking-widest uppercase transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
