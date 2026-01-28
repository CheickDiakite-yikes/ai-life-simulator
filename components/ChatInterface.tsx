import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiLoader';
import { logError } from '../services/logger';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  gameContext: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose, onOpen, gameContext }) => {
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
      const responseText = await getChatResponse(newHistory, userMsg, gameContext);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: responseText || "I couldn't process that." }] }]);
    } catch (error) {
        logError('Oracle chat failed', error);
        setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Error connecting to AI." }] }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={onOpen}
        className="hidden md:block fixed bottom-6 right-6 p-4 bg-amber-700 rounded-full shadow-lg hover:bg-amber-600 transition-colors z-40 border border-amber-500/30"
      >
        <MessageCircle size={24} color="white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-[56px] md:bottom-6 right-0 md:right-6 w-full md:w-96 h-[50vh] md:h-[500px] bg-[#1c1917] md:rounded-sm rounded-t-sm flex flex-col z-40 shadow-2xl mx-auto border border-stone-700">
      <div className="p-4 border-b border-stone-700 flex justify-between items-center bg-[#292524] rounded-t-sm">
        <h3 className="font-bold text-amber-500 font-heading tracking-wider">Oracle of Simili</h3>
        <button onClick={onClose}><X size={18} className="text-stone-500 hover:text-stone-300" /></button>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0c0a09]">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-sm text-sm font-serif ${msg.role === 'user' ? 'bg-amber-900/40 border border-amber-700/30 text-amber-100' : 'bg-stone-800/50 border border-stone-700 text-stone-300'}`}>
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        {loading && <div className="text-stone-500 text-xs flex items-center gap-2 font-serif"><Loader2 className="animate-spin" size={12}/> The Oracle is thinking...</div>}
      </div>

      <div className="p-3 border-t border-stone-700 flex gap-2 bg-[#1c1917]">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask the Oracle..."
          className="flex-1 bg-[#0c0a09] border border-stone-700 rounded-sm px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-amber-700 font-serif"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="p-2 bg-amber-800 rounded-sm hover:bg-amber-700 disabled:opacity-50 text-amber-100"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
