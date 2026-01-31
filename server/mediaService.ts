import { Client } from "@replit/object-storage";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import os from "os";

const storageClient = new Client();

export interface MediaResult {
  url: string;
  cached: boolean;
}

function generateMediaKey(type: 'image' | 'video' | 'audio', prompt: string, options?: Record<string, string>): string {
  const optionsStr = options ? JSON.stringify(options) : '';
  const hash = crypto.createHash('sha256').update(`${type}:${prompt}:${optionsStr}`).digest('hex').slice(0, 16);
  const ext = type === 'image' ? 'png' : type === 'video' ? 'mp4' : 'wav';
  return `media/${type}/${hash}.${ext}`;
}

function keyToApiUrl(key: string): string {
  return `/api/${key}`;
}

export async function checkMediaExists(key: string): Promise<string | null> {
  try {
    const { ok, value } = await storageClient.exists(key);
    if (ok && value) {
      return keyToApiUrl(key);
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
    return keyToApiUrl(key);
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
    return keyToApiUrl(key);
  } catch (error) {
    console.error('Error saving media from URL:', error);
    throw error;
  }
}

export async function getMedia(key: string): Promise<Buffer | null> {
  try {
    // Use downloadToFilename to preserve binary data integrity
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `media_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    
    const result = await storageClient.downloadToFilename(key, tempFile);
    if (!result.ok) {
      console.error('Error downloading media:', result.error);
      return null;
    }
    
    // Read the file as binary
    const buffer = fs.readFileSync(tempFile);
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    return buffer;
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
  try {
    const result = await generateFn(prompt, aspectRatio, resolution);
    
    if (!result) {
      console.error('Image generation returned null');
      return null;
    }
    
    console.log('Image generated, result type:', result.startsWith('data:') ? 'base64' : 'url');
    
    if (result.startsWith('data:')) {
      const base64Data = result.split(',')[1];
      console.log('Saving base64 image, length:', base64Data.length);
      const url = await saveMediaFromBase64(key, base64Data, 'image/png');
      console.log('Image saved, URL:', url);
      return { url, cached: false };
    } else {
      const url = await saveMediaFromUrl(key, result);
      console.log('Image saved from URL:', url);
      return { url, cached: false };
    }
  } catch (error) {
    console.error('Failed to generate/save image:', error);
    return null;
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
