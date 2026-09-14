import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const NeonAppSplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [progress, setProgress] = useState(14);
  const [statusText, setStatusText] = useState('Initializing ASIC Core Engines...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(42);
      setStatusText('Syncing BSC Genesis Node #34912...');
    }, 450);

    const t2 = setTimeout(() => {
      setProgress(78);
      setStatusText('Locking Fleet Hashrate: 17.00 TH/s...');
    }, 950);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Security Handshake Confirmed. Welcome Miner.');
    }, 1500);

    const t4 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1950);

    const t5 = setTimeout(() => {
      onComplete();
    }, 2350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[999999] bg-[#02050D] flex flex-col items-center justify-between p-6 sm:p-8 select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Protocol Telemetry Badge */}
      <div className="pt-6 sm:pt-8 flex items-center gap-2 text-[11px] font-mono font-bold tracking-widest text-[#00F0FF]/70">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>NEON PROTOCOL // V4.2 ARCHITECTURE</span>
      </div>

      {/* Center Hero Animation */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm px-4">
        {/* Pulsing Hexagon Logo Container */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-32 h-32 rounded-full bg-cyan-500/15 blur-xl animate-ping" />
          <div className="absolute w-28 h-28 rounded-full border border-cyan-500/30 animate-spin [animation-duration:8s]" />
          <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-[#00F0FF]/40 animate-spin [animation-duration:12s] [animation-direction:reverse]" />

          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#051120] to-[#0A203C] border-2 border-[#00F0FF] flex items-center justify-center shadow-[0_0_35px_rgba(0,240,255,0.4)] p-3">
            <img
              src="/neon_hex_clean.png"
              alt="Neon Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_#00F0FF]"
            />
          </div>
        </div>

        {/* Brand Name & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white flex items-center justify-center gap-2">
            <span>NEON</span>
            <span className="bg-gradient-to-r from-[#00F0FF] to-blue-500 bg-clip-text text-transparent">
              MINING
            </span>
          </h1>
          <p className="text-[10.5px] sm:text-[11.5px] font-mono tracking-widest text-gray-400 uppercase">
            Decentralized Proof-of-Activity Pool
          </p>
        </div>

        {/* Live Status Telemetry Pill */}
        <div className="px-3.5 py-1.5 rounded-full bg-[#081527] border border-[#162945] flex items-center gap-2 text-[11px] font-mono text-cyan-300 shadow-inner max-w-full">
          <Activity className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse shrink-0" />
          <span className="truncate">{statusText}</span>
        </div>

        {/* Futuristic Loading Bar */}
        <div className="w-full max-w-[240px] space-y-2">
          <div className="h-1.5 w-full bg-[#071220] rounded-full overflow-hidden border border-[#14233C] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-[#00F0FF] rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(0,240,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[9.5px] font-mono text-gray-500">
            <span>NODE STATUS: ONLINE</span>
            <span className="text-cyan-400 font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="pb-4 flex flex-col items-center text-center space-y-1 text-[10px] text-gray-500 font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>BEP-20 HARDWARE AUDITED // 256-BIT SECURE</span>
        </div>
        <span>Official Standalone Application Client</span>
      </div>
    </div>
  );
};
