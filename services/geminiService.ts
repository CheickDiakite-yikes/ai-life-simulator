import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { AltGenre, Character, GameMode, LifeEvent, MacroEvent, NewsItem, SimulationConfig, TimeStep, WorldRegion } from "../types";
import { getRuntimeApiKey } from "./apiKey";
import { logDebug, logError, logWarn, safeStringify } from "./logger";
import { RecentStart, buildAvoidCountries, extractCountry, matchesAvoidedCountry, summarizeRecentStarts } from "./simulationMemory";
import { addTimeStep, calculateAge, isAfterOrEqual, isValidISODate } from "./timeUtils";
import { applyMoralFriction, applyStatAdjustments, normalizeAttributes } from "./statEngine";
import { normalizeCareer, normalizeEducation, normalizeRelationship, normalizeSystems, getLifeStage } from "./lifeModel";
import { deriveCausalFactors, deriveCounterfactuals } from "./causality";
import { getMacroEvents } from "./macroWorld";
import { formatBirthWeights, getDefaultBirthConfig, pickWeightedRegion } from "./birthConfig";
import { updateLegacy } from "./legacyEngine";
import { applyDriveAdjustments, normalizeDrives } from "./driveEngine";
import { buildResearchAnalysis, detectMilestones } from "./researchAnalysis";
import { inferRegionFromLocation } from "./regionUtils";
import { applyAlternativeMechanics, ensureAlternativeProfile } from "./altMechanics";

const DEFAULT_TIMEOUT_MS = 90000; // 90 seconds for complex AI responses
const SHORT_TIMEOUT_MS = 20000;  // 20 seconds for quick lookups

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
    }, ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

// Helper to get client with current key
const getClient = () => {
  const apiKey = getRuntimeApiKey();
  if (!apiKey) {
    logError("API Key not found - check GEMINI_API_KEY secret");
    throw new Error("Missing Gemini API key. Please check your API key configuration.");
  }
  logDebug("Gemini client initialized", { keyLength: apiKey.length });
  return new GoogleGenAI({ apiKey });
};

const FALLBACK_CONFIG: SimulationConfig = {
  birthConfig: getDefaultBirthConfig(),
  realismIntensity: 'true',
  researchMode: false,
  showCausality: false,
  researchOptIn: false
};

// --- Audio Helper: Raw PCM to WAV ---
// The TTS model returns raw PCM. Browsers need a WAV header to play it via Blob URL.
const addWavHeader = (samples: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): ArrayBuffer => {
  const buffer = new ArrayBuffer(44 + samples.length);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* fmt sub-chunk */
  writeString(view, 12, 'fmt ');
  /* fmt chunk length */
  view.setUint32(16, 16, true);
  /* format (1 = PCM) */
  view.setUint16(20, 1, true);
  /* channels */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate */
  view.setUint32(28, sampleRate * numChannels * 2, true);
  /* block align */
  view.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data sub-chunk */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length, true);

  // Write the PCM samples
  const pcmData = new Uint8Array(buffer, 44);
  pcmData.set(samples);

  return buffer;
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// --- Initialization ---

