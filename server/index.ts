import express from "express";
import cors from "cors";
import { storage } from "./storage";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    let user = await storage.getUserByUsername(username);
    if (!user) {
      user = await storage.createUser({ username });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get("/api/saves/:userId", async (req, res) => {
  try {
    const saves = await storage.getSavesByUser(parseInt(req.params.userId));
    res.json(saves);
  } catch (error) {
    res.status(500).json({ error: "Failed to get saves" });
  }
});

app.get("/api/save/:id", async (req, res) => {
  try {
    const save = await storage.getSave(parseInt(req.params.id));
    if (!save) {
      return res.status(404).json({ error: "Save not found" });
    }
    res.json(save);
  } catch (error) {
    res.status(500).json({ error: "Failed to get save" });
  }
});

app.post("/api/saves", async (req, res) => {
  try {
    const { userId, saveName, gameState } = req.body;
    if (!userId || !saveName || !gameState) {
      return res.status(400).json({ error: "userId, saveName, and gameState are required" });
    }
    const save = await storage.createSave({ userId, saveName, gameState });
    res.json(save);
  } catch (error) {
    res.status(500).json({ error: "Failed to create save" });
  }
});

app.put("/api/saves/:id", async (req, res) => {
  try {
    const { gameState } = req.body;
    if (!gameState) {
      return res.status(400).json({ error: "gameState is required" });
    }
    const save = await storage.updateSave(parseInt(req.params.id), gameState);
    if (!save) {
      return res.status(404).json({ error: "Save not found" });
    }
    res.json(save);
  } catch (error) {
    res.status(500).json({ error: "Failed to update save" });
  }
});

app.delete("/api/saves/:id", async (req, res) => {
  try {
    await storage.deleteSave(parseInt(req.params.id));
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
    const event = await storage.createEvent({ saveId, eventType, eventData, year });
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
    const message = await storage.createMessage({ saveId, role, content });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to create message" });
  }
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
