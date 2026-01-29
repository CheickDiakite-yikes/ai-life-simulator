import { Character, LifeEvent, LifeStage, ResearchAnalysis } from '../types';
import { logDebug } from './logger';

const milestoneRules: Array<{ regex: RegExp; label: string }> = [
  { regex: /(born|birth)/i, label: 'Birth' },
  { regex: /(first steps|walked|walking)/i, label: 'First Steps' },
  { regex: /(first words|spoke)/i, label: 'First Words' },
  { regex: /(school|enroll|classroom|teacher)/i, label: 'School Begins' },
  { regex: /(graduat|diploma|degree)/i, label: 'Graduation' },
  { regex: /(first job|hired|employment|internship)/i, label: 'First Job' },
  { regex: /(marriage|married|wedding|partnered)/i, label: 'Partnership' },
  { regex: /(child|baby|pregnan|parent)/i, label: 'Parenthood' },
  { regex: /(move|migrate|relocate)/i, label: 'Migration' },
  { regex: /(illness|diagnos|hospital)/i, label: 'Health Crisis' },
  { regex: /(death|funeral|passed away|loss)/i, label: 'Loss' },
  { regex: /(retire|retirement)/i, label: 'Retirement' }
];

export const detectMilestones = (description: string, lifeStage?: LifeStage): string[] => {
  if (!description) return [];
  const milestones = milestoneRules
    .filter((rule) => rule.regex.test(description))
    .map((rule) => rule.label);

  if (lifeStage === 'Elderhood' && !milestones.includes('Retirement')) {
    milestones.push('Elderhood');
  }
  return Array.from(new Set(milestones)).slice(0, 3);
};

export const buildResearchAnalysis = (params: {
  character: Character;
  event: LifeEvent;
  choiceText?: string | null;
}): ResearchAnalysis => {
  const { character, event, choiceText } = params;
  const systems = character.systems;
  const systemicFactors: string[] = [];

  if (systems) {
    if (systems.schoolQuality < 40) systemicFactors.push('Under-resourced schooling');
    if (systems.healthcareAccess < 40) systemicFactors.push('Limited healthcare access');
    if (systems.safety < 40) systemicFactors.push('Local safety concerns');
    if (systems.laborMarket < 40) systemicFactors.push('Weak labor market');
    if (systems.discrimination > 60) systemicFactors.push('High discrimination pressure');
  }

  const agencyNotes: string[] = [];
  if (choiceText) {
    if (/(study|school|learn|apply)/i.test(choiceText)) agencyNotes.push('Agency: investing in education');
    if (/(care|family|support|help)/i.test(choiceText)) agencyNotes.push('Agency: prioritizing family care');
    if (/(move|migrate|leave|relocate)/i.test(choiceText)) agencyNotes.push('Agency: attempting mobility');
  }

  const summaryParts = [
    `Event type: ${event.type || 'neutral'}.`,
    character.lifeStage ? `Life stage: ${character.lifeStage}.` : '',
    systemicFactors.length ? `Systemic signals: ${systemicFactors.join('; ')}.` : 'Systemic signals: none dominant.',
    agencyNotes.length ? agencyNotes.join(' ') : ''
  ].filter(Boolean);

  const analysis: ResearchAnalysis = {
    summary: summaryParts.join(' '),
    systemicFactors: systemicFactors.slice(0, 4),
    agencyNotes: agencyNotes.slice(0, 3),
    uncertainty: 'Synthetic model output; outcomes are illustrative, not predictive.'
  };

  logDebug('Built research analysis', analysis);
  return analysis;
};
