const API_BASE = '/api';

export interface UserData {
  id: number;
  username: string;
  createdAt: string;
}

export interface GameSaveData {
  id: number;
  userId: number;
  name: string;
  mode: string;
  theme: string;
  currentDate: string;
  timeStep: string;
  character: any;
  currentEvent: any;
  createdAt: string;
  updatedAt: string;
  history?: any[];
}

export const apiService = {
  async getOrCreateUser(username: string): Promise<UserData> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (!res.ok) throw new Error('Failed to get/create user');
    return res.json();
  },

  async getUserSaves(userId: number): Promise<GameSaveData[]> {
    const res = await fetch(`${API_BASE}/users/${userId}/saves`);
    if (!res.ok) throw new Error('Failed to get saves');
    return res.json();
  },

  async getGameSave(saveId: number): Promise<GameSaveData> {
    const res = await fetch(`${API_BASE}/saves/${saveId}`);
    if (!res.ok) throw new Error('Failed to get save');
    return res.json();
  },

  async createGameSave(data: {
    userId: number;
    name: string;
    mode: string;
    theme: string;
    currentDate: string;
    timeStep: string;
    character: any;
    currentEvent: any;
    history: any[];
  }): Promise<GameSaveData> {
    const res = await fetch(`${API_BASE}/saves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create save');
    return res.json();
  },

  async updateGameSave(saveId: number, data: {
    currentDate: string;
    timeStep: string;
    character: any;
    currentEvent: any;
    newEvent?: any;
  }): Promise<GameSaveData> {
    const res = await fetch(`${API_BASE}/saves/${saveId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update save');
    return res.json();
  },

  async deleteGameSave(saveId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/saves/${saveId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete save');
  },

  async getChatMessages(userId: number, gameSaveId?: number): Promise<any[]> {
    const url = gameSaveId 
      ? `${API_BASE}/chat/${userId}?gameSaveId=${gameSaveId}` 
      : `${API_BASE}/chat/${userId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to get chat messages');
    return res.json();
  },

  async saveChatMessage(data: { userId: number; gameSaveId?: number; role: string; content: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save chat message');
    return res.json();
  },

  async clearChatMessages(userId: number, gameSaveId?: number): Promise<void> {
    const url = gameSaveId 
      ? `${API_BASE}/chat/${userId}?gameSaveId=${gameSaveId}` 
      : `${API_BASE}/chat/${userId}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear chat messages');
  }
};