export const generateInitialCharacter = async (
  mode: GameMode,
  userInputs?: any,
  options?: {
    recentStarts?: RecentStart[];
    config?: SimulationConfig;
    regionHint?: WorldRegion;
    seed?: string;
    fixedTraits?: Partial<Character>;
    altGenre?: AltGenre;
  }
): Promise<Character> => {
  const ai = getClient();
  const recentStarts = options?.recentStarts || [];
  const config = options?.config || FALLBACK_CONFIG;
  const regionHint = options?.regionHint;
  const seed = options?.seed;
  const fixedTraits = options?.fixedTraits;
  const altGenre = options?.altGenre;
  const avoidCountries = buildAvoidCountries(recentStarts);
  const recentSummary = summarizeRecentStarts(recentStarts);
  const hasUserLocation = !!userInputs?.location || !!fixedTraits?.location;
  const maxAttempts = hasUserLocation ? 1 : 5;
  const normalizeLocation = (location: string) => location.toLowerCase().replace(/\s+/g, ' ').trim();
  const recentLocations = new Set(
    recentStarts
      .map((start) => normalizeLocation(start.location || ''))
      .filter((location): location is string => !!location)
  );
  const recentRegions = recentStarts
    .map((start) => inferRegionFromLocation(start.location || ''))
    .filter((region): region is WorldRegion => !!region);
  const baseAvoidRegions = Array.from(new Set(recentRegions));

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      age: { type: Type.NUMBER },
      birthday: { type: Type.STRING, description: "YYYY-MM-DD" },
      gender: { type: Type.STRING },
      ethnicity: { type: Type.STRING },
      location: { type: Type.STRING, description: "City, Country" },
      occupation: { type: Type.STRING, description: "For a baby: 'Infant'" },
      bio: { type: Type.STRING, description: "Describe parents, living situation, and social class context." },
      attributes: {
        type: Type.OBJECT,
        properties: {
          health: { type: Type.NUMBER, description: "0-100" },
          happiness: { type: Type.NUMBER, description: "0-100" },
          personalWealth: { type: Type.NUMBER, description: "Liquid cash. Should be 0 for children." },
          familyWealth: { type: Type.NUMBER, description: "Parental/Household assets and safety net." },
          intelligence: { type: Type.NUMBER, description: "0-100" },
          social: { type: Type.NUMBER, description: "0-100" },
          energy: { type: Type.NUMBER, description: "0-100" },
        }
      },
      inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
      relationships: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            relation: { type: Type.STRING },
            status: { type: Type.STRING }
          }
        } 
      },
      statusEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
      lifeStage: { type: Type.STRING },
      education: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING },
          enrolled: { type: Type.BOOLEAN },
          institutionQuality: { type: Type.NUMBER }
        }
      },
      career: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING },
          sector: { type: Type.STRING },
          stability: { type: Type.NUMBER }
        }
      },
      relationshipStatus: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING },
          dependents: { type: Type.NUMBER },
          caregiverLoad: { type: Type.NUMBER }
        }
      },
      systems: {
        type: Type.OBJECT,
        properties: {
          healthcareAccess: { type: Type.NUMBER },
          schoolQuality: { type: Type.NUMBER },
          laborMarket: { type: Type.NUMBER },
          safety: { type: Type.NUMBER },
          discrimination: { type: Type.NUMBER },
          socialCapital: { type: Type.NUMBER },
          migrationPolicy: { type: Type.NUMBER },
          housingStability: { type: Type.NUMBER }
        }
      },
      legacy: {
        type: Type.OBJECT,
        properties: {
          children: { type: Type.NUMBER },
          communityReputation: { type: Type.NUMBER },
          culturalImpact: { type: Type.NUMBER },
          generationalWealth: { type: Type.NUMBER }
        }
      },
      drives: {
        type: Type.OBJECT,
        properties: {
          belonging: { type: Type.NUMBER },
          mastery: { type: Type.NUMBER },
          autonomy: { type: Type.NUMBER },
          meaning: { type: Type.NUMBER }
        }
      },
      hiddenMetrics: { 
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.NUMBER }
          }
        },
        description: "List of invisible stats. E.g. [{name: 'pollution_exposure', value: 10}]",
        nullable: true
      },
      altGenre: { type: Type.STRING }
    }
  };

  let lastCharacter: Character | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const diversitySeed = Math.floor(Math.random() * 1_000_000_000);
    const diversityGuard = hasUserLocation
      ? 'User provided location; do not override.'
      : `Avoid repeating recent starts. Recent starts to avoid: ${recentSummary}. Avoid these countries if possible: ${avoidCountries.join(', ') || 'None'}. If a country is in the avoid list, you MUST choose a different country. Prefer underrepresented regions if you keep landing in the same area.`;
    const birthWeights = config ? formatBirthWeights(config.birthConfig.weights) : 'Default global weighting';
    const realism = config?.realismIntensity || 'true';
    const attemptAvoidRegions = new Set(baseAvoidRegions);
    if (lastCharacter?.location) {
      const lastRegion = inferRegionFromLocation(lastCharacter.location);
      if (lastRegion) attemptAvoidRegions.add(lastRegion);
    }
    const selectedRegion = !hasUserLocation
      ? (regionHint || pickWeightedRegion(config.birthConfig.weights, { avoidRegions: Array.from(attemptAvoidRegions) }))
      : undefined;
    const regionDirective = selectedRegion ? `Birth region must be ${selectedRegion}.` : '';
    const seedNote = seed ? `User seed: ${seed}.` : '';
    const fixedTraitNote = fixedTraits ? JSON.stringify(fixedTraits) : 'None';

    const altDirective = mode === GameMode.ALTERNATIVE
      ? `ALTERNATIVE MODE: Use ${altGenre || 'a randomized'} genre (fantasy, scifi, superhero, or horror). Introduce grounded supernatural or advanced tech mechanics consistent with the genre. Ensure statusEffects include the core trait (e.g., Arcane Affinity, Tech-Augmented, Latent Power, Haunted).`
      : '';

    const systemInstruction = `You are the engine for 'Simili', an AI-powered hyper-realistic life simulator.
    GOAL: Create a realistic, intersectional starting point for a human life.
    
    RULES:
    1. Realism is paramount. Do not sugarcoat poverty, systemic bias, or health disparities.
    2. If 'Real Life' mode: Randomize location (weighted by configured birth distribution), ethnicity, and class.
    3. WEALTH LOGIC: 
       - A newborn/child has $0 'personalWealth'. 
       - 'familyWealth' represents the parents' socioeconomic status. 
    4. INTERSECTIONALITY: Define ethnicity, gender, and location. These must impact the starting stats and bio.
    5. HIDDEN METRICS: Initialize hidden tracking metrics relevant to the birth environment (e.g., 'pollution_exposure', 'malnutrition_risk').
    6. DIVERSITY GUARD: ${diversityGuard}
    7. VARIATION: Avoid using the same names, locations, or biographical tropes from recent sessions.
    8. REALISM INTENSITY: ${realism}.
    9. BIRTH DISTRIBUTION: ${birthWeights}.
    10. REGION OVERRIDE: ${regionDirective || 'None'}.
    11. FIXED TRAITS: ${fixedTraitNote}. If provided, keep these traits unchanged unless impossible.
    12. ${altDirective}
    
    Mode: ${mode}.
    Session seed: ${diversitySeed}-${attempt}. ${seedNote}
    ${userInputs ? `User preferences: ${JSON.stringify(userInputs)}` : 'Start: Completely random.'}
    
    Return JSON only.`;

    logDebug('Generating initial character', {
      mode,
      attempt,
      hasUserInputs: !!userInputs,
      avoidCountries,
      birthWeights: birthWeights,
      regionHint,
      selectedRegion,
      avoidRegions: Array.from(attemptAvoidRegions),
      realism,
      hasFixedTraits: !!fixedTraits
    });

    let response;
    try {
      response = await withTimeout(ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Generate the character JSON.',
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: schema,
        }
      }), DEFAULT_TIMEOUT_MS, 'Generate initial character');
    } catch (error) {
      logError('Character generation request failed', error);
      if (attempt === maxAttempts) throw error;
      continue;
    }

    if (!response.text) {
      logWarn('Character generation returned empty response');
      if (attempt === maxAttempts) throw new Error('Failed to generate character');
      continue;
    }

    let rawChar;
    try {
      rawChar = JSON.parse(response.text);
    } catch (error) {
      logError('Failed to parse character JSON', safeStringify(response.text));
      if (attempt === maxAttempts) {
        throw new Error("Failed to parse character JSON: " + response.text);
      }
      continue;
    }

    if (!rawChar) {
      logWarn('Generated character data is empty');
      if (attempt === maxAttempts) throw new Error('Generated character data is empty.');
      continue;
    }

    if (fixedTraits) {
      rawChar = {
        ...rawChar,
        ...fixedTraits,
        attributes: fixedTraits.attributes ? { ...rawChar.attributes, ...fixedTraits.attributes } : rawChar.attributes,
        systems: fixedTraits.systems ? { ...rawChar.systems, ...fixedTraits.systems } : rawChar.systems,
        education: fixedTraits.education ? { ...rawChar.education, ...fixedTraits.education } : rawChar.education,
        career: fixedTraits.career ? { ...rawChar.career, ...fixedTraits.career } : rawChar.career,
        relationshipStatus: fixedTraits.relationshipStatus ? { ...rawChar.relationshipStatus, ...fixedTraits.relationshipStatus } : rawChar.relationshipStatus,
        legacy: fixedTraits.legacy ? { ...rawChar.legacy, ...fixedTraits.legacy } : rawChar.legacy,
        drives: fixedTraits.drives ? { ...rawChar.drives, ...fixedTraits.drives } : rawChar.drives,
        hiddenMetrics: fixedTraits.hiddenMetrics ? { ...rawChar.hiddenMetrics, ...fixedTraits.hiddenMetrics } : rawChar.hiddenMetrics
      };
    }

    // Convert array of metrics back to Record for application use
    const metrics: Record<string, number> = {};
    if (rawChar.hiddenMetrics && Array.isArray(rawChar.hiddenMetrics)) {
      rawChar.hiddenMetrics.forEach((m: any) => {
        if (m.name && typeof m.value === 'number') {
          metrics[m.name] = m.value;
        }
      });
    }
    rawChar.hiddenMetrics = metrics;
    rawChar.lifeStage = getLifeStage(rawChar.age || 0);
    rawChar.systems = normalizeSystems(rawChar.systems);
    rawChar.education = normalizeEducation(rawChar.education, rawChar.age);
    rawChar.career = normalizeCareer(rawChar.career, rawChar.age);
    rawChar.relationshipStatus = normalizeRelationship(rawChar.relationshipStatus, rawChar.age);
    rawChar.legacy = rawChar.legacy || { children: 0, communityReputation: 40, culturalImpact: 10, generationalWealth: 5 };
    if (rawChar.age !== undefined && rawChar.age < 5 && rawChar.attributes) {
      rawChar.attributes.personalWealth = 0;
    }
    rawChar.drives = normalizeDrives(rawChar.drives, rawChar as Character);
    if (mode === GameMode.ALTERNATIVE) {
      rawChar = ensureAlternativeProfile(rawChar as Character, altGenre);
    }

    const location = typeof rawChar.location === 'string' ? rawChar.location : '';
    const country = extractCountry(location);
    const normalizedLocation = normalizeLocation(location);
    const isRepeatLocation = normalizedLocation ? recentLocations.has(normalizedLocation) : false;
    const isRepeatCountry = matchesAvoidedCountry(location, avoidCountries);

    lastCharacter = rawChar as Character;

    if (!hasUserLocation && (!location || isRepeatLocation || isRepeatCountry) && attempt < maxAttempts) {
      logWarn('Retrying to avoid repeated location', { location, country, attempt });
      continue;
    }

    logDebug('Generated initial character', { location, country, ethnicity: rawChar.ethnicity, attempt });
    return lastCharacter;
  }

  if (lastCharacter) return lastCharacter;
  throw new Error('Failed to generate character after retries.');
};

