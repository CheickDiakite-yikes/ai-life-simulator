import { LegacyMetrics } from '../types';

const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

export const updateLegacy = (params: {
  legacy?: LegacyMetrics;
  description?: string;
  choiceText?: string | null;
}): LegacyMetrics => {
  const { legacy = {}, description = '', choiceText } = params;
  const context = `${description} ${choiceText || ''}`.trim();
  const next: LegacyMetrics = {
    children: legacy.children ?? 0,
    communityReputation: legacy.communityReputation ?? 40,
    culturalImpact: legacy.culturalImpact ?? 10,
    generationalWealth: legacy.generationalWealth ?? 5
  };

  if (/child|baby|pregnan|parent/i.test(context)) {
    next.children = (next.children || 0) + 1;
    next.communityReputation = clamp((next.communityReputation || 40) + 2);
  }

  if (/community|volunteer|leadership|organize/i.test(context)) {
    next.communityReputation = clamp((next.communityReputation || 40) + 4);
  }

  if (/art|music|write|publish|invent|research/i.test(context)) {
    next.culturalImpact = clamp((next.culturalImpact || 10) + 3);
  }

  if (/inherit|estate|legacy|family business/i.test(context)) {
    next.generationalWealth = clamp((next.generationalWealth || 5) + 4);
  }

  return next;
};
