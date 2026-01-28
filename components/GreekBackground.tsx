import React, { useEffect, useRef } from 'react';

export const GreekBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setSize();

    // Configuration
    const STAR_COUNT = 200;
    
    // State
    const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];

    // Initialize Stars
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.6, // Keep stars mostly in upper part
        size: Math.random() * 2,
        alpha: Math.random(),
        speed: Math.random() * 0.02
      });
    }

    let animationFrameId: number;

    const render = () => {
      // Dark night sky background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#020617'); // Very dark blue/black
      gradient.addColorStop(0.6, '#1e1b4b'); // Deep indigo
      gradient.addColorStop(1, '#0f172a'); // Slate
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw Stars
      stars.forEach((star) => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.2) star.speed = -star.speed;
        
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    window.addEventListener('resize', setSize);

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] bg-[#0c0a09] overflow-hidden">
      {/* Canvas Layer (Sky) */}
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Pillars (CSS) */}
      <div className="absolute inset-0 pointer-events-none">
          {/* Left Pillar */}
          <div className="absolute left-0 top-0 bottom-0 w-[8vw] md:w-[120px] bg-gradient-to-r from-[#1c1917] via-[#292524] to-[#0c0a09] shadow-[10px_0_50px_rgba(0,0,0,0.8)] border-r border-[#44403c]/30 flex flex-col justify-between py-10">
             {/* Fluting effect */}
             <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.5) 10px, rgba(0,0,0,0.5) 20px)' }}></div>
             {/* Capital */}
             <div className="h-20 w-[120%] -ml-[10%] bg-gradient-to-b from-[#44403c] to-[#1c1917] shadow-lg mb-auto border-b border-[#57534e]"></div>
             {/* Base */}
             <div className="h-24 w-[140%] -ml-[20%] bg-gradient-to-t from-[#44403c] to-[#1c1917] shadow-lg mt-auto border-t border-[#57534e]"></div>
          </div>

          {/* Right Pillar */}
          <div className="absolute right-0 top-0 bottom-0 w-[8vw] md:w-[120px] bg-gradient-to-l from-[#1c1917] via-[#292524] to-[#0c0a09] shadow-[-10px_0_50px_rgba(0,0,0,0.8)] border-l border-[#44403c]/30 flex flex-col justify-between py-10">
             {/* Fluting effect */}
             <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.5) 10px, rgba(0,0,0,0.5) 20px)' }}></div>
             {/* Capital */}
             <div className="h-20 w-[120%] -ml-[10%] bg-gradient-to-b from-[#44403c] to-[#1c1917] shadow-lg mb-auto border-b border-[#57534e]"></div>
             {/* Base */}
             <div className="h-24 w-[140%] -ml-[20%] bg-gradient-to-t from-[#44403c] to-[#1c1917] shadow-lg mt-auto border-t border-[#57534e]"></div>
          </div>

          {/* Arch/Header (Top) */}
          <div className="absolute top-0 left-0 right-0 h-[80px] bg-gradient-to-b from-[#1c1917] to-transparent z-10 flex items-center justify-center">
             <div className="w-full h-full opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.3) 10px, rgba(0,0,0,0.3) 20px)' }}></div>
          </div>

          {/* Floor (Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 h-[15vh] bg-gradient-to-t from-[#1c1917] via-[#292524] to-transparent z-0"></div>
      </div>

      {/* Vignette & Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[#292524] opacity-10 mix-blend-overlay pointer-events-none" style={{ filter: 'url(#noiseFilter)' }}></div>
    </div>
  );
};
