import React, { useEffect, useRef } from 'react';

interface CoreNode {
  relX: number;
  relY: number;
  ampX: number;
  ampY: number;
  speed: number;
  phaseX: number;
  phaseY: number;
  colorType: number;
  radius: number;
}

const CORE_NODES: CoreNode[] = [
  { relX: 0.10, relY: 0.18, ampX: 22, ampY: 18, speed: 1.1, phaseX: 0.4, phaseY: 1.2, colorType: 0, radius: 3.2 },
  { relX: 0.24, relY: 0.12, ampX: 18, ampY: 24, speed: 0.9, phaseX: 2.1, phaseY: 0.8, colorType: 1, radius: 3.8 },
  { relX: 0.38, relY: 0.22, ampX: 26, ampY: 16, speed: 1.3, phaseX: 1.5, phaseY: 2.7, colorType: 0, radius: 3.0 },
  { relX: 0.62, relY: 0.16, ampX: 20, ampY: 22, speed: 1.0, phaseX: 3.2, phaseY: 1.4, colorType: 0, radius: 3.4 },
  { relX: 0.78, relY: 0.12, ampX: 24, ampY: 19, speed: 1.2, phaseX: 0.8, phaseY: 3.1, colorType: 0, radius: 3.2 },
  { relX: 0.92, relY: 0.24, ampX: 17, ampY: 25, speed: 0.8, phaseX: 2.4, phaseY: 0.5, colorType: 1, radius: 4.0 },
  { relX: 0.06, relY: 0.38, ampX: 20, ampY: 20, speed: 1.4, phaseX: 1.9, phaseY: 2.0, colorType: 0, radius: 3.0 },
  { relX: 0.20, relY: 0.34, ampX: 28, ampY: 15, speed: 0.95, phaseX: 0.2, phaseY: 1.7, colorType: 2, radius: 3.5 },
  { relX: 0.82, relY: 0.32, ampX: 22, ampY: 22, speed: 1.15, phaseX: 2.8, phaseY: 0.9, colorType: 0, radius: 3.2 },
  { relX: 0.94, relY: 0.46, ampX: 19, ampY: 18, speed: 1.05, phaseX: 1.1, phaseY: 2.3, colorType: 3, radius: 3.0 },
  { relX: 0.08, relY: 0.58, ampX: 23, ampY: 21, speed: 1.2, phaseX: 3.0, phaseY: 1.6, colorType: 0, radius: 3.6 },
  { relX: 0.22, relY: 0.54, ampX: 16, ampY: 26, speed: 0.85, phaseX: 0.7, phaseY: 2.9, colorType: 0, radius: 3.2 },
  { relX: 0.80, relY: 0.56, ampX: 25, ampY: 17, speed: 1.25, phaseX: 2.3, phaseY: 0.4, colorType: 0, radius: 3.4 },
  { relX: 0.92, relY: 0.68, ampX: 21, ampY: 23, speed: 0.9, phaseX: 1.4, phaseY: 3.4, colorType: 1, radius: 3.8 },
  { relX: 0.12, relY: 0.76, ampX: 18, ampY: 20, speed: 1.1, phaseX: 0.9, phaseY: 1.8, colorType: 0, radius: 3.2 },
  { relX: 0.26, relY: 0.72, ampX: 24, ampY: 19, speed: 1.3, phaseX: 2.6, phaseY: 0.7, colorType: 2, radius: 3.6 },
  { relX: 0.38, relY: 0.82, ampX: 20, ampY: 24, speed: 0.95, phaseX: 1.8, phaseY: 2.5, colorType: 0, radius: 3.0 },
  { relX: 0.60, relY: 0.80, ampX: 26, ampY: 18, speed: 1.15, phaseX: 0.5, phaseY: 3.0, colorType: 0, radius: 3.5 },
  { relX: 0.74, relY: 0.74, ampX: 19, ampY: 22, speed: 1.0, phaseX: 2.9, phaseY: 1.1, colorType: 0, radius: 3.2 },
  { relX: 0.88, relY: 0.84, ampX: 22, ampY: 20, speed: 1.2, phaseX: 1.2, phaseY: 2.2, colorType: 3, radius: 3.0 },
  { relX: 0.48, relY: 0.08, ampX: 15, ampY: 18, speed: 1.0, phaseX: 0.3, phaseY: 1.5, colorType: 0, radius: 3.0 },
  { relX: 0.52, relY: 0.90, ampX: 18, ampY: 16, speed: 0.9, phaseX: 2.2, phaseY: 0.6, colorType: 0, radius: 3.2 },
  { relX: 0.32, relY: 0.42, ampX: 14, ampY: 14, speed: 1.2, phaseX: 1.7, phaseY: 3.2, colorType: 0, radius: 2.8 },
  { relX: 0.68, relY: 0.40, ampX: 16, ampY: 15, speed: 1.1, phaseX: 0.8, phaseY: 1.9, colorType: 0, radius: 2.8 },
  { relX: 0.34, relY: 0.64, ampX: 15, ampY: 16, speed: 1.0, phaseX: 2.5, phaseY: 0.4, colorType: 0, radius: 2.8 },
  { relX: 0.66, relY: 0.62, ampX: 17, ampY: 14, speed: 1.3, phaseX: 1.3, phaseY: 2.8, colorType: 0, radius: 2.8 }
];

