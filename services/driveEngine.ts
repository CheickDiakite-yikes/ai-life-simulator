import { Character, DriveStats, RealismIntensity, TimeStep } from '../types';
import { logDebug } from './logger';

const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const timeMultiplier = (step: TimeStep): number => {
  switch (step) {
    case 'Day':
      return 0.3;
    case 'Week':
      return 0.6;
    case 'Month':
      return 1.0;
    case 'Year':
      return 1.6;
    default:
      return 1.0;
  }
};

const baseFrom = (value: number, weight: number): number => (value - 50) * weight;

export const deriveInitialDrives = (character: Character): DriveStats => {
  const attrs = character.attributes;
  const systems = character.systems;
  const base = 45;

  const belonging = base
    + baseFrom(attrs.social, 0.4)
    + baseFrom(systems?.socialCapital ?? 50, 0.4);
  const mastery = base
    + baseFrom(attrs.intelligence, 0.4)
    + baseFrom(systems?.schoolQuality ?? 50, 0.3);
  const autonomy = base
    + baseFrom(attrs.personalWealth || 0, 0.03)
    + baseFrom(systems?.safety ?? 50, 0.2);
  const meaning = base
    + baseFrom(attrs.happiness, 0.2)
    + baseFrom(systems?.healthcareAccess ?? 50, 0.1);

  return {
    belonging: clamp(belonging),
    mastery: clamp(mastery),
    autonomy: clamp(autonomy),
    meaning: clamp(meaning)
  };
};

const driveRules: Array<{ regex: RegExp; delta: Partial<DriveStats> }> = [
  { regex: /(friend|family|community|love|relationship|bond)/i, delta: { belonging: 3, meaning: 1 } },
  { regex: /(study|learn|practice|skill|training|craft|master)/i, delta: { mastery: 3 } },
  { regex: /(choice|decide|independent|freedom|move|start|quit)/i, delta: { autonomy: 2 } },
  { regex: /(volunteer|purpose|faith|spiritual|mentor|legacy)/i, delta: { meaning: 3 } },
  { regex: /(lonely|isolat|rejected|abandon)/i, delta: { belonging: -3 } },
  { regex: /(failure|fired|fail|dropout|layoff)/i, delta: { mastery: -3, meaning: -1 } },
  { regex: /(coerc|forced|abuse|control|trapped)/i, delta: { autonomy: -3 } },
  { regex: /(grief|loss|death|mourning)/i, delta: { meaning: -2 } }
];

export const normalizeDrives = (drives: DriveStats | undefined, character: Character): DriveStats => {
  if (!drives) return deriveInitialDrives(character);
  return {
    belonging: clamp(drives.belonging),
    mastery: clamp(drives.mastery),
    autonomy: clamp(drives.autonomy),
    meaning: clamp(drives.meaning)
  };
};

export const applyDriveAdjustments = (params: {
  drives: DriveStats | undefined;
  character: Character;
  timeStep: TimeStep;
  eventType?: string;
  description?: string;
  choiceText?: string | null;
  realismIntensity?: RealismIntensity;
}): DriveStats => {
  const { drives, character, timeStep, eventType, description, choiceText, realismIntensity = 'true' } = params;
  const multiplier = timeMultiplier(timeStep);
  const intensity = realismIntensity === 'gentle' ? 0.8 : realismIntensity === 'harsh' ? 1.2 : 1;
  const next = normalizeDrives(drives, character);

  const context = `${description || ''} ${choiceText || ''}`.trim();
  const baseDelta = eventType === 'positive' ? 1 : eventType === 'negative' ? -1 : 0;
  next.belonging += baseDelta * 0.6;
  next.mastery += baseDelta * 0.4;
  next.autonomy += baseDelta * 0.4;
  next.meaning += baseDelta * 0.6;

  if (context) {
    driveRules.forEach((rule) => {
      if (rule.regex.test(context)) {
        if (rule.delta.belonging) next.belonging += rule.delta.belonging * multiplier * intensity;
        if (rule.delta.mastery) next.mastery += rule.delta.mastery * multiplier * intensity;
        if (rule.delta.autonomy) next.autonomy += rule.delta.autonomy * multiplier * intensity;
        if (rule.delta.meaning) next.meaning += rule.delta.meaning * multiplier * intensity;
      }
    });
  }

  const normalized = {
    belonging: clamp(next.belonging),
    mastery: clamp(next.mastery),
    autonomy: clamp(next.autonomy),
    meaning: clamp(next.meaning)
  };

  logDebug('Drive adjustments applied', normalized);
  return normalized;
};
