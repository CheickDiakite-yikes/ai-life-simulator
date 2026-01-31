import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
};

interface LandingPageProps {
  onEnterApp: () => void;
}

const GreekColumn: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <svg viewBox="0 0 60 200" className={className} style={style} fill="currentColor">
    <rect x="5" y="10" width="50" height="8" rx="1" />
    <rect x="8" y="18" width="44" height="4" />
    <rect x="10" y="22" width="40" height="6" />
    <rect x="12" y="28" width="36" height="144" />
    <path d="M12 28 Q30 35 48 28 L48 40 Q30 33 12 40 Z" opacity="0.3" />
    <path d="M12 160 Q30 153 48 160 L48 172 Q30 165 12 172 Z" opacity="0.3" />
    <rect x="10" y="172" width="40" height="6" />
    <rect x="8" y="178" width="44" height="4" />
    <rect x="5" y="182" width="50" height="8" rx="1" />
    <rect x="2" y="190" width="56" height="10" rx="2" />
  </svg>
);

const LaurelWreath: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 60" className={className} fill="currentColor">
    <g transform="translate(60, 55)">
      <path d="M-50 0 Q-45 -20 -35 -35 Q-25 -45 -15 -50" fill="none" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="-42" cy="-12" rx="6" ry="10" transform="rotate(-30 -42 -12)" opacity="0.8" />
      <ellipse cx="-36" cy="-24" rx="5" ry="9" transform="rotate(-45 -36 -24)" opacity="0.9" />
      <ellipse cx="-28" cy="-34" rx="5" ry="8" transform="rotate(-60 -28 -34)" />
      <ellipse cx="-18" cy="-42" rx="4" ry="7" transform="rotate(-75 -18 -42)" opacity="0.9" />
      <path d="M50 0 Q45 -20 35 -35 Q25 -45 15 -50" fill="none" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="42" cy="-12" rx="6" ry="10" transform="rotate(30 42 -12)" opacity="0.8" />
      <ellipse cx="36" cy="-24" rx="5" ry="9" transform="rotate(45 36 -24)" opacity="0.9" />
      <ellipse cx="28" cy="-34" rx="5" ry="8" transform="rotate(60 28 -34)" />
      <ellipse cx="18" cy="-42" rx="4" ry="7" transform="rotate(75 18 -42)" opacity="0.9" />
    </g>
  </svg>
);

const GreekPattern: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 200 30" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <g>
      {[0, 40, 80, 120, 160].map((x, i) => (
        <g key={i} transform={`translate(${x}, 0)`}>
          <path d="M0 15 L10 15 L10 5 L20 5 L20 15 L30 15 L30 25 L20 25 L20 15" />
        </g>
      ))}
    </g>
  </svg>
);

const FloatingOrb: React.FC<{ className?: string; delay?: number }> = ({ className = '', delay = 0 }) => {
  const orbRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!orbRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(orbRef.current, {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay
      });
    }, orbRef);
    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={orbRef} className={`absolute rounded-full ${className}`} />
  );
};

const ScrollCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 200 320" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="parchment" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#44403c" />
          <stop offset="5%" stopColor="#292524" />
          <stop offset="95%" stopColor="#292524" />
          <stop offset="100%" stopColor="#44403c" />
        </linearGradient>
        <linearGradient id="rollTop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#78716c" />
          <stop offset="20%" stopColor="#57534e" />
          <stop offset="50%" stopColor="#44403c" />
          <stop offset="80%" stopColor="#57534e" />
          <stop offset="100%" stopColor="#78716c" />
        </linearGradient>
        <linearGradient id="rollShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0c0a09" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0c0a09" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rollHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a8a29e" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#a8a29e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="50%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      
      <rect x="10" y="22" width="180" height="276" fill="url(#parchment)" />
      <rect x="10" y="22" width="180" height="12" fill="url(#rollShadow)" />
      <rect x="10" y="286" width="180" height="12" fill="url(#rollShadow)" transform="rotate(180 100 292)" />
      
      <rect x="0" y="4" width="200" height="22" rx="11" fill="url(#rollTop)" />
      <rect x="0" y="4" width="200" height="11" rx="5.5" fill="url(#rollHighlight)" />
      <rect x="5" y="14" width="190" height="3" fill="#292524" opacity="0.5" />
      
      <rect x="0" y="294" width="200" height="22" rx="11" fill="url(#rollTop)" />
      <rect x="0" y="294" width="200" height="11" rx="5.5" fill="url(#rollHighlight)" />
      <rect x="5" y="304" width="190" height="3" fill="#292524" opacity="0.5" />
      
      <circle cx="6" cy="15" r="5" fill="#57534e" />
      <circle cx="6" cy="15" r="3.5" fill="url(#goldAccent)" />
      <circle cx="6" cy="15" r="1.5" fill="#fbbf24" opacity="0.6" />
      
      <circle cx="194" cy="15" r="5" fill="#57534e" />
      <circle cx="194" cy="15" r="3.5" fill="url(#goldAccent)" />
      <circle cx="194" cy="15" r="1.5" fill="#fbbf24" opacity="0.6" />
      
      <circle cx="6" cy="305" r="5" fill="#57534e" />
      <circle cx="6" cy="305" r="3.5" fill="url(#goldAccent)" />
      <circle cx="6" cy="305" r="1.5" fill="#fbbf24" opacity="0.6" />
      
      <circle cx="194" cy="305" r="5" fill="#57534e" />
      <circle cx="194" cy="305" r="3.5" fill="url(#goldAccent)" />
      <circle cx="194" cy="305" r="1.5" fill="#fbbf24" opacity="0.6" />
    </svg>
    <div className="relative z-10 pt-10 pb-10 px-8">
      {children}
    </div>
  </div>
);

const GreekAmphora: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 100 160" className={className} fill="currentColor">
    <defs>
      <linearGradient id="amphoraBody" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
        <stop offset="30%" stopColor="currentColor" stopOpacity="0.9" />
        <stop offset="70%" stopColor="currentColor" stopOpacity="0.9" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="12" rx="12" ry="6" opacity="0.9" />
    <rect x="44" y="12" width="12" height="8" opacity="0.85" />
    <ellipse cx="50" cy="20" rx="8" ry="3" opacity="0.8" />
    <path d="M42 20 Q38 25 36 35 Q34 50 38 65" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.7" />
    <path d="M58 20 Q62 25 64 35 Q66 50 62 65" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.7" />
    <path d="M42 20 L42 35 Q42 50 50 55 Q58 50 58 35 L58 20" fill="url(#amphoraBody)" />
    <ellipse cx="50" cy="75" rx="32" ry="45" fill="url(#amphoraBody)" />
    <ellipse cx="50" cy="75" rx="32" ry="45" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <ellipse cx="50" cy="40" rx="18" ry="8" opacity="0.7" />
    <path d="M25 60 Q50 55 75 60" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <path d="M22 75 Q50 70 78 75" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <path d="M25 90 Q50 85 75 90" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <path d="M30 105 Q50 100 70 105" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    <path d="M38 65 Q40 75 38 85" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    <path d="M62 65 Q60 75 62 85" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    <ellipse cx="50" cy="120" rx="20" ry="6" opacity="0.8" />
    <path d="M35 120 Q35 140 40 150 L60 150 Q65 140 65 120" fill="url(#amphoraBody)" />
    <ellipse cx="50" cy="150" rx="15" ry="5" opacity="0.9" />
    <rect x="40" y="150" width="20" height="6" opacity="0.85" />
    <ellipse cx="50" cy="156" rx="18" ry="4" opacity="0.9" />
  </svg>
);

const ScrollIndicator: React.FC = () => {
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!indicatorRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(indicatorRef.current, {
        y: 10,
        opacity: 0.3,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      });
    }, indicatorRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={indicatorRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-amber-400/60">
      <span className="text-xs tracking-[0.3em] uppercase">Scroll</span>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5 L12 19 M5 12 L12 19 L19 12" />
      </svg>
    </div>
  );
};

