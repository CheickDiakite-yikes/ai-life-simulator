import React, { useState, useEffect, useRef } from 'react';
import { Character, LifeEvent, TimeStep, NewsItem } from '../types';
import { generateSceneImage, generateSceneVideo, generateSpeech } from '../services/geminiService';
import { 
  Heart, Zap, Brain, Wallet, User, Calendar, Pause, Play, 
  Send, Sparkles, Activity, Globe, Newspaper, Camera, Video, Volume2, Loader2, Home, CheckCircle2, LayoutDashboard 
} from 'lucide-react';

interface DashboardProps {
  character: Character;
  currentEvent: LifeEvent | null;
  history: LifeEvent[];
  onChoice: (choiceId: string, text: string) => void;
  isLoading: boolean;
  timeStep: TimeStep;
  onTimeStepChange: (step: TimeStep) => void;
  currentDate: string;
}

// Sub-component for individual Event Cards to manage their own media state
const EventCard: React.FC<{ event: LifeEvent }> = ({ event }) => {
  const [imgUrl, setImgUrl] = useState<string | undefined>(event.imageUrl);
  const [vidUrl, setVidUrl] = useState<string | undefined>(event.videoUrl);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(event.audioUrl);
  const [loadingMedia, setLoadingMedia] = useState<'image' | 'video' | 'audio' | null>(null);

  const formatDisplayDate = (dateStr: string) => {
    try {
      if (!dateStr) return "Unknown Date";
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const handleGenImage = async () => {
    if (imgUrl) return;
    setLoadingMedia('image');
    const prompt = event.visualPrompt || event.description;
    const url = await generateSceneImage(prompt, "16:9", "2K");
    if (url) {
      setImgUrl(url);
      event.imageUrl = url; // Cache in object
    }
    setLoadingMedia(null);
  };

  const handleGenVideo = async () => {
    if (vidUrl) return;
    setLoadingMedia('video');
    const prompt = event.visualPrompt || event.description;
    const url = await generateSceneVideo(prompt, "16:9");
    if (url) {
      setVidUrl(url);
      event.videoUrl = url; // Cache in object
    }
    setLoadingMedia(null);
  };

  const handleGenAudio = async () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
      return;
    }
    setLoadingMedia('audio');
    const url = await generateSpeech(event.description);
    if (url) {
      setAudioUrl(url);
      event.audioUrl = url; // Cache
      const audio = new Audio(url);
      audio.play();
    }
    setLoadingMedia(null);
  };

  return (
    <div className="flex flex-col gap-2 animate-fade-in-up">
      
      {/* Decision Log: Show the user's choice that led to this event */}
      {event.selectedChoice && (
        <div className="flex gap-4 opacity-70">
           <div className="flex flex-col items-center w-6"></div>
           <div className="flex-1 max-w-2xl">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-500/10 text-xs text-blue-200">
               <CheckCircle2 size={12} className="text-blue-400"/>
               <span>You decided: <strong>{event.selectedChoice}</strong></span>
             </div>
           </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className={`w-2 h-2 rounded-full mt-2 ring-4 ring-opacity-20 ${
            event.type === 'major' ? 'bg-amber-500 ring-amber-500' :
            event.type === 'positive' ? 'bg-green-500 ring-green-500' :
            event.type === 'negative' ? 'bg-red-500 ring-red-500' :
            'bg-blue-500 ring-blue-500'
          }`}></div>
          <div className="w-px h-full bg-white/5 my-2"></div>
        </div>
        <div className="flex-1 pb-6 max-w-2xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono text-gray-500">{formatDisplayDate(event.date)}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/5 border border-white/10 ${
               event.type === 'major' ? 'text-amber-400' : 'text-gray-400'
            }`}>
              {event.type}
            </span>
          </div>
          
          <div className="bg-[#0f1522] border border-white/5 p-4 rounded-lg shadow-sm group hover:border-white/10 transition-colors">
            <h4 className="text-sm font-semibold text-gray-200 mb-2">Life Event</h4>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{event.description}</p>
            
            {/* Media Display */}
            <div className="mt-4">
               {loadingMedia === 'image' && <div className="text-xs text-blue-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin"/> Generating Scene...</div>}
               {loadingMedia === 'video' && <div className="text-xs text-purple-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin"/> Rendering Video...</div>}
               {loadingMedia === 'audio' && <div className="text-xs text-green-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin"/> Synthesizing Voice...</div>}
               
               {imgUrl && !vidUrl && (
                 <div className="rounded-lg overflow-hidden border border-white/10 mt-2">
                   <img src={imgUrl} alt="Scene" className="w-full h-auto object-cover max-h-64" />
                 </div>
               )}
               
               {vidUrl && (
                 <div className="rounded-lg overflow-hidden border border-white/10 mt-2">
                   <video src={vidUrl} controls autoPlay loop className="w-full h-auto max-h-64" />
                 </div>
               )}
            </div>

            {/* Media Controls */}
            <div className="flex gap-2 mt-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={handleGenImage} 
                 disabled={!!imgUrl || !!loadingMedia}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/20 hover:bg-blue-900/40 text-blue-300 rounded text-xs border border-blue-500/20 disabled:opacity-50"
                 title="Visualize Scene (Image)"
               >
                 <Camera size={12} /> {imgUrl ? 'Visualized' : 'Visualize'}
               </button>
               
               <button 
                 onClick={handleGenVideo} 
                 disabled={!!vidUrl || !!loadingMedia}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/20 hover:bg-purple-900/40 text-purple-300 rounded text-xs border border-purple-500/20 disabled:opacity-50"
                 title="Animate Scene (Video)"
               >
                 <Video size={12} /> {vidUrl ? 'Animated' : 'Animate'}
               </button>

               <button 
                 onClick={handleGenAudio}
                 disabled={loadingMedia === 'audio'}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/20 hover:bg-green-900/40 text-green-300 rounded text-xs border border-green-500/20 disabled:opacity-50"
                 title="Narrate Event"
               >
                 <Volume2 size={12} /> {audioUrl ? 'Replay' : 'Narrate'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  character, 
  currentEvent, 
  history, 
  onChoice, 
  isLoading,
  timeStep,
  onTimeStepChange,
  currentDate
}) => {
  const [customInput, setCustomInput] = useState('');
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'profile' | 'feed' | 'news'>('feed');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of feed
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentEvent, isLoading, mobileTab]);

  // Aggregate news from history
  useEffect(() => {
    const news: NewsItem[] = [];
    history.forEach(event => {
      if (event.news) {
        news.push(...event.news);
      }
    });
    // Append current event news if it's not already in history
    if (currentEvent && currentEvent.news && !history.includes(currentEvent)) {
       news.push(...currentEvent.news);
    }
    setAllNews(news.slice(-15).reverse());
  }, [history, currentEvent]);

  const handleCustomAction = () => {
    if (!customInput.trim() || isLoading) return;
    onChoice('custom', customInput);
    setCustomInput('');
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      if (!dateStr) return "Unknown Date";
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Vital Bar Component
  const VitalBar = ({ label, value, color, icon: Icon }: any) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1 text-xs text-gray-400 font-medium">
        <span className="flex items-center gap-2"><Icon size={12} /> {label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500" 
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }} 
        />
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#050914] text-white flex flex-col font-sans overflow-hidden">
      
      {/* --- Header --- */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-6 bg-[#0B101B] shrink-0 z-20">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold tracking-wider text-[#e2e8f0] font-heading bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            LIFESIM
          </h1>
          
          <div className="h-8 w-px bg-white/10 hidden md:block"></div>
          
          <div className="hidden md:flex items-center gap-3 bg-[#131b2c] px-3 py-1.5 rounded-md border border-white/5 shadow-inner">
            <Calendar size={14} className="text-blue-400" />
            <span className="text-sm font-mono text-gray-200">{formatDisplayDate(currentDate)}</span>
          </div>

          <div className="hidden md:flex items-center gap-3 bg-[#131b2c] px-3 py-1.5 rounded-md border border-white/5 shadow-inner">
            <User size={14} className="text-purple-400" />
            <span className="text-sm font-mono text-gray-200">Age {character.age}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Date - concise */}
          <div className="md:hidden text-xs font-mono text-gray-400 mr-2">
            {formatDisplayDate(currentDate)}
          </div>

          <div className="flex bg-[#131b2c] p-1 rounded-md border border-white/5">
            {(['Day', 'Week', 'Month', 'Year'] as TimeStep[]).map((step) => (
              <button
                key={step}
                onClick={() => onTimeStepChange(step)}
                disabled={isLoading}
                className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-medium rounded transition-colors ${
                  timeStep === step 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {step.charAt(0).toUpperCase() + step.slice(1)} {/* Capitalize first letter */}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-white/10 mx-1 md:mx-2"></div>
          <button className="p-2 bg-green-900/20 border border-green-500/30 rounded text-green-400 hover:bg-green-900/40 transition-colors">
             {isLoading ? <Pause size={16} className="animate-pulse"/> : <Play size={16} />}
          </button>
        </div>
      </header>

      {/* --- Main Content Grid --- */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden relative">
        
        {/* --- Left Sidebar: Profile & Vitals --- */}
        <aside className={`
          md:block md:col-span-3 border-r border-white/10 bg-[#080C15] p-6 overflow-y-auto custom-scrollbar
          ${mobileTab === 'profile' ? 'block absolute inset-0 z-10' : 'hidden'}
        `}>
          <div className="flex flex-col items-center mb-8 relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white/10 flex items-center justify-center text-4xl mb-4 shadow-xl ring-4 ring-black/50 z-10">
               {character.name.charAt(0)}
            </div>
            {/* Glow effect behind avatar */}
            <div className="absolute top-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -z-0"></div>

            <h2 className="text-xl font-bold text-white text-center font-heading">{character.name}</h2>
            <p className="text-sm text-gray-400 text-center mt-1">{character.occupation || "Unemployed"}</p>
            <p className="text-xs text-gray-500 text-center flex items-center gap-1 mt-1 justify-center">
              <Globe size={10} /> {character.location}
            </p>
            {character.ethnicity && (
              <span className="text-[10px] uppercase tracking-widest text-gray-600 mt-2">{character.ethnicity}</span>
            )}
            <div className="mt-2 inline-flex md:hidden items-center gap-2 bg-[#131b2c] px-3 py-1 rounded-full border border-white/5">
                <span className="text-xs font-mono text-gray-300">Age {character.age}</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={12}/> Vitals
            </h3>
            <VitalBar label="Health" value={character.attributes.health} color="#ef4444" icon={Heart} />
            <VitalBar label="Mental" value={character.attributes.happiness} color="#3b82f6" icon={Brain} />
            <VitalBar label="Energy" value={character.attributes.energy || 100} color="#eab308" icon={Zap} />
          </div>

          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Assets</h3>
            <div className="space-y-3">
              <div className="bg-[#131b2c] p-3 rounded-lg border border-white/5 flex justify-between items-center shadow-lg">
                <span className="text-sm text-gray-400 flex items-center gap-2"><Wallet size={14}/> Personal</span>
                <span className="text-sm font-mono text-green-400">${(character.attributes.personalWealth || 0).toLocaleString()}</span>
              </div>
              <div className="bg-[#131b2c] p-3 rounded-lg border border-white/5 flex justify-between items-center shadow-lg">
                <span className="text-sm text-gray-400 flex items-center gap-2"><Home size={14}/> Family</span>
                <span className="text-sm font-mono text-blue-400">${(character.attributes.familyWealth || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Focus</h3>
             <div className="p-4 rounded-lg bg-blue-900/10 border border-blue-500/20 text-sm text-blue-200">
                <p className="leading-snug">
                  {currentEvent?.description ? "Navigating life events." : "Waiting for destiny..."}
                </p>
             </div>
          </div>
        </aside>

        {/* --- Center: Timeline Feed --- */}
        <main className={`
          md:flex md:col-span-6 flex-col bg-[#050914] relative h-full
          ${mobileTab === 'feed' ? 'flex' : 'hidden'}
        `}>
          
          {/* Feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth custom-scrollbar pb-32 md:pb-8" ref={scrollRef}>
            {/* Render history */}
            {history.map((event, idx) => (
              <EventCard key={idx} event={event} />
            ))}
            
            {/* Pending Event Indicator */}
            {isLoading && (
               <div className="flex gap-4 animate-pulse">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                  </div>
                  <div className="bg-[#0f1522] border border-white/5 p-4 rounded-lg flex-1">
                     <span className="text-xs text-purple-400 flex items-center gap-2">
                        <Sparkles size={12} className="animate-spin" /> Simulating Universe...
                     </span>
                  </div>
               </div>
            )}
          </div>

          {/* Action Area */}
          <div className="p-4 md:p-6 bg-[#0B101B]/95 backdrop-blur-md border-t border-white/10 z-10 shadow-2xl absolute bottom-0 left-0 right-0 md:relative md:bottom-auto mb-[56px] md:mb-0">
            {currentEvent?.choices && !isLoading && (
              <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
                {currentEvent.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => onChoice(choice.id, choice.text)}
                    className="px-4 py-2 bg-[#1a2333] hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 rounded-full text-xs text-gray-300 hover:text-white transition-all transform hover:scale-[1.02]"
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            )}

            <div className="relative group">
              <input 
                type="text" 
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomAction()}
                placeholder="What do you want to do?" 
                disabled={isLoading}
                className="w-full bg-[#050914] border border-white/10 rounded-lg pl-4 pr-12 py-3 text-sm text-white focus:border-blue-500 focus:outline-none placeholder-gray-600 transition-all focus:bg-[#0a0f1d]"
              />
              <button 
                onClick={handleCustomAction}
                disabled={!customInput.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 rounded-md text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

        </main>

        {/* --- Right Sidebar: World News --- */}
        <aside className={`
          md:block md:col-span-3 border-l border-white/10 bg-[#080C15] p-6 overflow-y-auto custom-scrollbar
          ${mobileTab === 'news' ? 'block absolute inset-0 z-10' : 'hidden'}
        `}>
           <div className="flex items-center gap-2 mb-6 sticky top-0 bg-[#080C15] z-10 py-2 border-b border-white/5">
              <Newspaper size={16} className="text-gray-400" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">World Feed</h3>
           </div>

           <div className="space-y-6">
              {allNews.length > 0 ? (
                allNews.map((news, i) => (
                  <div key={i} className="group cursor-default animate-fade-in">
                     <div className="flex justify-between items-baseline mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          news.category === 'POLITICS' ? 'text-red-400' : 
                          news.category === 'TECH' ? 'text-cyan-400' :
                          news.category === 'HEALTH' ? 'text-green-400' : 
                          news.category === 'WORLD' ? 'text-purple-400' : 'text-gray-400'
                        }`}>
                          {news.category}
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono">{formatDisplayDate(news.date)}</span>
                     </div>
                     <h4 className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors leading-snug">
                       {news.headline}
                     </h4>
                     <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mt-4 group-last:hidden"></div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-600 italic text-center py-10">No recent news events.</div>
              )}
           </div>
        </aside>

      </div>

      {/* --- Mobile Bottom Nav --- */}
      <div className="md:hidden flex items-center justify-around h-[56px] bg-[#0B101B] border-t border-white/10 fixed bottom-0 left-0 w-full z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
         <button 
           onClick={() => setMobileTab('profile')}
           className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'profile' ? 'text-purple-400' : 'text-gray-500'}`}
         >
           <User size={20} />
           <span className="text-[10px] font-medium">Profile</span>
         </button>
         
         <button 
           onClick={() => setMobileTab('feed')}
           className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'feed' ? 'text-blue-400' : 'text-gray-500'}`}
         >
           <LayoutDashboard size={20} />
           <span className="text-[10px] font-medium">Timeline</span>
         </button>

         <button 
           onClick={() => setMobileTab('news')}
           className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'news' ? 'text-green-400' : 'text-gray-500'}`}
         >
           <Globe size={20} />
           <span className="text-[10px] font-medium">World</span>
         </button>
      </div>

    </div>
  );
};