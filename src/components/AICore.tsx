import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AICoreState } from '../types';

import { soundFx } from '../utils/soundEffects';

interface AICoreProps {
  state: AICoreState;
  audioLevel: number; // 0 - 100
  frequencyData: number[]; // 16 frequency bands
  animationIntensity: 'low' | 'balanced' | 'high';
  onCoreClick: () => void;
}

export const AICore: React.FC<AICoreProps> = ({
  state,
  audioLevel,
  frequencyData,
  animationIntensity = 'balanced',
  onCoreClick,
}) => {
  // Speed multiplier based on state and intensity
  const speed = useMemo(() => {
    let base = 1;
    if (animationIntensity === 'low') base = 0.5;
    if (animationIntensity === 'high') base = 1.6;

    switch (state) {
      case 'listening': return base * 1.8;
      case 'processing': return base * 2.8;
      case 'speaking': return base * 1.5;
      case 'idle':
      default: return base * 0.9;
    }
  }, [state, animationIntensity]);

  // Dynamic glow color and drop shadow based on core state
  const stateConfig = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          glowColor: 'rgba(0, 240, 255, 0.85)',
          ambientColor: 'rgba(16, 185, 129, 0.25)',
          statusLabel: 'NEURAL INPUT STREAMING',
          badgeText: 'LISTENING',
          pulseScale: 1.05 + (audioLevel / 400),
          ringStroke: '#00f0ff',
          coreStroke: '#38bdf8',
        };
      case 'processing':
        return {
          glowColor: 'rgba(56, 189, 248, 0.9)',
          ambientColor: 'rgba(14, 165, 233, 0.35)',
          statusLabel: 'SYNAPSE QUANTUM CALCULATION',
          badgeText: 'PROCESSING',
          pulseScale: 1.08,
          ringStroke: '#38bdf8',
          coreStroke: '#0284c7',
        };
      case 'speaking':
        return {
          glowColor: 'rgba(0, 210, 255, 0.95)',
          ambientColor: 'rgba(0, 240, 255, 0.3)',
          statusLabel: 'VOCAL SYNTHESIS ACTIVE',
          badgeText: 'SPEAKING',
          pulseScale: 1.1,
          ringStroke: '#00f0ff',
          coreStroke: '#67e8f9',
        };
      case 'idle':
      default:
        return {
          glowColor: 'rgba(0, 240, 255, 0.55)',
          ambientColor: 'rgba(2, 132, 199, 0.15)',
          statusLabel: 'SYSTEM ARMED & STANDING BY',
          badgeText: 'IDLE',
          pulseScale: 1.0,
          ringStroke: '#00f0ff',
          coreStroke: '#0284c7',
        };
    }
  }, [state, audioLevel]);

  // Audio Equalizer Rings (polar frequency points)
  const polarPoints = useMemo(() => {
    const totalBars = 32;
    const radius = 138;
    const cx = 200;
    const cy = 200;
    const points = [];

    for (let i = 0; i < totalBars; i++) {
      const angle = (i / totalBars) * 2 * Math.PI;
      const freqIndex = i % (frequencyData.length || 1);
      const simulatedVal = state === 'speaking' ? ((i * 23) % 55) + 25 : state === 'listening' ? audioLevel : 8;
      const rawVal = frequencyData[freqIndex] || simulatedVal;
      const barHeight = (rawVal / 100) * 28 + 4;

      const x1 = cx + Math.cos(angle) * (radius - 2);
      const y1 = cy + Math.sin(angle) * (radius - 2);
      const x2 = cx + Math.cos(angle) * (radius + barHeight);
      const y2 = cy + Math.sin(angle) * (radius + barHeight);

      points.push({ x1, y1, x2, y2, val: rawVal });
    }
    return points;
  }, [frequencyData, state, audioLevel]);

  return (
    <div className="relative flex flex-col items-center justify-center p-2 sm:p-4 my-auto select-none">
      {/* Background Holographic Atmosphere Glow */}
      <div 
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{
          background: stateConfig.ambientColor,
          transform: `scale(${stateConfig.pulseScale})`,
        }}
      />

      {/* Interactive Core Wrapper */}
      <div 
        onClick={() => {
          soundFx.play('click');
          onCoreClick();
        }}
        className="relative cursor-pointer group flex items-center justify-center transition-transform active:scale-95"
        title="Click AI Core to toggle Voice Listening"
      >
        {/* State acoustic ripples (when listening or speaking) */}
        {(state === 'listening' || state === 'speaking') && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: [0.8, 1.45, 1.7], opacity: [0.6, 0.25, 0] }}
              transition={{ repeat: Infinity, duration: 2.2 / speed, ease: 'easeOut' }}
              className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full border border-cyan-400/40 pointer-events-none"
            />
            <motion.div
              initial={{ scale: 0.7, opacity: 0.7 }}
              animate={{ scale: [0.7, 1.3, 1.55], opacity: [0.5, 0.2, 0] }}
              transition={{ repeat: Infinity, duration: 2.2 / speed, delay: 0.7, ease: 'easeOut' }}
              className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full border border-sky-400/30 pointer-events-none"
            />
          </>
        )}

        {/* Master Animated SVG Canvas */}
        <svg
          viewBox="0 0 400 400"
          className="w-72 h-72 sm:w-96 sm:h-96 md:w-[410px] md:h-[410px] filter drop-shadow-[0_0_25px_rgba(0,240,255,0.45)] group-hover:drop-shadow-[0_0_35px_rgba(0,240,255,0.7)] transition-all duration-300"
        >
          <defs>
            {/* Core Radial Gradients */}
            <radialGradient id="coreRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#0284c7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0.95" />
            </radialGradient>

            <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. OUTERMOST RETICLE RING (Static Coordinates) */}
          <circle cx="200" cy="200" r="185" fill="none" stroke="rgba(0, 240, 255, 0.15)" strokeWidth="1" strokeDasharray="3 6" />
          
          {/* Coordinates Labels */}
          <text x="200" y="10" fill="rgba(0, 240, 255, 0.6)" fontSize="8" fontFamily="'Rajdhani', sans-serif" textAnchor="middle" letterSpacing="1">000° // NOR</text>
          <text x="390" y="203" fill="rgba(0, 240, 255, 0.6)" fontSize="8" fontFamily="'Rajdhani', sans-serif" textAnchor="middle" letterSpacing="1">090°</text>
          <text x="200" y="396" fill="rgba(0, 240, 255, 0.6)" fontSize="8" fontFamily="'Rajdhani', sans-serif" textAnchor="middle" letterSpacing="1">180° // SOU</text>
          <text x="10" y="203" fill="rgba(0, 240, 255, 0.6)" fontSize="8" fontFamily="'Rajdhani', sans-serif" textAnchor="middle" letterSpacing="1">270°</text>

          {/* 2. ROTATING SEGMENTED OUTER RING (Clockwise) */}
          <g 
            style={{ 
              transformOrigin: '200px 200px', 
              animation: `spinClockwise ${24 / speed}s linear infinite` 
            }}
          >
            <circle cx="200" cy="200" r="172" fill="none" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1.5" strokeDasharray="40 18 10 18" />
            {/* 4 Laser tick nodes */}
            <circle cx="200" cy="28" r="3" fill="#00f0ff" />
            <circle cx="372" cy="200" r="3" fill="#00f0ff" />
            <circle cx="200" cy="372" r="3" fill="#00f0ff" />
            <circle cx="28" cy="200" r="3" fill="#00f0ff" />
          </g>

          {/* 3. COUNTER-ROTATING TECH RING (Counter-Clockwise) */}
          <g 
            style={{ 
              transformOrigin: '200px 200px', 
              animation: `spinCounterClockwise ${18 / speed}s linear infinite` 
            }}
          >
            <circle cx="200" cy="200" r="156" fill="none" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="2" strokeDasharray="80 25 15 25" />
            <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="0.8" />
          </g>

          {/* 4. POLAR AUDIO EQUALIZER FREQUENCY BARS */}
          <g filter="url(#neonGlow)">
            {polarPoints.map((pt, i) => (
              <line
                key={i}
                x1={pt.x1}
                y1={pt.y1}
                x2={pt.x2}
                y2={pt.y2}
                stroke={pt.val > 50 ? '#00f0ff' : 'rgba(56, 189, 248, 0.65)'}
                strokeWidth={pt.val > 60 ? '2.5' : '1.5'}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            ))}
          </g>

          {/* 5. RADAR SCANNING BEAM (Active during processing or listening) */}
          {(state === 'processing' || state === 'listening') && (
            <g style={{ transformOrigin: '200px 200px', animation: `spinClockwise ${3 / speed}s linear infinite` }}>
              <line x1="200" y1="200" x2="200" y2="70" stroke="rgba(0, 240, 255, 0.7)" strokeWidth="2" />
              <path
                d="M 200 200 L 200 70 A 130 130 0 0 1 290 105 Z"
                fill="url(#neonCyan)"
                opacity="0.12"
              />
            </g>
          )}

          {/* 6. INNER RETICLE RING & TICK MARKS */}
          <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(0, 240, 255, 0.35)" strokeWidth="1.5" />
          <g style={{ transformOrigin: '200px 200px', animation: `spinClockwise ${12 / speed}s linear infinite` }}>
            <circle cx="200" cy="200" r="112" fill="none" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1" strokeDasharray="12 12" />
          </g>

          {/* 7. GLOWING HOLOGRAPHIC INNER CORE */}
          <circle 
            cx="200" 
            cy="200" 
            r="92" 
            fill="url(#coreRadial)"
            className="transition-all duration-300"
            filter="url(#neonGlow)"
          />

          {/* Central AI Soundwave / Core Identity */}
          <g>
            {/* Center Brand Text */}
            <text
              x="200"
              y="192"
              fill="#ffffff"
              fontSize="24"
              fontWeight="900"
              fontFamily="'Orbitron', sans-serif"
              textAnchor="middle"
              letterSpacing="4"
              className="glow-text-cyan select-none"
            >
              MAYA
            </text>
            
            {/* Sub-label */}
            <text
              x="200"
              y="214"
              fill="#67e8f9"
              fontSize="9"
              fontWeight="600"
              fontFamily="'Rajdhani', sans-serif"
              textAnchor="middle"
              letterSpacing="3"
              className="select-none uppercase"
            >
              {stateConfig.badgeText}
            </text>

            {/* Micro Sine / Waveform in core */}
            <path
              d={
                state === 'speaking'
                  ? "M 165 228 Q 182 218 200 228 T 235 228"
                  : state === 'listening'
                  ? "M 165 228 Q 182 222 200 228 T 235 228"
                  : "M 170 228 L 230 228"
              }
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </g>
        </svg>
      </div>

      {/* Futuristic Telemetry Caption below Core */}
      <div className="mt-2 sm:mt-3 flex flex-col items-center space-y-1 text-center">
        <div className="flex items-center space-x-2 text-xs font-mono-code text-cyan-300 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>{stateConfig.statusLabel}</span>
        </div>
        <p className="text-[11px] font-rajdhani uppercase tracking-widest text-slate-400">
          Click Core to {state === 'listening' ? 'Halt Listening' : 'Engage Voice Recognition'}
        </p>
      </div>
    </div>
  );
};
