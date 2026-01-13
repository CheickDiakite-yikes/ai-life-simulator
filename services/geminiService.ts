import { GoogleGenAI, Type, FunctionDeclaration, Schema, Modality } from "@google/genai";
import { Character, GameMode, LifeEvent, Choice, TimeStep } from "../types";

// Helper to get client with current key
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

// --- Initialization ---

export const generateInitialCharacter = async (mode: GameMode, userInputs?: any): Promise<Character> => {
  const ai = getClient();
  const isFantasy = mode === GameMode.ALTERNATIVE;
  
  const systemInstruction = `You are the engine for 'Aetheria', a sociological life simulator used for research and education.
  GOAL: Create a realistic, intersectional starting point for a human life.
  
  RULES:
  1. Realism is paramount. Do not sugarcoat poverty, systemic bias, or health disparities.
  2. If 'Real Life' mode: Randomize location (weighted by real world population density), ethnicity, and class.
  3. WEALTH LOGIC: 
     - A newborn/child has $0 'personalWealth'. 
     - 'familyWealth' represents the parents' socioeconomic status. 
     - In developing nations (e.g. Nigeria, India, Brazil), family wealth might be low in USD terms but average locally.
  4. INTERSECTIONALITY: Define ethnicity, gender, and location. These must impact the starting stats and bio.
  
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
      statusEffects: { type: Type.ARRAY, items: { type: Type.STRING } }
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
  return JSON.parse(response.text) as Character;
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
  
  const prompt = `
    Current Simulation Date: ${currentDate}
    Context:
    - Character: ${JSON.stringify(character)}
    - Previous Event: ${previousEvent ? previousEvent.description : 'Birth'}
    - User Decision (Cause): ${choiceMade || 'None/Passive'}
    - Time Step: ${timeStep}
    - Real World News/Context: ${realWorldContext}

    INSTRUCTIONS FOR AI:
    1. CALCULATE DATE: Add 1 ${timeStep} to ${currentDate}. Update Age.
    
    2. SOCIOLOGICAL REALISM & INTERSECTIONALITY:
       - Apply an intersectional lens (Gender + Ethnicity + Class + Location).
       - Example: A wealthy man in Switzerland faces different risks than a poor woman in Lagos.
       - Acknowledge systemic issues: misogyny, racism, economic instability, healthcare access.
       - Do not shy away from negative outcomes. This is a simulation for research.
    
    3. CONSEQUENCE LOGIC:
       - The 'User Decision' must directly influence the narrative.
       - If the user made a bad financial decision, 'personalWealth' or 'familyWealth' should decrease.
       - If the user ignored a health warning, 'health' should drop.
    
    4. WEALTH DYNAMICS:
       - Children rely on 'familyWealth'. If 'familyWealth' hits 0, the child faces food insecurity/eviction.
       - 'personalWealth' is pocket money/earnings.
    
    5. OUTPUT:
       - Generate a visceral, sensory narrative.
       - Generate a 'visualPrompt' for image generation.
       - Generate 2-3 contextual news headlines (can be real-world based or lore based).
    
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
           statusEffects: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      newEvent: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.NUMBER },
          date: { type: Type.STRING },
          description: { type: Type.STRING, description: "Visceral narrative." },
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
                text: { type: Type.STRING },
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
  return {
    character: data.updatedCharacter,
    event: { ...data.newEvent, selectedChoice: choiceMade } // Inject the choice made into the event object for logging
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
  const ai = getClient();
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
      return `data:audio/wav;base64,${base64Audio}`;
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