// --- Main Game Loop (Thinking Mode) ---

export const advanceLife = async (
  character: Character, 
  previousEvent: LifeEvent | null, 
  choiceMade: string | null,
  currentDate: string,
  timeStep: TimeStep,
  config: SimulationConfig = FALLBACK_CONFIG,
  realWorldContext: string = "",
  options?: { mode?: GameMode; altGenre?: AltGenre }
): Promise<{ character: Character; event: LifeEvent }> => {
  const ai = getClient();
  const expectedNextDate = addTimeStep(currentDate, timeStep);
  const realismIntensity = config?.realismIntensity || 'true';
  const region = inferRegionFromLocation(character.location || '');
  const altGenre = options?.altGenre || character.altGenre;
  const isAlternative = options?.mode === GameMode.ALTERNATIVE || !!altGenre;
  const macroEvents = getMacroEvents({
    date: expectedNextDate || currentDate,
    location: character.location || '',
    timeStep,
    region: region || undefined,
    altGenre: isAlternative ? altGenre : undefined
  });
  const hasRealWorldContext = !!realWorldContext.trim();
  if (!expectedNextDate) {
    logWarn('Invalid current date for time step calculation', { currentDate, timeStep });
  }
  
  // Construct a concise history summary for context
  // We include previous choices to avoid repetition
  const historySummary = previousEvent ? 
    `Last Event Date: ${previousEvent.date}
     Last Event: ${previousEvent.description}
     User's Action: ${choiceMade || 'None (Time Passed)'}
     Options available previously: ${JSON.stringify(previousEvent.choices?.map(c => c.text))}` 
    : "Start of life.";

  const altRules = isAlternative
    ? `
    11. ALTERNATIVE MECHANICS:
       - Keep the world consistent with the ${altGenre || 'chosen'} genre (fantasy, scifi, superhero, or horror).
       - Include a subtle but meaningful supernatural/tech/horror element in the scene.
       - Maintain core trait continuity in statusEffects (Arcane Affinity, Tech-Augmented, Latent Power, Haunted).
       - Avoid cartoonish power fantasy; consequences must feel real.
    `
    : '';

  const prompt = `
    Current Simulation Date: ${currentDate}
    Context:
    - Character: ${JSON.stringify(character)}
    - Life Stage: ${getLifeStage(character.age || 0)}
    - Recent History Summary: ${historySummary}
    - User Decision (Cause): ${choiceMade || 'Passive existence / Time passing'}
    - Time Step to Advance: ${timeStep}
    - Realism Intensity: ${realismIntensity}
    - Research Mode: ${config?.researchMode ? 'ON' : 'OFF'}
    - Macro World Events: ${JSON.stringify(macroEvents)}
    - Expected Next Date: ${expectedNextDate || 'Unknown (use time step)'}
    - Real World News Context: ${realWorldContext}

    INSTRUCTIONS:
    1. TIME & NARRATIVE PACING (Crucial): 
       - If Time Step is 'Year', DO NOT just describe a single day. Summarize the growth, developmental milestones, or major changes that happened *during* that year, then land the narrative on a specific, vivid moment on the new date.
       - If Time Step is 'Day' or 'Week', focus on immediate sensory details and continuity from the last event.
       - The new date MUST be ${expectedNextDate || 'consistent with the time step'}.
       - Advance the date and age accordingly.
    
    2. NARRATIVE FLOW:
       - Write a visceral, realistic scenario. 
       - Acknowledge the user's previous choice explicitly in how the new scenario unfolds (e.g., if they chose to sleep, describe waking up refreshed or still tired).
       - END the description with a "Call to Action" or a specific situation that demands a reaction, setting up the choices.
    
    3. DYNAMIC CHOICES (Strict):
       - Generate 3 distinct choices.
       - DO NOT REPEAT previous choices (e.g., do not just say "Cry loudly" if the child is now 2 years old and walking). 
       - Choices must be age-appropriate (e.g., a baby cries, a toddler throws a toy or babbles, a child speaks).
       - Choices must be relevant to the *specific* event description generated.
    
    4. HIDDEN MECHANICS:
       - Update 'hiddenMetrics' based on environment (pollution, poverty) and choices.
       - Trigger 'major' events if thresholds are met.

    5. ATTRIBUTE UPDATES (Strict):
       - Update character attributes to reflect the event and choice. Do not leave all stats unchanged.
       - Keep health/happiness/intelligence/social/energy in the 0-100 range.
       - Adjust personalWealth/familyWealth realistically based on circumstances.

    6. CAUSAL EXPLANATION (Strict):
       - Provide a short list of causes explaining why this event happened.
       - Provide 1-3 counterfactuals (what might change the outcome).

    7. LIFE LOGIC:
       - Ensure education, career, relationships, and health events are plausible for the age and life stage.
       - Show stage-appropriate dilemmas (school, work, family, civic life).

    8. MILESTONES:
       - If a major life milestone occurs (graduation, first job, first love, migration, loss), include it in 'milestones'.

    9. ETHICS:
       - Avoid rewarding harm. If harmful choices occur, show realistic consequences or tradeoffs.
       - Avoid stereotypes or sensationalized tragedy.

    10. RESEARCH ANALYSIS:
       - If Research Mode is ON, include an 'analysis' object with a neutral summary and systemic/agency factors.
    
    ${altRules}

    Return strict JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      updatedCharacter: {
        type: Type.OBJECT,
        properties: {
           name: { type: Type.STRING },
           age: { type: Type.NUMBER },
           birthday: { type: Type.STRING },
           gender: { type: Type.STRING },
           ethnicity: { type: Type.STRING },
           location: { type: Type.STRING },
           occupation: { type: Type.STRING },
           bio: { type: Type.STRING },
           attributes: {
             type: Type.OBJECT,
             properties: {
               health: { type: Type.NUMBER },
               happiness: { type: Type.NUMBER },
               personalWealth: { type: Type.NUMBER },
               familyWealth: { type: Type.NUMBER },
               intelligence: { type: Type.NUMBER },
               social: { type: Type.NUMBER },
               energy: { type: Type.NUMBER },
             }
           },
           inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
           relationships: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, relation: { type: Type.STRING }, status: { type: Type.STRING } } } },
           statusEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
           lifeStage: { type: Type.STRING },
           education: {
             type: Type.OBJECT,
             properties: {
               level: { type: Type.STRING },
               enrolled: { type: Type.BOOLEAN },
               institutionQuality: { type: Type.NUMBER }
             }
           },
           career: {
             type: Type.OBJECT,
             properties: {
               status: { type: Type.STRING },
               sector: { type: Type.STRING },
               stability: { type: Type.NUMBER }
             }
           },
           relationshipStatus: {
             type: Type.OBJECT,
             properties: {
               status: { type: Type.STRING },
               dependents: { type: Type.NUMBER },
               caregiverLoad: { type: Type.NUMBER }
             }
           },
           systems: {
             type: Type.OBJECT,
             properties: {
               healthcareAccess: { type: Type.NUMBER },
               schoolQuality: { type: Type.NUMBER },
               laborMarket: { type: Type.NUMBER },
               safety: { type: Type.NUMBER },
               discrimination: { type: Type.NUMBER },
               socialCapital: { type: Type.NUMBER },
               migrationPolicy: { type: Type.NUMBER },
               housingStability: { type: Type.NUMBER }
             }
           },
           legacy: {
             type: Type.OBJECT,
             properties: {
               children: { type: Type.NUMBER },
               communityReputation: { type: Type.NUMBER },
               culturalImpact: { type: Type.NUMBER },
               generationalWealth: { type: Type.NUMBER }
             }
           },
           drives: {
             type: Type.OBJECT,
             properties: {
               belonging: { type: Type.NUMBER },
               mastery: { type: Type.NUMBER },
               autonomy: { type: Type.NUMBER },
               meaning: { type: Type.NUMBER }
             }
           },
           hiddenMetrics: { 
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: {
                 name: { type: Type.STRING },
                 value: { type: Type.NUMBER }
               }
             },
             description: "Updated hidden counters." 
           },
           altGenre: { type: Type.STRING }
        }
      },
      newEvent: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.NUMBER },
          date: { type: Type.STRING },
          description: { type: Type.STRING, description: "Visceral narrative ending with a situation requiring action." },
          visualPrompt: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['neutral', 'positive', 'negative', 'major'] },
          lifeStage: { type: Type.STRING },
          causes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                factor: { type: Type.STRING },
                impact: { type: Type.STRING },
                evidence: { type: Type.STRING }
              }
            }
          },
          counterfactuals: { type: Type.ARRAY, items: { type: Type.STRING } },
          macroEvents: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                category: { type: Type.STRING },
                scope: { type: Type.STRING },
                date: { type: Type.STRING },
                impactSummary: { type: Type.STRING }
              }
            }
          },
          milestones: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              systemicFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
              agencyNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
              uncertainty: { type: Type.STRING }
            }
          },
          news: {
            type: Type.ARRAY,
            items: {
               type: Type.OBJECT,
               properties: {
                 headline: { type: Type.STRING },
                 category: { type: Type.STRING, enum: ['POLITICS', 'TECH', 'HEALTH', 'WORLD', 'LOCAL'] },
                 date: { type: Type.STRING }
               }
            }
          },
          choices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING, description: "Age-appropriate, non-repetitive action." },
                consequenceHint: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  };

  logDebug('Advancing life', {
    currentDate,
    timeStep,
    expectedNextDate,
    hasRealWorldContext,
    region,
    researchMode: !!config?.researchMode,
    altGenre
  });

  const response = await withTimeout(ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: 'application/json',
      responseSchema: schema,
    }
  }), DEFAULT_TIMEOUT_MS, 'Advance life');

  let data;
  try {
    data = JSON.parse(response.text || '{}');
  } catch (error) {
    logError('Failed to parse simulation JSON', safeStringify(response.text));
    throw new Error("Failed to parse simulation JSON: " + response.text);
  }

  if (!data || !data.updatedCharacter || !data.newEvent) {
    throw new Error("Simulation returned invalid data structure (missing updatedCharacter or newEvent).");
  }

  let rawUpdatedChar = data.updatedCharacter;
  const rawEvent = data.newEvent;
  if (!rawEvent.type) {
    rawEvent.type = 'neutral';
  }

  rawUpdatedChar.attributes = normalizeAttributes(rawUpdatedChar.attributes, character.attributes);

  if (!Array.isArray(rawUpdatedChar.inventory)) {
    rawUpdatedChar.inventory = character.inventory || [];
  }
  if (!Array.isArray(rawUpdatedChar.relationships)) {
    rawUpdatedChar.relationships = character.relationships || [];
  }
  if (!Array.isArray(rawUpdatedChar.statusEffects)) {
    rawUpdatedChar.statusEffects = character.statusEffects || [];
  }

  rawUpdatedChar.attributes = applyStatAdjustments({
    attributes: rawUpdatedChar.attributes,
    previousAttributes: character.attributes,
    choiceText: choiceMade,
    eventType: rawEvent.type,
    timeStep,
    description: rawEvent.description,
    realismIntensity
  });

  // Convert array of metrics back to Record for application use
  const metrics: Record<string, number> = {};
  if (rawUpdatedChar.hiddenMetrics && Array.isArray(rawUpdatedChar.hiddenMetrics)) {
    rawUpdatedChar.hiddenMetrics.forEach((m: any) => {
      if (m.name && typeof m.value === 'number') {
        metrics[m.name] = m.value;
      }
    });
  } else if (character.hiddenMetrics) {
    // Keep old metrics if none returned or incorrect format
    Object.assign(metrics, character.hiddenMetrics);
  }

  const moralResult = applyMoralFriction({
    hiddenMetrics: metrics,
    choiceText: choiceMade,
    realismIntensity,
    attributes: rawUpdatedChar.attributes
  });

  rawUpdatedChar.hiddenMetrics = { ...metrics, ...moralResult.hiddenMetrics };
  rawUpdatedChar.attributes = moralResult.attributes;

  if (!rawUpdatedChar.birthday && character.birthday) {
    rawUpdatedChar.birthday = character.birthday;
  }

  rawUpdatedChar.lifeStage = getLifeStage(rawUpdatedChar.age || 0);
  rawUpdatedChar.systems = normalizeSystems(rawUpdatedChar.systems || character.systems);
  rawUpdatedChar.education = normalizeEducation(rawUpdatedChar.education || character.education, rawUpdatedChar.age);
  rawUpdatedChar.career = normalizeCareer(rawUpdatedChar.career || character.career, rawUpdatedChar.age);
  rawUpdatedChar.relationshipStatus = normalizeRelationship(rawUpdatedChar.relationshipStatus || character.relationshipStatus, rawUpdatedChar.age);
  rawUpdatedChar.legacy = updateLegacy({
    legacy: rawUpdatedChar.legacy || character.legacy,
    description: rawEvent.description,
    choiceText: choiceMade
  });
  rawUpdatedChar.drives = applyDriveAdjustments({
    drives: rawUpdatedChar.drives || character.drives,
    character: rawUpdatedChar as Character,
    timeStep,
    eventType: rawEvent.type,
    description: rawEvent.description,
    choiceText: choiceMade,
    realismIntensity
  });
  if (isAlternative) {
    rawUpdatedChar = ensureAlternativeProfile(rawUpdatedChar as Character, altGenre);
  }

  // Normalize event date to enforce time step consistency
  let eventDate = typeof rawEvent.date === 'string' ? rawEvent.date : '';
  if (!isValidISODate(eventDate)) {
    logWarn('Invalid event date returned, normalizing', { eventDate, expectedNextDate });
    eventDate = expectedNextDate || currentDate;
  }
  if (expectedNextDate && eventDate !== expectedNextDate) {
    logWarn('Event date mismatch; enforcing expected date', { eventDate, expectedNextDate });
    eventDate = expectedNextDate;
  }
  if (expectedNextDate && !isAfterOrEqual(eventDate, currentDate)) {
    logWarn('Event date not after current date; enforcing expected date', { eventDate, currentDate });
    eventDate = expectedNextDate;
  }
  rawEvent.date = eventDate;
  rawEvent.lifeStage = rawUpdatedChar.lifeStage;
  if (!Array.isArray(rawEvent.milestones) || rawEvent.milestones.length === 0) {
    rawEvent.milestones = detectMilestones(rawEvent.description, rawEvent.lifeStage);
  }
  if (config?.researchMode && (!rawEvent.analysis || !rawEvent.analysis.summary)) {
    rawEvent.analysis = buildResearchAnalysis({
      character: rawUpdatedChar as Character,
      event: rawEvent as LifeEvent,
      choiceText: choiceMade
    });
  }
  if (!Array.isArray(rawEvent.macroEvents) || rawEvent.macroEvents.length === 0) {
    rawEvent.macroEvents = macroEvents as MacroEvent[];
  }

  // Normalize age if the model drifts after time step changes
  const derivedAge = calculateAge(rawUpdatedChar.birthday, eventDate);
  if (derivedAge !== null) {
    const rawAge = Number(rawUpdatedChar.age);
    if (Number.isNaN(rawAge) || Math.abs(rawAge - derivedAge) >= 2) {
      logWarn('Normalizing age to match dates', { rawAge, derivedAge });
      rawUpdatedChar.age = derivedAge;
    }
  }

  // Fallback news if model omits it but we have real-world context
  if ((!Array.isArray(rawEvent.news) || rawEvent.news.length === 0) && hasRealWorldContext) {
    rawEvent.news = buildFallbackNews(realWorldContext, eventDate);
    if (rawEvent.news.length === 0) {
      logWarn('Real-world context provided but no news could be parsed');
    }
  }
  if (Array.isArray(rawEvent.news)) {
    rawEvent.news = rawEvent.news.map((item: NewsItem) => ({
      ...item,
      date: item.date || eventDate,
      category: item.category || inferNewsCategory(item.headline || '')
    }));
  }

  if (Array.isArray(rawEvent.macroEvents)) {
    const macroNews = rawEvent.macroEvents.map((event) => macroEventToNews(event));
    if (!Array.isArray(rawEvent.news) || rawEvent.news.length === 0) {
      rawEvent.news = macroNews;
    } else {
      const existing = new Set(rawEvent.news.map((item) => item.headline));
      rawEvent.news = [...rawEvent.news, ...macroNews.filter((item) => !existing.has(item.headline))].slice(0, 10);
    }
  }

  if (!Array.isArray(rawEvent.causes) || rawEvent.causes.length === 0) {
    rawEvent.causes = deriveCausalFactors({
      character: rawUpdatedChar as Character,
      event: rawEvent as LifeEvent,
      choiceText: choiceMade,
      config
    });
  }

  if (!Array.isArray(rawEvent.counterfactuals) || rawEvent.counterfactuals.length === 0) {
    rawEvent.counterfactuals = deriveCounterfactuals(rawUpdatedChar as Character);
  }

  if (isAlternative) {
    rawUpdatedChar = applyAlternativeMechanics({
      character: rawUpdatedChar as Character,
      event: rawEvent as LifeEvent,
      choiceText: choiceMade,
      timeStep,
      realismIntensity
    });
  }

  logDebug('Advance life result', {
    eventDate,
    eventType: rawEvent.type,
    newsCount: Array.isArray(rawEvent.news) ? rawEvent.news.length : 0,
    milestonesCount: Array.isArray(rawEvent.milestones) ? rawEvent.milestones.length : 0,
    hasAnalysis: !!rawEvent.analysis
  });

  return {
    character: rawUpdatedChar as Character,
    event: { ...rawEvent, selectedChoice: choiceMade }
  };
};

const inferNewsCategory = (headline: string): NewsItem['category'] => {
  const text = headline.toLowerCase();
  if (/(election|policy|government|minister|senate|parliament|president)/.test(text)) return 'POLITICS';
  if (/(ai|tech|software|internet|robot|startup|chip|device|cyber)/.test(text)) return 'TECH';
  if (/(health|disease|virus|hospital|vaccine|medicine|mental)/.test(text)) return 'HEALTH';
  if (/(local|community|city|town|county|state)/.test(text)) return 'LOCAL';
  return 'WORLD';
};

const buildFallbackNews = (context: string, date: string): NewsItem[] => {
  if (!context) return [];
  const sentences = context
    .replace(/\n/g, ' ')
    .split(/(?:\\.|!|\\?)\\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.slice(0, 3).map((sentence) => ({
    headline: sentence.length > 140 ? `${sentence.slice(0, 137)}...` : sentence,
    category: inferNewsCategory(sentence),
    date
  }));
};

const macroEventToNews = (event: MacroEvent): NewsItem => {
  return {
    headline: event.headline,
    category: event.category,
    date: event.date
  } as NewsItem;
};

// --- Search Grounding for Real World Events ---

export const getRealWorldContext = async (): Promise<string> => {
  let ai: GoogleGenAI;
  try {
    ai = getClient();
  } catch (error) {
    logError("Search failed", error);
    return "";
  }
  try {
    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "What are the most impactful global news headlines right now regarding politics, health, technology, and environment? Summarize in 3 sentences.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    }), SHORT_TIMEOUT_MS, 'Fetch real-world context');
    const text = response.text || "No major news found.";
    logDebug('Fetched real-world context', { length: text.length });
    return text;
  } catch (error) {
    logError("Search failed", error);
    return "";
  }
};

// --- Media Generation ---

export const generateSceneImage = async (
  description: string, 
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9" | "2:3" | "3:2",
  resolution: "1K" | "2K" | "4K"
): Promise<string | null> => {
  const ai = getClient();
  try {
    logDebug('Generating scene image', { aspectRatio, resolution });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A highly realistic, cinematic photo, 8k resolution, atmospheric lighting. Documentary style. Context: ${description}` }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    logError("Image gen failed", error);
    return null;
  }
};

