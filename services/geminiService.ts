import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { Character, GameMode, LifeEvent, TimeStep } from "../types";

// Helper to get client with current key
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
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

export const generateInitialCharacter = async (mode: GameMode, userInputs?: any): Promise<Character> => {
  const ai = getClient();
  
  const systemInstruction = `You are the engine for 'Aetheria', a hyper-realistic life simulator.
  GOAL: Create a realistic, intersectional starting point for a human life.
  
  RULES:
  1. Realism is paramount. Do not sugarcoat poverty, systemic bias, or health disparities.
  2. If 'Real Life' mode: Randomize location (weighted by real world population density), ethnicity, and class.
  3. WEALTH LOGIC: 
     - A newborn/child has $0 'personalWealth'. 
     - 'familyWealth' represents the parents' socioeconomic status. 
  4. INTERSECTIONALITY: Define ethnicity, gender, and location. These must impact the starting stats and bio.
  5. HIDDEN METRICS: Initialize hidden tracking metrics relevant to the birth environment (e.g., 'pollution_exposure', 'malnutrition_risk').
  
  Mode: ${mode}.
  ${userInputs ? `User preferences: ${JSON.stringify(userInputs)}` : 'Start: Completely random.'}
  
  Return JSON only.`;

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
      }
    }
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: 'Generate the character JSON.',
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: schema,
    }
  });

  if (!response.text) throw new Error("Failed to generate character");
  
  const rawChar = JSON.parse(response.text);
  
  // Convert array of metrics back to Record for application use
  const metrics: Record<string, number> = {};
  if (Array.isArray(rawChar.hiddenMetrics)) {
    rawChar.hiddenMetrics.forEach((m: any) => {
      if (m.name && typeof m.value === 'number') {
        metrics[m.name] = m.value;
      }
    });
  }
  rawChar.hiddenMetrics = metrics;

  return rawChar as Character;
};

// --- Main Game Loop (Thinking Mode) ---

export const advanceLife = async (
  character: Character, 
  previousEvent: LifeEvent | null, 
  choiceMade: string | null,
  currentDate: string,
  timeStep: TimeStep,
  realWorldContext: string = ""
): Promise<{ character: Character; event: LifeEvent }> => {
  const ai = getClient();
  
  // Construct a concise history summary for context
  // We include previous choices to avoid repetition
  const historySummary = previousEvent ? 
    `Last Event Date: ${previousEvent.date}
     Last Event: ${previousEvent.description}
     User's Action: ${choiceMade || 'None (Time Passed)'}
     Options available previously: ${JSON.stringify(previousEvent.choices?.map(c => c.text))}` 
    : "Start of life.";

  const prompt = `
    Current Simulation Date: ${currentDate}
    Context:
    - Character: ${JSON.stringify(character)}
    - Recent History Summary: ${historySummary}
    - User Decision (Cause): ${choiceMade || 'Passive existence / Time passing'}
    - Time Step to Advance: ${timeStep}
    - Real World News Context: ${realWorldContext}

    INSTRUCTIONS:
    1. TIME & NARRATIVE PACING (Crucial): 
       - If Time Step is 'Year', DO NOT just describe a single day. Summarize the growth, developmental milestones, or major changes that happened *during* that year, then land the narrative on a specific, vivid moment on the new date.
       - If Time Step is 'Day' or 'Week', focus on immediate sensory details and continuity from the last event.
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
           }
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

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: 'application/json',
      responseSchema: schema,
    }
  });

  const data = JSON.parse(response.text || '{}');
  const rawUpdatedChar = data.updatedCharacter;
  
  // Convert array of metrics back to Record for application use
  const metrics: Record<string, number> = {};
  if (Array.isArray(rawUpdatedChar.hiddenMetrics)) {
    rawUpdatedChar.hiddenMetrics.forEach((m: any) => {
      if (m.name && typeof m.value === 'number') {
        metrics[m.name] = m.value;
      }
    });
  } else if (character.hiddenMetrics) {
    // Keep old metrics if none returned or incorrect format
    Object.assign(metrics, character.hiddenMetrics);
  }
  rawUpdatedChar.hiddenMetrics = metrics;

  return {
    character: rawUpdatedChar as Character,
    event: { ...data.newEvent, selectedChoice: choiceMade }
  };
};

// --- Search Grounding for Real World Events ---

export const getRealWorldContext = async (): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "What are the most impactful global news headlines right now regarding politics, health, technology, and environment? Summarize in 3 sentences.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "No major news found.";
  } catch (e) {
    console.error("Search failed", e);
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
  } catch (e) {
    console.error("Image gen failed", e);
    return null;
  }
};

export const generateSceneVideo = async (prompt: string, aspectRatio: "16:9" | "9:16"): Promise<string | null> => {
  const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY || '' }); 

  try {
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
      const vidResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await vidResponse.blob();
      return URL.createObjectURL(blob);
    }
    return null;

  } catch (e) {
    console.error("Video gen failed", e);
    return null;
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  const ai = getClient();
  try {
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
  } catch (e) {
    console.error("Speech gen failed", e);
    return null;
  }
};

// --- Chat ---
export const getChatResponse = async (history: {role: string, parts: {text: string}[]}[], msg: string) => {
    const ai = getClient();
    const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        history: history,
        config: {
            systemInstruction: "You are a helpful AI assistant inside the Aetheria simulation. You know the game state and help the user understand mechanics or lore."
        }
    });
    
    const result = await chat.sendMessage({ message: msg });
    return result.text;
}