const ShootingStar: React.FC<{ delay?: number; startX?: number; startY?: number }> = ({ delay = 0, startX = 0, startY = 0 }) => {
  const starRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!starRef.current) return;
    const ctx = gsap.context(() => {
      const animateStar = () => {
        if (!starRef.current) return;
        const randomDelay = delay + Math.random() * 10;
        gsap.set(starRef.current, { 
          x: startX, 
          y: startY, 
          opacity: 0,
          scale: 0.7 + Math.random() * 0.5
        });
        gsap.timeline({ delay: randomDelay, onComplete: animateStar })
          .to(starRef.current, { opacity: 1, duration: 0.05 })
          .to(starRef.current, { 
            x: startX + 400 + Math.random() * 300, 
            y: startY + 250 + Math.random() * 200, 
            opacity: 0,
            duration: 0.6 + Math.random() * 0.3,
            ease: "power2.in"
          });
      };
      animateStar();
    }, starRef);
    return () => ctx.revert();
  }, [delay, startX, startY]);

  return (
    <div 
      ref={starRef} 
      className="absolute pointer-events-none"
      style={{ left: 0, top: 0, transform: 'rotate(35deg)' }}
    >
      <svg width="120" height="20" viewBox="0 0 120 20" className="overflow-visible">
        <defs>
          <linearGradient id="starTail" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="30%" stopColor="#fef3c7" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#fcd34d" stopOpacity="0.6" />
            <stop offset="85%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line x1="0" y1="10" x2="110" y2="10" stroke="url(#starTail)" strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="10" x2="110" y2="10" stroke="url(#starTail)" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <circle cx="115" cy="10" r="3" fill="white" filter="url(#starGlow)" />
        <circle cx="115" cy="10" r="2" fill="white" />
        <circle cx="115" cy="10" r="5" fill="white" opacity="0.3" />
      </svg>
    </div>
  );
};

const Satellite: React.FC<{ orbitRadius?: number; speed?: number; startAngle?: number }> = ({ 
  orbitRadius = 200, 
  speed = 30, 
  startAngle = 0 
}) => {
  const satelliteRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!satelliteRef.current || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(containerRef.current, {
        rotation: 360,
        duration: speed,
        repeat: -1,
        ease: "none"
      });
      gsap.to(satelliteRef.current, {
        rotation: -360,
        duration: speed,
        repeat: -1,
        ease: "none"
      });
    }, containerRef);
    return () => ctx.revert();
  }, [speed]);

  return (
    <div 
      ref={containerRef}
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{ 
        width: orbitRadius * 2, 
        height: orbitRadius * 2,
        marginLeft: -orbitRadius,
        marginTop: -orbitRadius,
        transform: `rotate(${startAngle}deg)`
      }}
    >
      <div 
        ref={satelliteRef}
        className="absolute"
        style={{ left: orbitRadius * 2 - 8, top: orbitRadius - 4 }}
      >
        <svg width="16" height="8" viewBox="0 0 16 8" className="text-amber-300/60">
          <rect x="0" y="2" width="4" height="4" fill="currentColor" opacity="0.8" />
          <rect x="5" y="0" width="6" height="8" fill="currentColor" rx="1" />
          <rect x="12" y="2" width="4" height="4" fill="currentColor" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
};

