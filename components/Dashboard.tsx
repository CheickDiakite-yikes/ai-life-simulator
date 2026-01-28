import React, { useState, useEffect, useRef } from 'react';
import { Character, LifeEvent, TimeStep, NewsItem } from '../types';
import { generateSceneImage, generateSceneVideo, generateSpeech } from '../services/geminiLoader';
import { 
  Heart, Zap, Brain, Wallet, User, Calendar, Pause, Play, 
  Send, Sparkles, Activity, Globe, Newspaper, Camera, Video, Volume2, Loader2, Home, CheckCircle2, LayoutDashboard, MessageCircle, Scroll 
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
  isChatOpen: boolean;
  onToggleChat: () => void;
  onPlay: () => void; // New prop for the play button
}

// Sub-component for individual Event Cards to manage their own media state
const EventCard: React.FC<{ event: LifeEvent; isCurrent?: boolean }> = ({ event, isCurrent = false }) => {
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
    try {
      const prompt = event.visualPrompt || event.description;
      const url = await generateSceneImage(prompt, "16:9", "2K");
      if (url) {
        setImgUrl(url);
        event.imageUrl = url; // Cache in object
      }
    } catch (e) {
      console.error("Failed to generate image", e);
    }
    setLoadingMedia(null);
  };

  const handleGenVideo = async () => {
    if (vidUrl) return;
    setLoadingMedia('video');
    try {
      const prompt = event.visualPrompt || event.description;
      const url = await generateSceneVideo(prompt, "16:9");
      if (url) {
        setVidUrl(url);
        event.videoUrl = url; // Cache in object
      }
    } catch (e) {
      console.error("Failed to generate video", e);
    }
    setLoadingMedia(null);
  };

  const handleGenAudio = async () => {
    // If we already have the URL, just play it
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(e => console.error("Audio playback failed", e));
      return;
    }

    setLoadingMedia('audio');
    try {
      const url = await generateSpeech(event.description);
      if (url) {
        setAudioUrl(url);
        event.audioUrl = url; // Cache
        const audio = new Audio(url);
        audio.play().catch(e => console.error("Audio playback failed", e));
      }
    } catch (e) {
      console.error("Failed to generate speech", e);
    }
    setLoadingMedia(null);
  };

  return (
    <div className="flex flex-col gap-2 animate-fade-in-up">
      
      {/* Decision Log: Show the user's choice that led to this event */}
      {event.selectedChoice && (
        <div className="flex gap-4 opacity-80">
           <div className="flex flex-col items-center w-6"></div>
           <div className="flex-1 max-w-2xl">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800/50 border border-amber-900/30 text-xs text-amber-200/80 font-serif italic">
               <CheckCircle2 size={12} className="text-amber-500"/>
               <span>You decided: <strong>{event.selectedChoice}</strong></span>
             </div>
           </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rotate-45 mt-2 border ${
            event.type === 'major' ? 'bg-amber-600 border-amber-400' :
            event.type === 'positive' ? 'bg-emerald-700 border-emerald-500' :
            event.type === 'negative' ? 'bg-red-800 border-red-600' :
            'bg-stone-600 border-stone-400'
          }`}></div>
          <div className="w-px h-full bg-stone-700 my-2"></div>
        </div>
        <div className="flex-1 pb-8 max-w-2xl">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-heading tracking-widest text-stone-500">{formatDisplayDate(event.date)}</span>
              {isCurrent && (
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border border-amber-700/60 text-amber-400 bg-amber-900/20">
                  Current
                </span>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
               event.type === 'major' ? 'text-amber-500 border-amber-900/50 bg-amber-900/10' : 'text-stone-500 border-stone-700 bg-stone-800/30'
            }`}>
              {event.type}
            </span>
          </div>
          
          <div className="bg-[#1c1917] border border-stone-700/50 p-6 rounded-sm shadow-md group hover:border-amber-700/30 transition-colors relative overflow-hidden">
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-stone-500 opacity-30"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-stone-500 opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-stone-500 opacity-30"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-stone-500 opacity-30"></div>

            <h4 className="text-sm font-bold text-stone-300 mb-3 font-heading uppercase tracking-wide flex items-center gap-2">
              <Scroll size={14} className="text-amber-700" /> Chronicle Entry
            </h4>
            <p className="text-base text-stone-300 leading-relaxed whitespace-pre-line font-serif">{event.description}</p>
            
            {/* Media Display */}
            <div className="mt-4">
               {loadingMedia === 'image' && <div className="text-xs text-amber-500 flex items-center gap-2 font-serif"><Loader2 size={12} className="animate-spin"/> Divining Image...</div>}
               {loadingMedia === 'video' && <div className="text-xs text-amber-500 flex items-center gap-2 font-serif"><Loader2 size={12} className="animate-spin"/> Conjuring Vision...</div>}
               {loadingMedia === 'audio' && <div className="text-xs text-amber-500 flex items-center gap-2 font-serif"><Loader2 size={12} className="animate-spin"/> Speaking Prophecy...</div>}
               
               {imgUrl && !vidUrl && (
                 <div className="rounded-sm overflow-hidden border border-stone-700 mt-4 animate-fade-in shadow-lg">
                   <img src={imgUrl} alt="Scene" className="w-full h-auto object-cover max-h-80 sepia-[0.2]" />
                 </div>
               )}
               
               {vidUrl && (
                 <div className="rounded-sm overflow-hidden border border-stone-700 mt-4 animate-fade-in shadow-lg">
                   <video src={vidUrl} controls autoPlay loop className="w-full h-auto max-h-80 sepia-[0.2]" />
                 </div>
               )}
            </div>

            {/* Media Controls */}
            <div className="flex gap-2 mt-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity border-t border-stone-800 pt-4">
               <button 
                 onClick={handleGenImage} 
                 disabled={!!imgUrl || !!loadingMedia}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-sm text-xs border border-stone-600 disabled:opacity-50 transition-all font-heading tracking-wider"
                 title="Visualize Scene (Image)"
               >
                 <Camera size={12} /> {imgUrl ? 'Visualized' : 'Visualize'}
               </button>
               
               <button 
                 onClick={handleGenVideo} 
                 disabled={!!vidUrl || !!loadingMedia}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-sm text-xs border border-stone-600 disabled:opacity-50 transition-all font-heading tracking-wider"
                 title="Animate Scene (Video)"
               >
                 <Video size={12} /> {vidUrl ? 'Animated' : 'Animate'}
               </button>

               <button 
                 onClick={handleGenAudio}
                 disabled={loadingMedia === 'audio'}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-sm text-xs border border-stone-600 disabled:opacity-50 transition-all font-heading tracking-wider"
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
  currentDate,
  isChatOpen,
  onToggleChat,
  onPlay
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
      <div className="flex justify-between items-center mb-1 text-xs text-stone-400 font-medium font-heading tracking-wider">
        <span className="flex items-center gap-2"><Icon size={12} className="text-amber-700" /> {label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden border border-stone-700">
        <div 
          className="h-full rounded-full transition-all duration-500" 
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }} 
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0c0a09] text-stone-200 flex flex-col font-serif">
      
      {/* --- Header --- */}
      <header className="h-16 border-b border-stone-800 flex items-center justify-between px-4 md:px-6 bg-[#1c1917] shrink-0 z-20 shadow-lg">
        
        {/* Left Side: Title & Date */}
        <div className="flex items-center gap-4 md:gap-6 flex-shrink-1 min-w-0">
          
          {/* Desktop Title */}
          <h1 className="hidden md:block text-xl font-bold tracking-[0.2em] text-amber-500 font-heading drop-shadow-sm">
            LIFESIM
          </h1>

          {/* Mobile Title & Date Stacked */}
          <div className="md:hidden flex flex-col justify-center">
             <h1 className="text-lg font-bold tracking-wider text-amber-500 font-heading leading-none mb-1">
              LIFESIM
            </h1>
            <span className="text-[10px] font-mono text-stone-500 leading-none">
              {formatDisplayDate(currentDate)}
            </span>
          </div>
          
          <div className="h-8 w-px bg-stone-700 hidden md:block"></div>
          
          {/* Desktop Date/Age Indicators */}
          <div className="hidden md:flex items-center gap-3 bg-[#292524] px-3 py-1.5 rounded-sm border border-stone-700 shadow-inner">
            <Calendar size={14} className="text-amber-600" />
            <span className="text-sm font-heading tracking-wide text-stone-300">{formatDisplayDate(currentDate)}</span>
          </div>

          <div className="hidden md:flex items-center gap-3 bg-[#292524] px-3 py-1.5 rounded-sm border border-stone-700 shadow-inner">
            <User size={14} className="text-stone-400" />
            <span className="text-sm font-heading tracking-wide text-stone-300">Age {character.age}</span>
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          
          <div className="flex bg-[#292524] p-1 rounded-sm border border-stone-700">
            {(['Day', 'Week', 'Month', 'Year'] as TimeStep[]).map((step) => (
              <button
                key={step}
                onClick={() => onTimeStepChange(step)}
                disabled={isLoading}
                className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold font-heading tracking-wider rounded-sm transition-colors ${
                  timeStep === step 
                    ? 'bg-amber-800 text-amber-100 shadow-sm' 
                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-700'
                }`}
              >
                {step.charAt(0).toUpperCase() + step.slice(1)} {/* Capitalize first letter */}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-stone-700 mx-1 md:mx-2"></div>
          <button 
             onClick={onPlay}
             disabled={isLoading}
             className="p-2 bg-emerald-900/30 border border-emerald-700/50 rounded-sm text-emerald-500 hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
             title={`Advance 1 ${timeStep}`}
           >
             {isLoading ? <Pause size={16} className="animate-pulse"/> : <Play size={16} />}
          </button>
        </div>
      </header>

      {/* --- Main Content Grid --- */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 relative">
        
        {/* --- Left Sidebar: Profile & Vitals --- */}
        <aside className={`
          md:block md:col-span-3 border-r border-stone-800 bg-[#1c1917] p-6 overflow-y-auto custom-scrollbar
          ${mobileTab === 'profile' ? 'block absolute inset-0 z-10' : 'hidden'}
        `}>
          <div className="flex flex-col items-center mb-8 relative">
            <div className="w-24 h-24 rounded-full bg-stone-800 border-4 border-stone-700 flex items-center justify-center text-4xl mb-4 shadow-xl ring-2 ring-amber-900/30 z-10 text-stone-400 font-heading">
               {character.name.charAt(0)}
            </div>
            
            <h2 className="text-xl font-bold text-amber-100 text-center font-heading tracking-wide">{character.name}</h2>
            <p className="text-sm text-stone-500 text-center mt-1 font-serif italic">{character.occupation || "Unemployed"}</p>
            <p className="text-xs text-stone-600 text-center flex items-center gap-1 mt-1 justify-center font-heading">
              <Globe size={10} /> {character.location}
            </p>
            {character.ethnicity && (
              <span className="text-[10px] uppercase tracking-widest text-stone-700 mt-2 border-t border-stone-800 pt-2 w-full text-center">{character.ethnicity}</span>
            )}
            <div className="mt-2 inline-flex md:hidden items-center gap-2 bg-[#292524] px-3 py-1 rounded-full border border-stone-700">
                <span className="text-xs font-heading text-stone-400">Age {character.age}</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xs font-bold text-stone-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 font-heading border-b border-stone-800 pb-2">
              <Activity size={12}/> Vitals
            </h3>
            <VitalBar label="Health" value={character.attributes.health} color="#b91c1c" icon={Heart} />
            <VitalBar label="Mental" value={character.attributes.happiness} color="#0369a1" icon={Brain} />
            <VitalBar label="Energy" value={character.attributes.energy || 100} color="#d97706" icon={Zap} />
          </div>

          <div className="mb-8">
            <h3 className="text-xs font-bold text-stone-600 uppercase tracking-[0.2em] mb-4 font-heading border-b border-stone-800 pb-2">Assets</h3>
            <div className="space-y-3">
              <div className="bg-[#292524] p-3 rounded-sm border border-stone-700 flex justify-between items-center shadow-sm">
                <span className="text-sm text-stone-400 flex items-center gap-2 font-heading"><Wallet size={14} className="text-amber-700"/> Personal</span>
                <span className="text-sm font-mono text-emerald-500">${(character.attributes.personalWealth || 0).toLocaleString()}</span>
              </div>
              <div className="bg-[#292524] p-3 rounded-sm border border-stone-700 flex justify-between items-center shadow-sm">
                <span className="text-sm text-stone-400 flex items-center gap-2 font-heading"><Home size={14} className="text-amber-700"/> Family</span>
                <span className="text-sm font-mono text-sky-500">${(character.attributes.familyWealth || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Hidden Metrics Debug/Insight */}
          {character.hiddenMetrics && Object.keys(character.hiddenMetrics).length > 0 && (
             <div className="mb-8 opacity-60 hover:opacity-100 transition-opacity">
               <h3 className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-2 font-heading">Shadow Metrics</h3>
               <div className="flex flex-wrap gap-2">
                  {Object.entries(character.hiddenMetrics).map(([key, val]) => (
                     <span key={key} className="text-[10px] px-2 py-1 bg-black/20 border border-stone-800 rounded text-stone-500 font-mono">
                        {key.replace('_', ' ')}: {val}
                     </span>
                  ))}
               </div>
             </div>
          )}
        </aside>

        {/* --- Center: Timeline Feed --- */}
        <main className={`
          md:flex md:col-span-6 flex-col bg-[#0c0a09] relative h-full min-h-0
          ${mobileTab === 'feed' ? 'flex z-10 absolute inset-0 md:static' : 'hidden'}
        `}>
          
          {/* Feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar pb-32 md:pb-8" ref={scrollRef}>
            {/* Render history */}
            {history.map((event, idx) => (
              <EventCard key={idx} event={event} />
            ))}

            {currentEvent && !history.includes(currentEvent) && (
              <EventCard event={currentEvent} isCurrent />
            )}
            
            {/* Pending Event Indicator */}
            {isLoading && (
               <div className="flex gap-4 animate-pulse">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-600 mt-2"></div>
                  </div>
                  <div className="bg-[#1c1917] border border-stone-700 p-6 rounded-sm flex-1">
                     <span className="text-xs text-amber-500 flex items-center gap-2 font-heading tracking-widest">
                        <Sparkles size={12} className="animate-spin" /> Consulting the Fates...
                     </span>
                  </div>
               </div>
            )}
            
            {/* Extra padding at bottom to ensure last item is visible above input area on mobile */}
            <div className="h-24 md:h-0"></div>
          </div>

          {/* Action Area */}
          <div className="flex-none p-4 md:p-6 bg-[#1c1917]/95 backdrop-blur-md border-t border-stone-800 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:shadow-none absolute bottom-[56px] md:bottom-auto left-0 right-0 md:relative">
            {currentEvent?.choices && !isLoading && (
              <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto custom-scrollbar">
                {currentEvent.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => onChoice(choice.id, choice.text)}
                    className="px-4 py-2 bg-[#292524] hover:bg-amber-900/30 border border-stone-600 hover:border-amber-600/50 rounded-full text-xs text-stone-300 hover:text-amber-100 transition-all transform hover:scale-[1.02] text-left font-serif"
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
                placeholder="What is your will?" 
                disabled={isLoading}
                className="w-full bg-[#0c0a09] border border-stone-700 rounded-sm pl-4 pr-12 py-3 text-sm text-stone-200 focus:border-amber-700 focus:outline-none placeholder-stone-700 transition-all focus:bg-[#1c1917] font-serif"
              />
              <button 
                onClick={handleCustomAction}
                disabled={!customInput.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-amber-800 rounded-sm text-amber-100 hover:bg-amber-700 disabled:opacity-50 disabled:hover:bg-amber-800 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

        </main>

        {/* --- Right Sidebar: World News --- */}
        <aside className={`
          md:block md:col-span-3 border-l border-stone-800 bg-[#1c1917] p-6 overflow-y-auto custom-scrollbar
          ${mobileTab === 'news' ? 'block absolute inset-0 z-10' : 'hidden'}
        `}>
           <div className="flex items-center gap-2 mb-6 sticky top-0 bg-[#1c1917] z-10 py-2 border-b border-stone-800">
              <Newspaper size={16} className="text-stone-500" />
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest font-heading">World Feed</h3>
           </div>

           <div className="space-y-6">
              {allNews.length > 0 ? (
                allNews.map((news, i) => (
                  <div key={i} className="group cursor-default animate-fade-in">
                     <div className="flex justify-between items-baseline mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider font-heading ${
                          news.category === 'POLITICS' ? 'text-red-400' : 
                          news.category === 'TECH' ? 'text-sky-400' :
                          news.category === 'HEALTH' ? 'text-emerald-400' : 
                          news.category === 'WORLD' ? 'text-amber-400' : 'text-stone-400'
                        }`}>
                          {news.category}
                        </span>
                        <span className="text-[10px] text-stone-600 font-mono">{formatDisplayDate(news.date)}</span>
                     </div>
                     <h4 className="text-sm font-medium text-stone-300 group-hover:text-amber-100 transition-colors leading-snug font-serif">
                       {news.headline}
                     </h4>
                     <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-800 to-transparent mt-4 group-last:hidden"></div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-stone-600 italic text-center py-10 font-serif">The world is quiet...</div>
              )}
           </div>
        </aside>

      </div>

      {/* --- Mobile Bottom Nav --- */}
      <div className="md:hidden flex items-center justify-around h-[56px] bg-[#1c1917] border-t border-stone-800 fixed bottom-0 left-0 w-full z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
         <button 
           onClick={() => setMobileTab('profile')}
           className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'profile' ? 'text-amber-500' : 'text-stone-600'}`}
         >
           <User size={20} />
           <span className="text-[10px] font-medium font-heading">Profile</span>
         </button>
         
         <button 
           onClick={() => setMobileTab('feed')}
           className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'feed' ? 'text-amber-500' : 'text-stone-600'}`}
         >
           <LayoutDashboard size={20} />
           <span className="text-[10px] font-medium font-heading">Timeline</span>
         </button>

         <button 
           onClick={() => setMobileTab('news')}
           className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'news' ? 'text-amber-500' : 'text-stone-600'}`}
         >
           <Globe size={20} />
           <span className="text-[10px] font-medium font-heading">World</span>
         </button>

         <button 
           onClick={onToggleChat}
           className={`flex flex-col items-center gap-1 p-2 ${isChatOpen ? 'text-amber-500' : 'text-stone-600'}`}
         >
           <MessageCircle size={20} />
           <span className="text-[10px] font-medium font-heading">Oracle</span>
         </button>
      </div>

    </div>
  );
};
