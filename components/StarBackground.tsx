import React, { useEffect, useRef } from 'react';

export const StarBackground: React.FC = () => {
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
    const STAR_COUNT = 400;
    const SPEED = 0.5; // Slow, ominous speed
    
    // State
    const stars: { x: number; y: number; z: number; o: number }[] = [];
    let mouseX = width / 2;
    let mouseY = height / 2;

    // Initialize Stars
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * width,
        o: Math.random()
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('resize', setSize);
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const render = () => {
      // Clear with trail effect for ominous motion blur
      ctx.fillStyle = 'rgba(5, 8, 16, 0.3)'; 
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Mouse Parallax factor (subtle)
      const targetX = (mouseX - cx) * 0.05;
      const targetY = (mouseY - cy) * 0.05;

      stars.forEach((star) => {
        // Move star towards screen
        star.z -= SPEED;

        // Reset star if it passes camera or goes too far
        if (star.z <= 0) {
          star.z = width;
          star.x = Math.random() * width - cx;
          star.y = Math.random() * height - cy;
        }

        // Project 3D coordinates to 2D
        const k = 128.0 / star.z;
        const x = star.x * k + cx + targetX;
        const y = star.y * k + cy + targetY;

        if (x >= 0 && x <= width && y >= 0 && y <= height) {
          const size = Math.max(0.1, (1 - star.z / width) * 2.5);
          const opacity = Math.max(0, Math.min(1, 1 - star.z / width));

          ctx.beginPath();
          ctx.fillStyle = `rgba(180, 200, 255, ${opacity})`;
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw subtle connecting lines for "Network/Matrix" feel if stars are close
      // Kept minimal for performance and "clean" sci-fi look
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setSize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] bg-[#02040a] overflow-hidden">
      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-80" />
      
      {/* Sci-Fi Grid Overlay - Top */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 40%)'
        }} 
      />

      {/* Sci-Fi Grid Overlay - Bottom (Floor) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[50vh] opacity-10 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(rgba(147, 51, 234, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(147, 51, 234, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          transform: 'perspective(500px) rotateX(60deg) translateY(100px) scale(2)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
        }} 
      />

      {/* Vignette & Color Grading */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)] pointer-events-none opacity-80" />
      
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{backgroundSize: "100% 2px, 3px 100%"}}></div>
    </div>
  );
};