export const generateSceneVideo = async (prompt: string, aspectRatio: "16:9" | "9:16"): Promise<string | null> => {
  const apiKey = getRuntimeApiKey();
  if (!apiKey) {
    logError('Video generation failed: missing API key');
    return null;
  }
  const freshAi = new GoogleGenAI({ apiKey }); 

  try {
    logDebug('Generating scene video', { aspectRatio });
    let operation = await freshAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic movie scene, realistic 4k, documentary style: ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await freshAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const vidResponse = await fetch(`${downloadLink}&key=${apiKey}`);
      const blob = await vidResponse.blob();
      return URL.createObjectURL(blob);
    }
    return null;

  } catch (error) {
    logError("Video gen failed", error);
    return null;
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  const ai = getClient();
  try {
    logDebug('Generating speech', { length: text.length });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      // Decode base64 to raw PCM
      const pcmBytes = base64ToUint8Array(base64Audio);
      // Add WAV header so simple <audio> elements can play it
      const wavBuffer = addWavHeader(pcmBytes);
      // Create Blob
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error) {
    logError("Speech gen failed", error);
    return null;
  }
};

// --- Chat ---
export const getChatResponse = async (
  history: {role: string, parts: {text: string}[]}[],
  msg: string,
  gameContext: string = ''
) => {
  const ai = getClient();
  const systemInstruction = `You are a helpful AI assistant inside the Simili life simulation. You know the game state and help the user understand mechanics or lore.\n\nCurrent Game State:\n${gameContext || 'No active game state provided.'}`;
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: {
      systemInstruction
    }
  });
  
  logDebug('Oracle chat request', { historyLength: history.length, contextLength: gameContext.length });
  const result = await chat.sendMessage({ message: msg });
  return result.text;
};
