import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./storage";
import { getMedia, getOrGenerateImage, getOrGenerateVideo, getOrGenerateAudio } from "./mediaService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const SESSION_COOKIE_NAME = "simili_session";
const SESSION_DURATION_DAYS = 30;

async function getAuthenticatedUser(req: express.Request) {
  const token = req.cookies[SESSION_COOKIE_NAME];
  if (!token) return null;
  
  const session = await storage.getSessionByToken(token);
  if (!session) return null;
  
  if (new Date() > session.expiresAt) {
    await storage.deleteSession(token);
    return null;
  }
  
  return storage.getUser(session.userId);
}

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, passwordConfirmation, fullName, source } = req.body;
    
    if (!email || !password || !passwordConfirmation || !fullName) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    if (password !== passwordConfirmation) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user = await storage.createUser({
      email,
      passwordHash,
      fullName,
      source: source || null
    });
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
    
    await storage.createSession({
      userId: user.id,
      token,
      expiresAt
    });
    
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
    });
    
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error: any) {
    console.log("Signup error:", error?.message);
    res.status(500).json({ error: "Failed to create account" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
    
    await storage.createSession({
      userId: user.id,
      token,
      expiresAt
    });
    
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
    });
    
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error: any) {
    console.log("Login error:", error?.message);
    res.status(500).json({ error: "Failed to log in" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const token = req.cookies[SESSION_COOKIE_NAME];
    if (token) {
      await storage.deleteSession(token);
    }
    res.clearCookie(SESSION_COOKIE_NAME);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to log out" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

app.get("/api/saves", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const saves = await storage.getSavesByUser(user.id);
    res.json(saves);
  } catch (error) {
    res.status(500).json({ error: "Failed to get saves" });
  }
});

app.get("/api/save/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const save = await storage.getSave(parseInt(req.params.id));
    if (!save) {
      return res.status(404).json({ error: "Save not found" });
    }
    if (save.userId !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(save);
  } catch (error) {
    res.status(500).json({ error: "Failed to get save" });
  }
});

app.post("/api/saves", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { saveName, gameState } = req.body;
    if (!saveName || !gameState) {
      return res.status(400).json({ error: "saveName and gameState are required" });
    }
    const save = await storage.createSave({ 
      userId: user.id, 
      name: saveName,
      mode: gameState.mode || 'REAL_LIFE',
      theme: gameState.theme,
      gameDate: gameState.currentDate,
      timeStep: gameState.timeStep,
      character: gameState.character,
      currentEvent: gameState.currentEvent,
      history: gameState.history || [],
      config: gameState.config || null,
      storyArcs: gameState.storyArcs || []
    });
    res.json(save);
  } catch (error: any) {
    console.log("Failed to create save:", error?.message);
    res.status(500).json({ error: "Failed to create save" });
  }
});

app.put("/api/saves/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const saveId = parseInt(req.params.id);
    const existingSave = await storage.getSave(saveId);
    if (!existingSave) {
      return res.status(404).json({ error: "Save not found" });
    }
    if (existingSave.userId !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { gameState } = req.body;
    if (!gameState) {
      return res.status(400).json({ error: "gameState is required" });
    }
    const save = await storage.updateSave(saveId, {
      mode: gameState.mode,
      theme: gameState.theme,
      gameDate: gameState.currentDate,
      timeStep: gameState.timeStep,
      character: gameState.character,
      currentEvent: gameState.currentEvent,
      history: gameState.history || [],
      config: gameState.config || null,
      storyArcs: gameState.storyArcs || []
    });
    res.json(save);
  } catch (error) {
    res.status(500).json({ error: "Failed to update save" });
  }
});

app.delete("/api/saves/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const saveId = parseInt(req.params.id);
    const existingSave = await storage.getSave(saveId);
    if (!existingSave) {
      return res.status(404).json({ error: "Save not found" });
    }
    if (existingSave.userId !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    await storage.deleteSave(saveId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete save" });
  }
});

app.get("/api/events/:saveId", async (req, res) => {
  try {
    const events = await storage.getEventsBySave(parseInt(req.params.saveId));
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to get events" });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const { saveId, eventType, eventData, year } = req.body;
    if (!saveId || !eventType || !eventData || year === undefined) {
      return res.status(400).json({ error: "saveId, eventType, eventData, and year are required" });
    }
    const event = await storage.createEvent({ 
      gameSaveId: saveId, 
      type: eventType, 
      description: JSON.stringify(eventData), 
      year 
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.get("/api/messages/:saveId", async (req, res) => {
  try {
    const messages = await storage.getMessagesBySave(parseInt(req.params.saveId));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { saveId, role, content } = req.body;
    if (!saveId || !role || !content) {
      return res.status(400).json({ error: "saveId, role, and content are required" });
    }
    const message = await storage.createMessage({ gameSaveId: saveId, role, content });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to create message" });
  }
});

app.get("/api/media/:type/:hash", async (req, res) => {
  try {
    const key = `media/${req.params.type}/${req.params.hash}`;
    const data = await getMedia(key);
    if (!data) {
      return res.status(404).json({ error: "Media not found" });
    }
    
    const ext = key.split('.').pop() || '';
    const contentTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
    };
    
    let contentType = contentTypes[ext] || 'application/octet-stream';
    if (key.includes('/image/')) contentType = 'image/png';
    else if (key.includes('/video/')) contentType = 'video/mp4';
    else if (key.includes('/audio/')) contentType = 'audio/mpeg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(data);
  } catch (error) {
    console.error('Error serving media:', error);
    res.status(500).json({ error: "Failed to serve media" });
  }
});

app.post("/api/generate/image", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { prompt, aspectRatio = "16:9", resolution = "2K" } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }
    
    const { generateSceneImage } = await import("../services/geminiService.js");
    
    const result = await getOrGenerateImage(prompt, aspectRatio, resolution, generateSceneImage);
    if (!result) {
      return res.status(500).json({ error: "Failed to generate image" });
    }
    
    res.json({ url: result.url, cached: result.cached });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error?.message || "Failed to generate image" });
  }
});

app.post("/api/generate/video", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { prompt, aspectRatio = "16:9" } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }
    
    const { generateSceneVideo } = await import("../services/geminiService.js");
    
    const result = await getOrGenerateVideo(prompt, aspectRatio, generateSceneVideo);
    if (!result) {
      return res.status(500).json({ error: "Failed to generate video" });
    }
    
    res.json({ url: result.url, cached: result.cached });
  } catch (error: any) {
    console.error('Error generating video:', error);
    res.status(500).json({ error: error?.message || "Failed to generate video" });
  }
});

app.post("/api/generate/audio", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
    
    const { generateSpeech } = await import("../services/geminiService.js");
    
    const result = await getOrGenerateAudio(text, generateSpeech);
    if (!result) {
      return res.status(500).json({ error: "Failed to generate audio" });
    }
    
    res.json({ url: result.url, cached: result.cached });
  } catch (error: any) {
    console.error('Error generating audio:', error);
    res.status(500).json({ error: error?.message || "Failed to generate audio" });
  }
});

const distPath = path.resolve(__dirname, "../dist");
// Serve static files with no-cache to prevent stale bundles
app.use(express.static(distPath, {
  etag: false,
  setHeaders: (res, filePath) => {
    // Force no caching for JS/CSS bundles
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"));
  } else {
    next();
  }
});

const PORT = parseInt(process.env.PORT || (process.env.NODE_ENV === "production" ? "5000" : "3000"), 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  storage.deleteExpiredSessions().catch(() => {});
});
