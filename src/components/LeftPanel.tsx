import React from 'react';
import { 
  Activity, 
  Cpu, 
  Zap, 
  Shield, 
  Terminal, 
  Code, 
  CloudSun, 
  Sparkles,
  Radio,
  Camera
} from 'lucide-react';
import type { AssistantMode, SystemTelemetry } from '../types';

import { soundFx } from '../utils/soundEffects';

interface LeftPanelProps {
  telemetry: SystemTelemetry;
  assistantMode: AssistantMode;
  isListening: boolean;
  audioLevel: number;
  frequencyData: number[];
  recentCommands: string[];
  onSelectMode: (mode: AssistantMode) => void;
  onExecuteCommand: (cmd: string) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  telemetry,
  assistantMode,
  isListening,
  audioLevel,
  frequencyData,
  recentCommands,
  onSelectMode,
  onExecuteCommand,
}) => {
  const modes: { id: AssistantMode; label: string; icon: any; desc: string }[] = [
    { id: 'general', label: 'General Intelligence', icon: Sparkles, desc: 'Balanced cognitive synthesis' },
    { id: 'tactical', label: 'Tactical Cyber', icon: Shield, desc: 'High-alert system monitoring' },
    { id: 'dev', label: 'Code Architect', icon: Code, desc: 'Technical & programming focus' },
    { id: 'creative', label: 'Creative Synth', icon: Zap, desc: 'Ideation & lateral concepts' },
  ];

  const quickActions = [
    { label: 'Ask: Capital of France', command: 'What is the capital of France?', icon: Sparkles },
    { label: 'Ask: Photosynthesis', command: 'What is photosynthesis?', icon: Zap },
    { label: 'Optical Scanner', command: 'Open optical camera scanner', icon: Camera },
    { label: 'System Diagnostics', command: 'Run system diagnostics', icon: Activity },
    { label: 'Weather Forecast', command: 'What is the weather forecast?', icon: CloudSun },
    { label: 'Math: 15% of 80', command: 'What is 15% of 80?', icon: Code },
  ];

  return (
    <aside className="w-full lg:w-80 flex flex-col space-y-4 p-3 sm:p-4 glass-panel rounded-xl border border-cyan-500/20 shadow-2xl overflow-y-auto max-h-[85vh] lg:max-h-[calc(100vh-130px)]">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h2 className="font-orbitron text-xs sm:text-sm font-semibold tracking-wider text-cyan-200 uppercase">
            Control Telemetry
          </h2>
        </div>
        <span className="text-[10px] font-mono-code text-cyan-400/80 px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-950/30">
          SYS-A1
        </span>
      </div>

      {/* 1. Voice Input Real-Time Spectrum HUD */}
      <div className="glass-panel-subtle p-3 rounded-lg border border-cyan-500/15 flex flex-col space-y-2">
        <div className="flex items-center justify-between text-xs font-rajdhani">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Radio className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="uppercase tracking-wider font-semibold">VOICE INPUT FREQUENCY</span>
          </div>
          <span className={`text-[11px] font-mono-code ${isListening ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isListening ? `${audioLevel} dB` : 'STANDBY'}
          </span>
        </div>

        {/* 16-Band Equalizer Bar Spectrum */}
        <div className="h-10 flex items-end justify-between gap-1 px-1 bg-slate-950/50 rounded border border-cyan-950 p-1">
          {frequencyData.slice(0, 16).map((val, idx) => {
            const heightPercent = isListening 
              ? Math.max(8, val) 
              : Math.max(6, Math.sin(idx * 0.6) * 14 + 18);

            return (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-cyan-600 via-cyan-400 to-sky-200 rounded-t-sm transition-all duration-75"
                style={{
                  height: `${heightPercent}%`,
                  opacity: isListening ? 0.9 : 0.35,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 2. System Status & Neural Load */}
      <div className="glass-panel-subtle p-3 rounded-lg border border-cyan-500/15 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-rajdhani text-slate-300 uppercase tracking-wider font-semibold">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Neural Hardware Telemetry
          </span>
          <span className="text-cyan-400 font-mono-code text-[11px]">{telemetry.latencyMs}ms LAT</span>
        </div>

        {/* Load Bar */}
        <div>
          <div className="flex justify-between text-[11px] font-mono-code text-slate-400 mb-1">
            <span>Core Synapse Load</span>
            <span className="text-cyan-300 font-bold">{telemetry.neuralLoad}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-cyan-500/20">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${telemetry.neuralLoad}%` }}
            />
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-code pt-1 border-t border-slate-800">
          <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800">
            <span className="text-slate-500 block">MEMORY BUFFER</span>
            <span className="text-cyan-200 font-semibold">{telemetry.memoryAllocated.toFixed(1)} GB / 16 GB</span>
          </div>
          <div className="bg-slate-950/40 p-1.5 rounded border border-slate-800">
            <span className="text-slate-500 block">CORE TEMP</span>
            <span className="text-cyan-200 font-semibold">{telemetry.coreTemp}°C NOMINAL</span>
          </div>
        </div>
      </div>

      {/* 3. Assistant Mode Switcher */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-rajdhani font-semibold text-slate-300 uppercase tracking-wider block">
          Operating Protocol Mode
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = assistantMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  soundFx.play('mode-switch');
                  onSelectMode(m.id);
                }}
                className={`flex flex-col text-left p-2 rounded-lg border transition-all text-xs font-rajdhani ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-0.5">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="font-bold text-[11px] uppercase tracking-wide truncate">{m.label}</span>
                </div>
                <span className="text-[9px] text-slate-400 truncate">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Quick Actions */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-rajdhani font-semibold text-slate-300 uppercase tracking-wider block">
          Tactical Shortcuts
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {quickActions.map((qa, idx) => {
            const Icon = qa.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  soundFx.play('click');
                  onExecuteCommand(qa.command);
                }}
                className="flex items-center space-x-1.5 p-2 rounded-lg border border-cyan-500/15 bg-slate-900/50 hover:bg-cyan-950/50 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-200 transition-all text-left text-xs font-rajdhani group"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate text-[11px] font-medium tracking-wide">{qa.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Commands */}
      {recentCommands.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-cyan-500/20">
          <label className="text-[11px] font-rajdhani font-semibold text-slate-400 uppercase tracking-wider block">
            Recent Voice / Text Inputs
          </label>
          <div className="space-y-1">
            {recentCommands.slice(0, 3).map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => {
                  soundFx.play('click');
                  onExecuteCommand(cmd);
                }}
                className="w-full text-left px-2 py-1.5 rounded bg-slate-950/40 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-mono-code text-cyan-300/80 hover:text-cyan-200 truncate transition-colors flex items-center justify-between"
                title={`Re-run: "${cmd}"`}
              >
                <span className="truncate">› {cmd}</span>
                <span className="text-[9px] text-slate-500 uppercase">RE-RUN</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
