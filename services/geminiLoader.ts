import type { Character, GameMode, LifeEvent, TimeStep } from '../types';
import type { RecentStart } from './simulationMemory';

let servicePromise: Promise<typeof import('./geminiService')> | null = null;

const loadService = () => {
  if (!servicePromise) {
    servicePromise = import('./geminiService');
  }
  return servicePromise;
};

export const generateInitialCharacter = async (
  mode: GameMode,
  userInputs?: any,
  options?: { recentStarts?: RecentStart[] }
): Promise<Character> => {
  const service = await loadService();
  return service.generateInitialCharacter(mode, userInputs, options);
};

export const advanceLife = async (
  character: Character,
  previousEvent: LifeEvent | null,
  choiceMade: string | null,
  currentDate: string,
  timeStep: TimeStep,
  realWorldContext: string = ''
): Promise<{ character: Character; event: LifeEvent }> => {
  const service = await loadService();
  return service.advanceLife(
    character,
    previousEvent,
    choiceMade,
    currentDate,
    timeStep,
    realWorldContext
  );
};

export const getRealWorldContext = async (): Promise<string> => {
  const service = await loadService();
  return service.getRealWorldContext();
};

export const generateSceneImage = async (
  description: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9" | "2:3" | "3:2",
  resolution: "1K" | "2K" | "4K"
): Promise<string | null> => {
  const service = await loadService();
  return service.generateSceneImage(description, aspectRatio, resolution);
};

export const generateSceneVideo = async (
  prompt: string,
  aspectRatio: "16:9" | "9:16"
): Promise<string | null> => {
  const service = await loadService();
  return service.generateSceneVideo(prompt, aspectRatio);
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  const service = await loadService();
  return service.generateSpeech(text);
};

export const getChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  msg: string,
  gameContext: string = ''
): Promise<string | undefined> => {
  const service = await loadService();
  return service.getChatResponse(history, msg, gameContext);
};
