import { Client } from "@replit/object-storage";
import crypto from "crypto";

const storageClient = new Client();

export interface MediaResult {
  url: string;
  cached: boolean;
}

function generateMediaKey(type: 'image' | 'video' | 'audio', prompt: string, options?: Record<string, string>): string {
  const optionsStr = options ? JSON.stringify(options) : '';
  const hash = crypto.createHash('sha256').update(`${type}:${prompt}:${optionsStr}`).digest('hex').slice(0, 16);
  return `media/${type}/${hash}`;
}

export async function checkMediaExists(key: string): Promise<string | null> {
  try {
    const { ok, value } = await storageClient.exists(key);
    if (ok && value) {
      return `/api/media/${key}`;
    }
    return null;
  } catch (error) {
    console.error('Error checking media existence:', error);
    return null;
  }
}

export async function saveMediaFromBase64(key: string, base64Data: string, contentType: string): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const { ok, error } = await storageClient.uploadFromBytes(key, buffer);
    if (!ok) {
      throw new Error(`Failed to upload media: ${error?.message}`);
    }
    return `/api/media/${key}`;
  } catch (error) {
    console.error('Error saving media:', error);
    throw error;
  }
}

export async function saveMediaFromUrl(key: string, url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media from URL: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { ok, error } = await storageClient.uploadFromBytes(key, buffer);
    if (!ok) {
      throw new Error(`Failed to upload media: ${error?.message}`);
    }
    return `/api/media/${key}`;
  } catch (error) {
    console.error('Error saving media from URL:', error);
    throw error;
  }
}

export async function getMedia(key: string): Promise<Buffer | null> {
  try {
    const result = await storageClient.downloadAsBytes(key);
    if (!result.ok) {
      console.error('Error downloading media:', result.error);
      return null;
    }
    return result.value as unknown as Buffer;
  } catch (error) {
    console.error('Error getting media:', error);
    return null;
  }
}

export async function getOrGenerateImage(
  prompt: string,
  aspectRatio: string,
  resolution: string,
  generateFn: (prompt: string, aspectRatio: any, resolution: any) => Promise<string | null>
): Promise<MediaResult | null> {
  const key = generateMediaKey('image', prompt, { aspectRatio, resolution });
  
  const existingUrl = await checkMediaExists(key);
  if (existingUrl) {
    console.log('Image found in cache:', key);
    return { url: existingUrl, cached: true };
  }
  
  console.log('Generating new image for:', prompt.slice(0, 50) + '...');
  const result = await generateFn(prompt, aspectRatio, resolution);
  
  if (!result) {
    return null;
  }
  
  try {
    if (result.startsWith('data:')) {
      const base64Data = result.split(',')[1];
      const url = await saveMediaFromBase64(key, base64Data, 'image/png');
      return { url, cached: false };
    } else {
      const url = await saveMediaFromUrl(key, result);
      return { url, cached: false };
    }
  } catch (error) {
    console.error('Failed to save image, returning original URL:', error);
    return { url: result, cached: false };
  }
}

export async function getOrGenerateVideo(
  prompt: string,
  aspectRatio: string,
  generateFn: (prompt: string, aspectRatio: any) => Promise<string | null>
): Promise<MediaResult | null> {
  const key = generateMediaKey('video', prompt, { aspectRatio });
  
  const existingUrl = await checkMediaExists(key);
  if (existingUrl) {
    console.log('Video found in cache:', key);
    return { url: existingUrl, cached: true };
  }
  
  console.log('Generating new video for:', prompt.slice(0, 50) + '...');
  const result = await generateFn(prompt, aspectRatio);
  
  if (!result) {
    return null;
  }
  
  try {
    const url = await saveMediaFromUrl(key, result);
    return { url, cached: false };
  } catch (error) {
    console.error('Failed to save video, returning original URL:', error);
    return { url: result, cached: false };
  }
}

export async function getOrGenerateAudio(
  text: string,
  generateFn: (text: string) => Promise<string | null>
): Promise<MediaResult | null> {
  const key = generateMediaKey('audio', text);
  
  const existingUrl = await checkMediaExists(key);
  if (existingUrl) {
    console.log('Audio found in cache:', key);
    return { url: existingUrl, cached: true };
  }
  
  console.log('Generating new audio for:', text.slice(0, 50) + '...');
  const result = await generateFn(text);
  
  if (!result) {
    return null;
  }
  
  try {
    if (result.startsWith('data:')) {
      const base64Data = result.split(',')[1];
      const url = await saveMediaFromBase64(key, base64Data, 'audio/mp3');
      return { url, cached: false };
    } else {
      const url = await saveMediaFromUrl(key, result);
      return { url, cached: false };
    }
  } catch (error) {
    console.error('Failed to save audio, returning original URL:', error);
    return { url: result, cached: false };
  }
}
