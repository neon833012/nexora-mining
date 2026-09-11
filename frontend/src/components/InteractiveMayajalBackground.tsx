import React, { useEffect, useRef } from 'react';

interface MayajalNode {
  relX: number;
  relY: number;
  driftX: number;
  driftY: number;
  speed: number;
  phaseX: number;
  phaseY: number;
  colorIndex: number;
  radius: number;
}

const NODES_CONFIG: MayajalNode[] = [
  { relX: 0.06, relY: 0.05, driftX: 18, driftY: 14, speed: 1.1, phaseX: 0.2, phaseY: 1.4, colorIndex: 0, radius: 3.2 },
  { relX: 0.25, relY: 0.04, driftX: 22, driftY: 16, speed: 0.9, phaseX: 2.1, phaseY: 0.6, colorIndex: 1, radius: 3.5 },
  { relX: 0.50, relY: 0.03, driftX: 16, driftY: 20, speed: 1.3, phaseX: 1.2, phaseY: 2.8, colorIndex: 0, radius: 3.0 },
  { relX: 0.72, relY: 0.05, driftX: 24, driftY: 18, speed: 1.0, phaseX: 3.0, phaseY: 1.1, colorIndex: 2, radius: 3.8 },
  { relX: 0.92, relY: 0.06, driftX: 19, driftY: 22, speed: 1.2, phaseX: 0.7, phaseY: 3.2, colorIndex: 0, radius: 3.4 },

  { relX: 0.12, relY: 0.16, driftX: 20, driftY: 20, speed: 1.15, phaseX: 2.4, phaseY: 0.9, colorIndex: 0, radius: 3.6 },
  { relX: 0.35, relY: 0.14, driftX: 26, driftY: 15, speed: 0.85, phaseX: 0.5, phaseY: 2.1, colorIndex: 0, radius: 3.0 },
  { relX: 0.65, relY: 0.15, driftX: 18, driftY: 24, speed: 1.25, phaseX: 1.8, phaseY: 1.5, colorIndex: 3, radius: 3.4 },
  { relX: 0.85, relY: 0.18, driftX: 22, driftY: 17, speed: 1.05, phaseX: 2.7, phaseY: 0.3, colorIndex: 1, radius: 3.5 },

  { relX: 0.05, relY: 0.28, driftX: 17, driftY: 25, speed: 0.95, phaseX: 1.1, phaseY: 2.5, colorIndex: 0, radius: 3.0 },
  { relX: 0.28, relY: 0.26, driftX: 25, driftY: 18, speed: 1.35, phaseX: 2.9, phaseY: 1.3, colorIndex: 2, radius: 3.8 },
  { relX: 0.52, relY: 0.25, driftX: 20, driftY: 22, speed: 0.9, phaseX: 0.4, phaseY: 2.9, colorIndex: 0, radius: 3.2 },
  { relX: 0.75, relY: 0.27, driftX: 23, driftY: 19, speed: 1.2, phaseX: 1.9, phaseY: 0.7, colorIndex: 0, radius: 3.4 },
  { relX: 0.95, relY: 0.30, driftX: 16, driftY: 21, speed: 1.1, phaseX: 3.2, phaseY: 2.0, colorIndex: 3, radius: 3.2 },

  { relX: 0.10, relY: 0.40, driftX: 24, driftY: 16, speed: 1.0, phaseX: 0.8, phaseY: 1.6, colorIndex: 1, radius: 3.5 },
  { relX: 0.30, relY: 0.38, driftX: 18, driftY: 26, speed: 1.3, phaseX: 2.3, phaseY: 3.1, colorIndex: 0, radius: 3.0 },
  { relX: 0.70, relY: 0.39, driftX: 22, driftY: 18, speed: 0.85, phaseX: 1.6, phaseY: 0.5, colorIndex: 0, radius: 3.2 },
  { relX: 0.90, relY: 0.42, driftX: 25, driftY: 22, speed: 1.15, phaseX: 2.5, phaseY: 2.2, colorIndex: 2, radius: 3.6 },

  { relX: 0.04, relY: 0.52, driftX: 19, driftY: 20, speed: 1.2, phaseX: 1.3, phaseY: 0.8, colorIndex: 0, radius: 3.2 },
  { relX: 0.22, relY: 0.50, driftX: 22, driftY: 17, speed: 0.95, phaseX: 2.8, phaseY: 2.7, colorIndex: 3, radius: 3.4 },
  { relX: 0.78, relY: 0.51, driftX: 20, driftY: 24, speed: 1.1, phaseX: 0.6, phaseY: 1.9, colorIndex: 0, radius: 3.2 },
  { relX: 0.96, relY: 0.54, driftX: 17, driftY: 23, speed: 1.3, phaseX: 3.1, phaseY: 1.2, colorIndex: 1, radius: 3.5 },

  { relX: 0.08, relY: 0.64, driftX: 23, driftY: 19, speed: 1.05, phaseX: 1.7, phaseY: 2.4, colorIndex: 0, radius: 3.0 },
  { relX: 0.26, relY: 0.62, driftX: 26, driftY: 15, speed: 1.25, phaseX: 0.3, phaseY: 0.9, colorIndex: 2, radius: 3.8 },
  { relX: 0.74, relY: 0.63, driftX: 18, driftY: 25, speed: 0.9, phaseX: 2.2, phaseY: 3.0, colorIndex: 0, radius: 3.2 },
  { relX: 0.92, relY: 0.66, driftX: 21, driftY: 20, speed: 1.15, phaseX: 1.5, phaseY: 1.7, colorIndex: 0, radius: 3.4 },

  { relX: 0.12, relY: 0.75, driftX: 20, driftY: 22, speed: 1.1, phaseX: 2.6, phaseY: 0.4, colorIndex: 1, radius: 3.5 },
  { relX: 0.35, relY: 0.73, driftX: 24, driftY: 18, speed: 0.95, phaseX: 0.9, phaseY: 2.6, colorIndex: 0, radius: 3.2 },
  { relX: 0.65, relY: 0.74, driftX: 19, driftY: 21, speed: 1.3, phaseX: 3.0, phaseY: 1.5, colorIndex: 3, radius: 3.6 },
  { relX: 0.88, relY: 0.76, driftX: 25, driftY: 16, speed: 0.85, phaseX: 1.4, phaseY: 0.2, colorIndex: 0, radius: 3.0 },

  { relX: 0.05, relY: 0.86, driftX: 18, driftY: 24, speed: 1.2, phaseX: 2.0, phaseY: 2.8, colorIndex: 0, radius: 3.2 },
  { relX: 0.24, relY: 0.85, driftX: 22, driftY: 19, speed: 1.0, phaseX: 0.5, phaseY: 1.1, colorIndex: 2, radius: 3.8 },
  { relX: 0.50, relY: 0.87, driftX: 26, driftY: 17, speed: 1.25, phaseX: 2.8, phaseY: 2.3, colorIndex: 0, radius: 3.0 },
  { relX: 0.76, relY: 0.85, driftX: 20, driftY: 22, speed: 0.9, phaseX: 1.7, phaseY: 0.6, colorIndex: 1, radius: 3.5 },
  { relX: 0.94, relY: 0.88, driftX: 23, driftY: 20, speed: 1.15, phaseX: 3.3, phaseY: 1.8, colorIndex: 0, radius: 3.2 },

  { relX: 0.15, relY: 0.96, driftX: 21, driftY: 18, speed: 1.05, phaseX: 1.0, phaseY: 2.1, colorIndex: 0, radius: 3.2 },
  { relX: 0.38, relY: 0.95, driftX: 19, driftY: 25, speed: 1.2, phaseX: 2.4, phaseY: 0.7, colorIndex: 3, radius: 3.4 },
  { relX: 0.62, relY: 0.95, driftX: 24, driftY: 16, speed: 0.95, phaseX: 0.8, phaseY: 3.0, colorIndex: 0, radius: 3.0 },
  { relX: 0.85, relY: 0.97, driftX: 17, driftY: 22, speed: 1.3, phaseX: 2.9, phaseY: 1.4, colorIndex: 0, radius: 3.6 }
];

