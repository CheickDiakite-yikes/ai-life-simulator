import React from 'react';
import { SimulationConfig } from '../types';

interface EthicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimulationConfig;
}

export const EthicsModal: React.FC<EthicsModalProps> = ({ isOpen, onClose, config }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-2xl w-full bg-[#1c1917] border border-amber-700/40 rounded-lg p-6 text-stone-200 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading tracking-widest uppercase text-amber-400">Ethics Dashboard</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-amber-200">Close</button>
        </div>

        <div className="space-y-4 text-sm font-serif">
          <section>
            <h3 className="text-xs uppercase tracking-widest text-stone-500 font-heading mb-2">Assumptions</h3>
            <ul className="list-disc list-inside space-y-1 text-stone-400">
              <li>Outcomes are synthetic and probabilistic, not predictive.</li>
              <li>System metrics are modeled heuristics, not real data about individuals.</li>
              <li>Life outcomes depend on both choice and structural context.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest text-stone-500 font-heading mb-2">Bias & Fairness</h3>
            <ul className="list-disc list-inside space-y-1 text-stone-400">
              <li>We attempt to avoid stereotypes by modeling within-country diversity.</li>
              <li>Discrimination is represented as structural pressure, not identity destiny.</li>
              <li>Players can inspect causal threads to understand why outcomes occur.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest text-stone-500 font-heading mb-2">Simulation Settings</h3>
            <div className="text-stone-400 space-y-1">
              <div>Realism Intensity: <span className="text-amber-200">{config.realismIntensity}</span></div>
              <div>Research Mode: <span className="text-amber-200">{config.researchMode ? 'On' : 'Off'}</span></div>
              <div>Birth Distribution Mode: <span className="text-amber-200">{config.birthConfig.mode}</span></div>
            </div>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest text-stone-500 font-heading mb-2">Transparency</h3>
            <p className="text-stone-400">
              This simulation blends algorithmic rules with AI narrative generation. Some elements are synthetic storytelling and should be treated as illustrative rather than factual.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
