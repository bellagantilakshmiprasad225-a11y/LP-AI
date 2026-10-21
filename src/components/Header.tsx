import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Minus, 
  Square, 
  X, 
  Activity, 
  Cpu,
  Camera
} from 'lucide-react';
import type { AICoreState, AssistantMode, ThemeColor } from '../types';

import { soundFx } from '../utils/soundEffects';

interface HeaderProps {
  coreState: AICoreState;
  assistantMode: AssistantMode;
  isMicActive: boolean;
  isCameraActive?: boolean;
  isVoiceOutputEnabled: boolean;
  themeColor: ThemeColor;
  onToggleVoiceOutput: () => void;
  onOpenSettings: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  coreState,
  assistantMode,
  isMicActive,
  isCameraActive = false,
  isVoiceOutputEnabled,
  onToggleVoiceOutput,
  onOpenSettings,
  onToggleMic,
  onToggleCamera,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine status label & color
  const getStatusBadge = () => {
    switch (coreState) {
      case 'listening':
        return {
          text: 'LISTENING',
          dotClass: 'bg-emerald-400 animate-ping',
          badgeClass: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
        };
      case 'processing':
        return {
          text: 'PROCESSING',
          dotClass: 'bg-amber-400 animate-spin',
          badgeClass: 'text-amber-400 border-amber-500/40 bg-amber-950/40'
        };
      case 'speaking':
        return {
          text: 'TRANSMITTING',
          dotClass: 'bg-cyan-400 animate-pulse',
          badgeClass: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40'
        };
      case 'idle':
      default:
        return {
          text: 'ONLINE / READY',
          dotClass: 'bg-cyan-400 animate-pulse',
          badgeClass: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30'
        };
    }
  };

  const status = getStatusBadge();

  return (
    <header className="w-full glass-panel border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between select-none z-30 relative">
      {/* Left: Brand Identity & Version */}
      <div className="flex items-center space-x-3.5">
        <div className="relative flex items-center justify-center">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-900/60 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Cpu className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-[0_0_8px_#00f0ff]" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="font-orbitron font-bold tracking-widest text-lg text-white glow-text-cyan">
              MAYA
            </span>
            <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded border border-cyan-500/30 text-cyan-300/80 bg-cyan-950/40">
              v4.2-NEO
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-rajdhani tracking-wider uppercase flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            Autonomous Neural Voice Matrix
          </p>
        </div>
      </div>

      {/* Center: System Status & Live Clock */}
      <div className="hidden md:flex items-center space-x-6">
        {/* Status indicator */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-rajdhani font-semibold tracking-wider transition-all duration-300 ${status.badgeClass}`}>
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${status.dotClass}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${status.dotClass}`} />
          </span>
          <span>{status.text}</span>
        </div>

        {/* Assistant Mode */}
        <div className="flex items-center space-x-1.5 text-xs font-rajdhani uppercase tracking-wider text-slate-300 bg-slate-900/60 border border-cyan-500/20 px-2.5 py-1 rounded-md">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">MODE:</span>
          <span className="text-cyan-300 font-bold">{assistantMode}</span>
        </div>

        {/* Futuristic Chronometer */}
        <div className="text-right font-mono-code text-xs">
          <div className="text-cyan-300 tracking-widest glow-text-cyan font-bold">{timeStr || '00:00:00'}</div>
          <div className="text-[9px] text-slate-400 tracking-wider">{dateStr || 'OCT 18 2026'}</div>
        </div>
      </div>

      {/* Right: Controls, Audio Toggles, Settings & Window Controls */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Mic Status Toggle Button */}
        <button
          onClick={() => {
            soundFx.play('click');
            onToggleMic();
          }}
          title={isMicActive ? 'Microphone Active (Click to mute)' : 'Microphone Muted (Click to activate)'}
          className={`p-2 rounded-lg border transition-all duration-200 flex items-center justify-center ${
            isMicActive 
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
              : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-500'
          }`}
        >
          {isMicActive ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Optical Sensor Camera HUD Toggle Button */}
        <button
          onClick={() => {
            soundFx.play('click');
            onToggleCamera();
          }}
          title="Open Optical Sensor & Object Recognition HUD"
          className={`p-2 rounded-lg border transition-all duration-200 flex items-center justify-center ${
            isCameraActive
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              : 'bg-slate-900/50 border-cyan-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)]'
          }`}
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Voice Audio Output Toggle */}
        <button
          onClick={() => {
            soundFx.play('click');
            onToggleVoiceOutput();
          }}
          title={isVoiceOutputEnabled ? 'Voice Output ON (MAYA speaks responses)' : 'Voice Output MUTED'}
          className={`p-2 rounded-lg border transition-all duration-200 flex items-center justify-center ${
            isVoiceOutputEnabled
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
              : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-500'
          }`}
        >
          {isVoiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
        </button>

        {/* Settings button */}
        <button
          onClick={() => {
            soundFx.play('click');
            onOpenSettings();
          }}
          title="Open MAYA System Preferences"
          className="p-2 rounded-lg border border-cyan-500/30 bg-slate-900/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 transition-all duration-200 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        >
          <Settings className="w-4 h-4 hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Decorative Sci-Fi Window Buttons */}
        <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-slate-800">
          <button 
            onClick={() => soundFx.play('click')}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors"
            title="Minimize Dashboard"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => soundFx.play('click')}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors"
            title="Maximize Viewport"
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            onClick={() => soundFx.play('alert')}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            title="Standby Mode"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