const NODE_COLORS = [
  '#00F0FF', // Cyan Neon
  '#38BDF8', // Electric Blue
  '#F59E0B', // Gold/Amber
  '#10B981'  // Emerald Green
];

interface Props {
  className?: string;
}

export const InteractiveMayajalBackground: React.FC<Props> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchState = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false
  });

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

      ctx.clearRect(0, 0, width, height);

      // Time variables
      const elapsed = (currentTime - startTime) / 1000;
      const time = (elapsed * (2 * Math.PI) / 16); // 16s cycle
      const touchPulse = (elapsed % 1.2) / 1.2; // 1.2s cycle

      const maxConnectionDist = 110;
      const maxConnectionDistSq = maxConnectionDist * maxConnectionDist;
      const touchRadius = 140;
      const touchRadiusSq = touchRadius * touchRadius;

      const { x: tx, y: ty, active: touchActive } = touchState.current;

      // 1. Draw subtle background cyber grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 0.8;
      const gridStep = 45;
      for (let gx = 0; gx < width; gx += gridStep) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // 2. Calculate node positions
      const currentPositions = NODES_CONFIG.map((node) => {
        let baseX = node.relX * width + node.driftX * Math.sin(time * node.speed + node.phaseX);
        let baseY = node.relY * height + node.driftY * Math.cos(time * node.speed + node.phaseY);

        if (touchActive) {
          const dx = tx - baseX;
          const dy = ty - baseY;
          const distSq = dx * dx + dy * dy;

          if (distSq < touchRadiusSq && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / touchRadius) * 48;
            baseX += (dx / dist) * force;
            baseY += (dy / dist) * force;
          }
        }

        return { x: baseX, y: baseY, config: node };
      });

      // 3. Draw Connecting Lines (Mayajal Mesh)
      for (let i = 0; i < currentPositions.length; i++) {
        const posA = currentPositions[i];
        for (let j = i + 1; j < currentPositions.length; j++) {
          const posB = currentPositions[j];
          const dx = posA.x - posB.x;
          const dy = posA.y - posB.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxConnectionDistSq) {
            const dist = Math.sqrt(distSq);
            const factor = Math.max(0, Math.min(1, 1 - dist / maxConnectionDist));
            const alpha = factor * 0.4;

            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = Math.max(0.75, 1.4 * factor);
            ctx.beginPath();
            ctx.moveTo(posA.x, posA.y);
            ctx.lineTo(posB.x, posB.y);
            ctx.stroke();

            // Moving energy sparks along active edges
            if ((i + j) % 4 === 0) {
              const sparkProgress = (time * 1.6 + i * 0.25) % 1;
              const sx = posA.x + (posB.x - posA.x) * sparkProgress;
              const sy = posA.y + (posB.y - posA.y) * sparkProgress;

              ctx.fillStyle = `rgba(0, 240, 255, ${Math.min(1, factor * 0.9)})`;
              ctx.beginPath();
              ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 4. Touch Reactivity: Electric lines to cursor/touch point
      if (touchActive) {
        for (let i = 0; i < currentPositions.length; i++) {
          const pos = currentPositions[i];
          const dx = tx - pos.x;
          const dy = ty - pos.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < touchRadiusSq) {
            const dist = Math.sqrt(distSq);
            const proximity = Math.max(0, Math.min(1, 1 - dist / touchRadius));

            const gradient = ctx.createLinearGradient(pos.x, pos.y, tx, ty);
            gradient.addColorStop(0, `rgba(0, 240, 255, ${proximity * 0.85})`);
            gradient.addColorStop(1, `rgba(56, 189, 248, ${proximity * 0.95})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.8 * proximity + 0.6;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            // Energy particle streaming toward touch finger
            const sparkProgress = (time * 3 + i * 0.3) % 1;
            const sx = pos.x + dx * sparkProgress;
            const sy = pos.y + dy * sparkProgress;

            ctx.fillStyle = `rgba(255, 255, 255, ${proximity})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Expanding touch ripple waves
        const rippleRadius = touchRadius * touchPulse;
        const rippleAlpha = (1 - touchPulse) * 0.5;
        ctx.strokeStyle = `rgba(0, 240, 255, ${rippleAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(tx, ty, rippleRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Touch finger point glow aura & core
        const touchGlow = ctx.createRadialGradient(tx, ty, 0, tx, ty, 35);
        touchGlow.addColorStop(0, 'rgba(0, 240, 255, 0.6)');
        touchGlow.addColorStop(0.5, 'rgba(0, 114, 255, 0.2)');
        touchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = touchGlow;
        ctx.beginPath();
        ctx.arc(tx, ty, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.arc(tx, ty, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Render Constellation Nodes
      currentPositions.forEach(({ x, y, config }) => {
        const baseColor = NODE_COLORS[config.colorIndex];

        // Soft outer glowing halo
        ctx.fillStyle = `${baseColor}40`; // ~25% alpha
        ctx.beginPath();
        ctx.arc(x, y, config.radius * 2.6, 0, Math.PI * 2);
        ctx.fill();

        // Solid glowing node center
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(x, y, config.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright white micro specular dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(x, y, config.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    const handlePointerMove = (e: PointerEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      touchState.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true
      };
    };

    const handlePointerLeave = () => {
      touchState.current.active = false;
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('pointerup', handlePointerLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('pointerup', handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
};