const NODE_COLORS = ['#00F0FF', '#F59E0B', '#10B981', '#38BDF8'];

interface Props {
  isMiningActive?: boolean;
  onToggleMining?: () => void;
  hashrate?: string;
  className?: string;
  activePlanName?: string;
}

export const NeonMiningCoreVisual: React.FC<Props> = ({
  isMiningActive = true,
  onToggleMining,
  hashrate = '428.5',
  className = '',
  activePlanName = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (currentTime: number) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const center = { x: width / 2, y: height / 2 + 6 };

      ctx.clearRect(0, 0, width, height);

      const elapsed = (currentTime - startTime) / 1000;
      const timeProgress = (elapsed * (2 * Math.PI)) / 14; // 14s cycle
      const orbitAngle = (elapsed * 360) / 18; // 18s orbit cycle
      const coreGlowPulse = 0.55 + 0.4 * Math.sin(elapsed * 2.5);

      // A. Compute node positions
      const currentPositions = CORE_NODES.map((node) => {
        const px = node.relX * width + node.ampX * Math.sin(timeProgress * node.speed + node.phaseX);
        const py = node.relY * height + node.ampY * Math.cos(timeProgress * node.speed + node.phaseY);
        return { x: px, y: py, node };
      });

      // B. Cyber Grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.lineWidth = 0.8;
      const gridSpacing = 40;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // C. Constellation Mesh Lines
      const maxDistance = 125;
      const maxDistSq = maxDistance * maxDistance;

      for (let i = 0; i < currentPositions.length; i++) {
        const posA = currentPositions[i];
        for (let j = i + 1; j < currentPositions.length; j++) {
          const posB = currentPositions[j];
          const dx = posA.x - posB.x;
          const dy = posA.y - posB.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const proximityAlpha = Math.max(0, Math.min(1, 1 - dist / maxDistance));
            const lineAlpha = proximityAlpha * 0.45;

            ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
            ctx.lineWidth = Math.max(0.8, 1.5 * proximityAlpha);
            ctx.beginPath();
            ctx.moveTo(posA.x, posA.y);
            ctx.lineTo(posB.x, posB.y);
            ctx.stroke();

            // Moving energy packets
            if ((i + j) % 3 === 0) {
              const packetProgress = (timeProgress * 1.5 + i * 0.2) % 1;
              const packetX = posA.x + (posB.x - posA.x) * packetProgress;
              const packetY = posA.y + (posB.y - posA.y) * packetProgress;

              ctx.fillStyle = `rgba(0, 240, 255, ${proximityAlpha * 0.85})`;
              ctx.beginPath();
              ctx.arc(packetX, packetY, 2.0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Radial spoke lines to core
        const cdx = posA.x - center.x;
        const cdy = posA.y - center.y;
        const centerDist = Math.sqrt(cdx * cdx + cdy * cdy);
        if (centerDist >= 90 && centerDist <= 160) {
          const spokeAlpha = Math.max(0, Math.min(0.35, ((160 - centerDist) / 70) * 0.28));
          ctx.strokeStyle = `rgba(0, 240, 255, ${spokeAlpha})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(posA.x, posA.y);
          ctx.stroke();
        }
      }

      // D. Draw Constellation Nodes
      currentPositions.forEach(({ x, y, node }) => {
        const color = NODE_COLORS[node.colorType];
        ctx.fillStyle = `${color}38`;
        ctx.beginPath();
        ctx.arc(x, y, node.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // E. Concentric Orbital Rings
      const innerRingRadius = 90;
      const middleRingRadius = 126;
      const outerRingRadius = 158;

      // Outer radial glow
      const radialGlow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, innerRingRadius * 1.5);
      radialGlow.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
      radialGlow.addColorStop(0.5, 'rgba(0, 114, 255, 0.1)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(center.x, center.y, innerRingRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(center.x, center.y, outerRingRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Middle ring
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(center.x, center.y, middleRingRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner accent ring with glow pulse
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 * coreGlowPulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center.x, center.y, innerRingRadius + 4, 0, Math.PI * 2);
      ctx.stroke();

      // F. Orbiting Satellites
      const rad = (orbitAngle * Math.PI) / 180;

      // Satellite 1: Middle ring (Cyan)
      const sat1X = center.x + middleRingRadius * Math.cos(rad);
      const sat1Y = center.y + middleRingRadius * Math.sin(rad);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(sat1X, sat1Y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.arc(sat1X, sat1Y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Satellite 2: Outer ring (Gold)
      const sat2X = center.x - outerRingRadius * Math.cos(rad * 0.75);
      const sat2Y = center.y - outerRingRadius * Math.sin(rad * 0.75);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.beginPath();
      ctx.arc(sat2X, sat2Y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(sat2X, sat2Y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Satellite 3: Outer ring reverse (Emerald)
      const sat3X = center.x + outerRingRadius * Math.cos(-rad * 0.6);
      const sat3Y = center.y + outerRingRadius * Math.sin(-rad * 0.6);
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(sat3X, sat3Y, 3, 0, Math.PI * 2);
      ctx.fill();

      // G. Axis lines to badges
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(center.x, center.y - middleRingRadius);
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(center.x - middleRingRadius, center.y);
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(center.x + middleRingRadius, center.y);
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(center.x, center.y + middleRingRadius);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className={`relative w-full h-[340px] flex items-center justify-center ${className}`}>
      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Floating Satellite Badges matching video 1:1 */}

      {/* Top: USDT */}
      <div
        className="absolute z-10 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#081528]/90 border border-[#00F0FF]/50 shadow-[0_0_12px_rgba(0,240,255,0.25)]"
        style={{ transform: 'translateY(-126px)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
        <span className="text-[11.5px] font-bold tracking-wider text-white">USDT</span>
      </div>

      {/* Left: NODES */}
      <div
        className="absolute z-10 px-2.5 py-1 rounded-lg bg-[#061220]/95 border border-[#00F0FF]/40 text-[#E2E8F0] text-[10.5px] font-bold tracking-widest"
        style={{ transform: 'translate(-132px, 6px)' }}
      >
        NODES
      </div>

      {/* Right: BLOCKS */}
      <div
        className="absolute z-10 px-2.5 py-1 rounded-lg bg-[#061220]/95 border border-[#00F0FF]/40 text-[#E2E8F0] text-[10.5px] font-bold tracking-widest"
        style={{ transform: 'translate(132px, 6px)' }}
      >
        BLOCKS
      </div>

      {/* Bottom: HASHRATE */}
      <div
        className="absolute z-10 px-3 py-1 rounded-lg bg-[#061220]/95 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-bold tracking-wider font-mono shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        style={{ transform: 'translateY(126px)' }}
      >
        HASHRATE · {hashrate} TH/s
      </div>

      {/* Central Glowing Core Sphere: 150px (Green when active, Red when inactive) */}
      <div
        onClick={onToggleMining}
        className={`relative z-10 w-[150px] h-[150px] rounded-full flex flex-col items-center justify-center border-2 transition-all duration-500 cursor-pointer active:scale-95 ${
          isMiningActive
            ? 'border-[#10B981] shadow-[0_0_35px_rgba(16,185,129,0.5)] animate-pulse-slow'
            : 'border-[#EF4444] shadow-[0_0_35px_rgba(239,68,68,0.5)]'
        }`}
        style={{
          background: isMiningActive
            ? 'radial-gradient(circle, #064E3B 0%, #06281E 60%, #02120C 100%)'
            : 'radial-gradient(circle, #450A0A 0%, #260505 60%, #100202 100%)',
          transform: 'translateY(6px)'
        }}
      >
        {/* 3-Tier Diamond Chevron Blockchain Stack */}
        <div className="w-7 h-7 relative flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 28 28"
            fill="none"
            className={`w-7 h-7 transition-colors ${
              isMiningActive ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            {/* Top Diamond */}
            <polygon points="14,2 26,9 14,16 2,9" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
            {/* Middle Chevron */}
            <polyline points="2,13 14,20 26,13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
            {/* Bottom Chevron */}
            <polyline points="2,18 14,25 26,18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          </svg>
        </div>

        <span
          className={`text-[11px] font-bold tracking-[2px] transition-colors mt-1.5 ${
            isMiningActive ? 'text-[#10B981]' : 'text-[#EF4444]'
          }`}
        >
          {activePlanName ? 'ACTIVE NODE' : 'NEON'}
        </span>
        <span
          className={`font-black tracking-wide text-white leading-none mt-0.5 text-center px-1 ${
            activePlanName && activePlanName.length > 8
              ? 'text-[13px]'
              : 'text-[18px]'
          }`}
        >
          {activePlanName || 'MINING'}
        </span>
        <span
          className={`text-[9px] font-bold tracking-wider mt-1 px-2 py-0.5 rounded-full ${
            isMiningActive
              ? 'bg-[#10B981]/20 text-[#10B981]'
              : 'bg-[#EF4444]/20 text-[#EF4444]'
          }`}
        >
          {isMiningActive ? 'ONLINE' : 'TAP TO START'}
        </span>
      </div>
    </div>
  );
};
