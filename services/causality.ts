import { CausalFactor, Character, LifeEvent, SimulationConfig } from '../types';

const pushFactor = (factors: CausalFactor[], factor: string, score: number, evidence?: string) => {
  const impact: CausalFactor['impact'] = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  factors.push({ factor, impact, evidence });
};

export const deriveCausalFactors = (params: {
  character: Character;
  event: LifeEvent;
  choiceText?: string | null;
  config: SimulationConfig;
}): CausalFactor[] => {
  const { character, event, choiceText } = params;
  const factors: CausalFactor[] = [];
  const systems = character.systems;
  const hidden = character.hiddenMetrics || {};

  if (systems) {
    if (systems.healthcareAccess < 40) pushFactor(factors, 'Limited healthcare access', 80);
    if (systems.schoolQuality < 40) pushFactor(factors, 'Under-resourced schooling', 65);
    if (systems.laborMarket < 40) pushFactor(factors, 'Weak local job market', 60);
    if (systems.safety < 40) pushFactor(factors, 'Unsafe environment', 70);
    if (systems.discrimination > 60) pushFactor(factors, 'Systemic discrimination pressure', 75);
    if (systems.socialCapital < 40) pushFactor(factors, 'Low social capital', 55);
    if (systems.housingStability < 40) pushFactor(factors, 'Housing instability', 65);
  }

  if (hidden.moral_debt && hidden.moral_debt > 30) {
    pushFactor(factors, 'Moral debt accumulating', hidden.moral_debt, 'Repeated harmful choices');
  }
  if (hidden.legal_risk && hidden.legal_risk > 30) {
    pushFactor(factors, 'Legal risk elevated', hidden.legal_risk, 'High exposure to enforcement');
  }

  if (choiceText) {
    if (/(care|family|sibling|parent|child)/i.test(choiceText)) {
      pushFactor(factors, 'Caretaking responsibility', 50, 'Recent choice prioritized family');
    }
    if (/(study|school|education|exam)/i.test(choiceText)) {
      pushFactor(factors, 'Education investment', 45, 'Recent choice prioritized learning');
    }
  }

  if (event.type === 'negative' && factors.length === 0) {
    pushFactor(factors, 'Random adversity', 35, 'No dominant systemic signal detected');
  }

  if (factors.length === 0) {
    pushFactor(factors, 'Life momentum', 30, 'Baseline progression');
  }

  return factors.slice(0, 5);
};

export const deriveCounterfactuals = (character: Character): string[] => {
  const systems = character.systems;
  const counterfactuals: string[] = [];

  if (systems) {
    if (systems.schoolQuality < 40) counterfactuals.push('With stronger school support, academic outcomes could accelerate.');
    if (systems.healthcareAccess < 40) counterfactuals.push('With better healthcare access, health shocks might be reduced.');
    if (systems.laborMarket < 40) counterfactuals.push('In a stronger job market, income stability could improve.');
    if (systems.socialCapital < 40) counterfactuals.push('With deeper networks, opportunities could expand faster.');
  }

  return counterfactuals.slice(0, 3);
};
