import React from 'react';

export const StarBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-black overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-950 to-black opacity-80" />
      <div className="star-bg w-full h-full absolute animate-[pulse_4s_ease-in-out_infinite]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
    </div>
  );
};