import express from "express";
import cors from "cors";
import { storage } from "./storage";

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    let user = await storage.getUserByUsername(username);
    if (user) {
      return res.json(user);
    }
    user = await storage.createUser({ username });
    res.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get("/api/users/:id/saves", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const saves = await storage.getGameSavesByUser(userId);
    res.json(saves);
  } catch (error) {
    console.error("Error getting saves:", error);
    res.status(500).json({ error: "Failed to get saves" });
  }
});

app.get("/api/saves/:id", async (req, res) => {
  try {
    const saveId = parseInt(req.params.id);
    const save = await storage.getGameSave(saveId);
    if (!save) {
      return res.status(404).json({ error: "Save not found" });
    }
    const events = await storage.getLifeEvents(saveId);
    res.json({ ...save, history: events });
  } catch (error) {
    console.error("Error getting save:", error);
    res.status(500).json({ error: "Failed to get save" });
  }
});

app.post("/api/saves", async (req, res) => {
  try {
    const { userId, name, mode, theme, currentDate, timeStep, character, currentEvent, history } = req.body;
    
    const save = await storage.createGameSave({
      userId,
      name,
      mode,
      theme,
      currentDate,
      timeStep,
      character,
      currentEvent
    });

    if (history && Array.isArray(history)) {
      for (const event of history) {
        await storage.createLifeEvent({
          gameSaveId: save.id,
          year: event.year,
          date: event.date,
          description: event.description,
          visualPrompt: event.visualPrompt,
          type: event.type,
          choices: event.choices,
          selectedChoice: event.selectedChoice,
          news: event.news,
          imageUrl: event.imageUrl,
          videoUrl: event.videoUrl,
          audioUrl: event.audioUrl
        });
      }
    }

    res.json(save);
  } catch (error) {
    console.error("Error creating save:", error);
    res.status(500).json({ error: "Failed to create save" });
  }
});

app.put("/api/saves/:id", async (req, res) => {
  try {
    const saveId = parseInt(req.params.id);
    const { currentDate, timeStep, character, currentEvent, newEvent } = req.body;
    
    const updated = await storage.updateGameSave(saveId, {
      currentDate,
      timeStep,
      character,
      currentEvent
    });

    if (newEvent) {
      await storage.createLifeEvent({
        gameSaveId: saveId,
        year: newEvent.year,
        date: newEvent.date,
        description: newEvent.description,
        visualPrompt: newEvent.visualPrompt,
        type: newEvent.type,
        choices: newEvent.choices,
        selectedChoice: newEvent.selectedChoice,
        news: newEvent.news,
        imageUrl: newEvent.imageUrl,
        videoUrl: newEvent.videoUrl,
        audioUrl: newEvent.audioUrl
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating save:", error);
    res.status(500).json({ error: "Failed to update save" });
  }
});

app.delete("/api/saves/:id", async (req, res) => {
  try {
    const saveId = parseInt(req.params.id);
    await storage.deleteGameSave(saveId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting save:", error);
    res.status(500).json({ error: "Failed to delete save" });
  }
});

app.get("/api/chat/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const gameSaveId = req.query.gameSaveId ? parseInt(req.query.gameSaveId as string) : undefined;
    const messages = await storage.getChatMessages(userId, gameSaveId);
    res.json(messages);
  } catch (error) {
    console.error("Error getting chat:", error);
    res.status(500).json({ error: "Failed to get chat messages" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { userId, gameSaveId, role, content } = req.body;
    const message = await storage.createChatMessage({ userId, gameSaveId, role, content });
    res.json(message);
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ error: "Failed to save chat message" });
  }
});

app.delete("/api/chat/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const gameSaveId = req.query.gameSaveId ? parseInt(req.query.gameSaveId as string) : undefined;
    await storage.clearChatMessages(userId, gameSaveId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing chat:", error);
    res.status(500).json({ error: "Failed to clear chat messages" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
