import React from 'react';
import { Character, WorldRegion } from '../types';

interface ComparisonLife {
  region: WorldRegion;
  character: Character;
}

interface MultiLifeComparisonProps {
  isOpen: boolean;
  isLoading: boolean;
  lives: ComparisonLife[];
  onClose: () => void;
}

export const MultiLifeComparison: React.FC<MultiLifeComparisonProps> = ({ isOpen, isLoading, lives, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-5xl w-full bg-[#1c1917] border border-amber-700/40 rounded-lg p-6 text-stone-200 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading tracking-widest uppercase text-amber-400">Parallel Lives Lab</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-amber-200">Close</button>
        </div>

        {isLoading && (
          <div className="text-center py-10 text-stone-400 font-serif">Generating comparison lives...</div>
        )}

        {!isLoading && lives.length === 0 && (
          <div className="text-center py-10 text-stone-500 font-serif">No comparison lives generated yet.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lives.map((entry) => (
            <div key={entry.region} className="bg-stone-900/80 border border-stone-700 rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-widest text-stone-500 font-heading">{entry.region}</div>
              <div className="mt-2 text-lg font-heading text-amber-200">{entry.character.name}</div>
              <div className="text-xs text-stone-400">{entry.character.location}</div>
              <div className="mt-3 text-xs text-stone-500">Age {entry.character.age} · {entry.character.gender}</div>
              <div className="mt-2 text-xs text-stone-400">Health {entry.character.attributes.health} · Mental {entry.character.attributes.happiness}</div>
              <div className="text-xs text-stone-400">Wealth ${entry.character.attributes.familyWealth?.toLocaleString?.() || 0}</div>
              {entry.character.systems && (
                <div className="mt-2 text-[10px] text-stone-500">
                  Systems: Health {entry.character.systems.healthcareAccess} · School {entry.character.systems.schoolQuality}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