const Spacecraft: React.FC<{ delay?: number; direction?: 'left' | 'right' }> = ({ delay = 0, direction = 'right' }) => {
  const craftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!craftRef.current) return;
    const ctx = gsap.context(() => {
      const animate = () => {
        if (!craftRef.current) return;
        const startX = direction === 'right' ? -100 : window.innerWidth + 100;
        const endX = direction === 'right' ? window.innerWidth + 100 : -100;
        const startY = 50 + Math.random() * 200;
        const wobble = (Math.random() - 0.5) * 100;
        
        gsap.set(craftRef.current, { x: startX, y: startY, opacity: 0 });
        gsap.timeline({ delay: delay + Math.random() * 15, onComplete: animate })
          .to(craftRef.current, { opacity: 0.7, duration: 0.5 })
          .to(craftRef.current, { 
            x: endX,
            y: startY + wobble,
            duration: 15 + Math.random() * 10,
            ease: "none"
          }, "<")
          .to(craftRef.current, { opacity: 0, duration: 0.5 }, "-=0.5");
      };
      animate();
    }, craftRef);
    return () => ctx.revert();
  }, [delay, direction]);

  return (
    <div ref={craftRef} className="absolute pointer-events-none" style={{ left: 0, top: 0 }}>
      <svg width="24" height="12" viewBox="0 0 24 12" className={`text-amber-400/50 ${direction === 'left' ? 'scale-x-[-1]' : ''}`}>
        <ellipse cx="12" cy="6" rx="10" ry="4" fill="currentColor" opacity="0.6" />
        <ellipse cx="12" cy="6" rx="6" ry="3" fill="currentColor" />
        <ellipse cx="12" cy="4" rx="4" ry="2" fill="white" opacity="0.3" />
        <circle cx="6" cy="8" r="1" fill="currentColor" opacity="0.8" />
        <circle cx="12" cy="9" r="1" fill="currentColor" opacity="0.8" />
        <circle cx="18" cy="8" r="1" fill="currentColor" opacity="0.8" />
      </svg>
    </div>
  );
};

const TwinklingStar: React.FC<{ x: number; y: number; delay?: number }> = ({ x, y, delay = 0 }) => {
  const starRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!starRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(starRef.current, {
        opacity: 0.2,
        scale: 0.5,
        duration: 1 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: delay
      });
    }, starRef);
    return () => ctx.revert();
  }, [delay]);

  return (
    <div 
      ref={starRef}
      className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_4px_1px_rgba(255,255,255,0.5)]"
      style={{ left: `${x}%`, top: `${y}%` }}
    />
  );
};

const GlowingTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!titleRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(titleRef.current, {
        textShadow: "0 0 40px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.2)",
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }, titleRef);
    return () => ctx.revert();
  }, []);

  return (
    <h1 ref={titleRef} className={className}>
      {children}
    </h1>
  );
};

const PulsingButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!glowRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(glowRef.current, {
        opacity: 0.6,
        scale: 1.1,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }, glowRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="relative inline-block">
      <div 
        ref={glowRef}
        className="absolute inset-0 bg-amber-500/30 rounded-lg blur-xl -z-10"
      />
      <button
        ref={buttonRef}
        onClick={onClick}
        className="group relative px-12 py-5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white font-bold tracking-[0.2em] uppercase rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-600/30 border border-amber-500/30"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        {children}
      </button>
    </div>
  );
};

