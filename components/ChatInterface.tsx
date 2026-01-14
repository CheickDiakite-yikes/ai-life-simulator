import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose, onOpen }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setLoading(true);
    
    const newHistory = [...history, { role: 'user', parts: [{ text: userMsg }] }];
    setHistory(newHistory);

    try {
      const responseText = await getChatResponse(newHistory, userMsg);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: responseText || "I couldn't process that." }] }]);
    } catch (error) {
        setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Error connecting to AI." }] }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={onOpen}
        className="hidden md:block fixed bottom-6 right-6 p-4 bg-purple-600 rounded-full shadow-lg hover:bg-purple-500 transition-colors z-40"
      >
        <MessageCircle size={24} color="white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-[56px] md:bottom-6 right-0 md:right-6 w-full md:w-96 h-[50vh] md:h-[500px] glass-panel md:rounded-xl rounded-t-xl flex flex-col z-40 shadow-2xl mx-auto border-x-0 md:border-x border-b-0 md:border-b">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-xl">
        <h3 className="font-semibold text-purple-300">Aetheria Assistant</h3>
        <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-white" /></button>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-purple-600/80 text-white' : 'bg-slate-700/80 text-gray-200'}`}>
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-400 text-xs flex items-center gap-2"><Loader2 className="animate-spin" size={12}/> AI is typing...</div>}
      </div>

      <div className="p-3 border-t border-white/10 flex gap-2 bg-[#0d1117]">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about the game..."
          className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="p-2 bg-purple-600 rounded-md hover:bg-purple-500 disabled:opacity-50"
        >
          <Send size={16} color="white" />
        </button>
      </div>
    </div>
  );
};