const MagicSparkle: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const sparkleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sparkleRef.current) return;
    const ctx = gsap.context(() => {
      const animate = () => {
        if (!sparkleRef.current) return;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        gsap.set(sparkleRef.current, { left: `${x}%`, top: `${y}%`, opacity: 0, scale: 0 });
        gsap.timeline({ delay: delay + Math.random() * 5, onComplete: animate })
          .to(sparkleRef.current, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" })
          .to(sparkleRef.current, { opacity: 0, scale: 0.5, rotation: 180, duration: 0.5, ease: "power2.in" });
      };
      animate();
    }, sparkleRef);
    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={sparkleRef} className="absolute pointer-events-none">
      <svg width="16" height="16" viewBox="0 0 16 16" className="text-amber-400/60">
        <path d="M8 0 L9 6 L16 8 L9 10 L8 16 L7 10 L0 8 L7 6 Z" fill="currentColor" />
      </svg>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const particleCount = prefersReducedMotion ? 5 : 12;

  useEffect(() => {
    if (prefersReducedMotion) {
      gsap.set([titleRef.current, subtitleRef.current, ".hero-laurel", ".hero-column"], { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.fromTo(titleRef.current, 
        { opacity: 0, y: 50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out" }
      )
      .fromTo(subtitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.5"
      )
      .fromTo(".hero-laurel",
        { opacity: 0, scale: 0 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
        "-=0.4"
      )
      .fromTo(".hero-column",
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power2.out" },
        "-=0.6"
      );

      gsap.to(".floating-particle", {
        y: "random(-100, 100)",
        x: "random(-50, 50)",
        rotation: "random(-180, 180)",
        duration: "random(8, 15)",
        repeat: -1,
        yoyo: true,
        ease: "none",
        stagger: {
          each: 0.5,
          from: "random"
        }
      });

      if (section2Ref.current) {
        gsap.fromTo(section2Ref.current.querySelectorAll(".reveal-text"),
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section2Ref.current,
              start: "top 70%",
              toggleActions: "play none none reverse"
            }
          }
        );

        gsap.fromTo(section2Ref.current.querySelector(".statue-reveal"),
          { opacity: 0, scale: 0.8, rotation: -10 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section2Ref.current,
              start: "top 60%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      if (section3Ref.current) {
        gsap.fromTo(section3Ref.current.querySelectorAll(".feature-card"),
          { opacity: 0, y: 100, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section3Ref.current,
              start: "top 70%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      if (section4Ref.current) {
        gsap.fromTo(section4Ref.current.querySelectorAll(".testimonial"),
          { opacity: 0, x: -100 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            stagger: 0.3,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section4Ref.current,
              start: "top 70%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "elastic.out(1, 0.5)",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      gsap.to(heroRef.current, {
        yPercent: 50,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });

    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div ref={containerRef} className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-stone-100 overflow-x-hidden">
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(180,83,9,0.15),transparent_70%)]" />
        
        <FloatingOrb className="w-4 h-4 bg-amber-500/20 blur-sm top-20 left-[20%]" delay={0} />
        <FloatingOrb className="w-6 h-6 bg-amber-400/10 blur-md top-40 right-[25%]" delay={1} />
        <FloatingOrb className="w-3 h-3 bg-amber-600/30 blur-sm bottom-40 left-[30%]" delay={2} />
        <FloatingOrb className="w-5 h-5 bg-amber-300/15 blur-md bottom-20 right-[15%]" delay={0.5} />
        
        {!prefersReducedMotion && (
          <>
            <TwinklingStar x={5} y={8} delay={0} />
            <TwinklingStar x={15} y={15} delay={0.5} />
            <TwinklingStar x={25} y={5} delay={1} />
            <TwinklingStar x={35} y={20} delay={1.5} />
            <TwinklingStar x={45} y={10} delay={0.3} />
            <TwinklingStar x={55} y={25} delay={0.8} />
            <TwinklingStar x={65} y={8} delay={1.2} />
            <TwinklingStar x={75} y={18} delay={0.6} />
            <TwinklingStar x={85} y={12} delay={1.8} />
            <TwinklingStar x={92} y={22} delay={0.2} />
            <TwinklingStar x={8} y={35} delay={1.1} />
            <TwinklingStar x={88} y={38} delay={0.9} />
            
            <ShootingStar delay={0} startX={100} startY={50} />
            <ShootingStar delay={4} startX={300} startY={20} />
            <ShootingStar delay={8} startX={500} startY={80} />
            <ShootingStar delay={12} startX={200} startY={100} />
            <ShootingStar delay={16} startX={600} startY={40} />
            
            <Satellite orbitRadius={280} speed={45} startAngle={0} />
            <Satellite orbitRadius={350} speed={60} startAngle={120} />
            
            <Spacecraft delay={2} direction="right" />
            <Spacecraft delay={20} direction="left" />
            
            <MagicSparkle delay={0} />
            <MagicSparkle delay={2} />
            <MagicSparkle delay={4} />
          </>
        )}
        
        {[...Array(particleCount)].map((_, i) => (
          <div
            key={i}
            className="floating-particle absolute w-1 h-1 bg-amber-500/30 rounded-full"
            style={{
              top: `${((i * 8) + 5) % 100}%`,
              left: `${((i * 13) + 7) % 100}%`,
            }}
          />
        ))}

        <div ref={columnsRef} className="absolute inset-x-0 bottom-0 flex justify-between px-4 md:px-20 pointer-events-none">
          <GreekColumn className="hero-column h-48 md:h-72 text-stone-700/30" />
          <GreekColumn className="hero-column h-40 md:h-60 text-stone-700/20 hidden md:block" style={{ transform: 'translateY(20px)' }} />
          <GreekColumn className="hero-column h-44 md:h-64 text-stone-700/25 hidden lg:block" style={{ transform: 'translateY(10px)' }} />
          <GreekColumn className="hero-column h-48 md:h-72 text-stone-700/30" />
        </div>

        <div className="relative z-10 text-center px-4">
          <LaurelWreath className="hero-laurel w-32 md:w-48 h-auto text-amber-600/60 mx-auto mb-4" />
          
          <h1 ref={titleRef} className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-2xl font-serif">
            SIMILI
          </h1>
          
          <p ref={subtitleRef} className="mt-4 md:mt-6 text-lg md:text-xl tracking-[0.4em] text-stone-400 uppercase font-light">
            AI Life Simulator
          </p>
          
          <GreekPattern className="w-48 md:w-64 h-8 text-amber-700/40 mx-auto mt-6 md:mt-8" />
          
          <p className="mt-8 md:mt-12 text-stone-500 max-w-md mx-auto text-sm md:text-base font-serif italic">
            "Know thyself through infinite lives"
          </p>
        </div>

        <ScrollIndicator />
      </section>

      <section ref={section2Ref} className="relative min-h-screen flex items-center py-20 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(180,83,9,0.1),transparent_50%)]" />
        
        <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <GreekAmphora className="statue-reveal w-32 md:w-48 h-auto text-amber-700/70 mx-auto" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          </div>
          
          <div className="space-y-6">
            <h2 className="reveal-text text-3xl md:text-5xl font-bold text-amber-400 font-serif tracking-wide">
              Your Destiny Awaits
            </h2>
            <p className="reveal-text text-stone-400 text-lg leading-relaxed font-serif">
              Simili harnesses the power of advanced AI to generate infinitely unique life stories. 
              From birth to legacy, every choice shapes your journey through time.
            </p>
            <p className="reveal-text text-stone-500 leading-relaxed font-serif">
              Experience the weight of consequence. Navigate relationships, careers, health, 
              and fortune in a simulation that mirrors the complexity of real life.
            </p>
            <GreekPattern className="reveal-text w-full h-6 text-amber-700/30 mt-8" />
          </div>
        </div>
      </section>

      <section ref={section3Ref} className="relative min-h-screen py-20 md:py-32">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <LaurelWreath className="w-24 h-auto text-amber-600/40 mx-auto mb-4" />
            <h2 className="text-3xl md:text-5xl font-bold text-amber-400 font-serif tracking-wide">
              Three Paths of Fate
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <ScrollCard className="feature-card group transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-6 rounded-full bg-amber-900/40 flex items-center justify-center border border-amber-600/40 group-hover:scale-110 group-hover:border-amber-500/60 transition-all duration-300 shadow-lg shadow-amber-900/20">
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-amber-300 mb-4 font-serif tracking-wide">Real Life</h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent mb-4" />
                <p className="text-stone-400 text-sm leading-relaxed font-serif">
                  Complete randomization. Birth into any era, any place, any circumstance. Fate is truly blind.
                </p>
              </div>
            </ScrollCard>

            <ScrollCard className="feature-card group transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-6 rounded-full bg-amber-900/40 flex items-center justify-center border border-amber-600/40 group-hover:scale-110 group-hover:border-amber-500/60 transition-all duration-300 shadow-lg shadow-amber-900/20">
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-amber-300 mb-4 font-serif tracking-wide">Custom Start</h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent mb-4" />
                <p className="text-stone-400 text-sm leading-relaxed font-serif">
                  Design your origin. Choose your name, birthplace, and initial circumstances to craft your beginning.
                </p>
              </div>
            </ScrollCard>

            <ScrollCard className="feature-card group transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-6 rounded-full bg-amber-900/40 flex items-center justify-center border border-amber-600/40 group-hover:scale-110 group-hover:border-amber-500/60 transition-all duration-300 shadow-lg shadow-amber-900/20">
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-amber-300 mb-4 font-serif tracking-wide">Alternative</h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent mb-4" />
                <p className="text-stone-400 text-sm leading-relaxed font-serif">
                  Step into the multiverse. Magic, superpowers, and the supernatural become possible.
                </p>
              </div>
            </ScrollCard>
          </div>
        </div>
      </section>

      <section ref={section4Ref} className="relative min-h-screen py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(180,83,9,0.08),transparent_60%)]" />
        
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-amber-400 font-serif tracking-wide">
              Echoes from the Oracle
            </h2>
            <p className="mt-4 text-stone-500 font-serif italic">What wanderers say of their journeys</p>
          </div>

          <div className="space-y-8 max-w-3xl mx-auto">
            <div className="testimonial group bg-gradient-to-r from-stone-800/30 to-transparent border-l-4 border-amber-600/50 p-6 md:p-8 transition-all duration-500 hover:from-stone-800/50 hover:border-amber-500 hover:translate-x-2 cursor-default">
              <p className="text-stone-300 font-serif italic text-lg leading-relaxed group-hover:text-stone-200 transition-colors duration-300">
                "I lived as a merchant in Renaissance Venice, a farmer in ancient China, and a programmer in modern Tokyo. 
                Each life taught me something about the human experience."
              </p>
              <p className="mt-4 text-amber-500/80 text-sm tracking-wider group-hover:text-amber-400 transition-colors duration-300">— A Traveler of Many Lives</p>
            </div>

            <div className="testimonial group bg-gradient-to-r from-stone-800/30 to-transparent border-l-4 border-amber-600/50 p-6 md:p-8 transition-all duration-500 hover:from-stone-800/50 hover:border-amber-500 hover:translate-x-2 cursor-default">
              <p className="text-stone-300 font-serif italic text-lg leading-relaxed group-hover:text-stone-200 transition-colors duration-300">
                "The AI understands consequence like no other simulation. My choices rippled through generations. 
                My legacy persisted long after my character's end."
              </p>
              <p className="mt-4 text-amber-500/80 text-sm tracking-wider group-hover:text-amber-400 transition-colors duration-300">— Seeker of Destiny</p>
            </div>

            <div className="testimonial group bg-gradient-to-r from-stone-800/30 to-transparent border-l-4 border-amber-600/50 p-6 md:p-8 transition-all duration-500 hover:from-stone-800/50 hover:border-amber-500 hover:translate-x-2 cursor-default">
              <p className="text-stone-300 font-serif italic text-lg leading-relaxed group-hover:text-stone-200 transition-colors duration-300">
                "In Alternative mode, I discovered I was born with the gift of prophecy. 
                The story that unfolded was unlike anything I could have imagined."
              </p>
              <p className="mt-4 text-amber-500/80 text-sm tracking-wider group-hover:text-amber-400 transition-colors duration-300">— Walker Between Worlds</p>
            </div>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="relative min-h-[70vh] flex items-center justify-center py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(180,83,9,0.2),transparent_60%)]" />
        
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-8 md:px-32 pointer-events-none opacity-20">
          <GreekColumn className="h-40 md:h-56 text-stone-600" />
          <GreekColumn className="h-40 md:h-56 text-stone-600" />
        </div>

        <div className="relative z-10 text-center px-6">
          <LaurelWreath className="w-32 md:w-40 h-auto text-amber-500/50 mx-auto mb-6" />
          
          <h2 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 font-serif tracking-wide mb-6">
            Begin Your Journey
          </h2>
          
          <p className="text-stone-400 max-w-lg mx-auto mb-10 font-serif">
            The Fates await. Step through the veil and discover who you might become.
          </p>
          
          <PulsingButton onClick={onEnterApp}>
            <span className="relative flex items-center gap-3">
              Enter the Simulation
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </PulsingButton>
          
          <GreekPattern className="w-64 h-8 text-amber-700/30 mx-auto mt-12" />
        </div>
      </section>

      <footer className="relative py-12 border-t border-stone-800/50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-stone-600 text-sm font-serif">
            Simili — AI Life Simulator
          </p>
          <p className="text-stone-700 text-xs mt-2">
            "Through infinite lives, find yourself"
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
