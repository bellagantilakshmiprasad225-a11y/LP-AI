import React, { useState } from 'react';
import { 
  X, 
  Volume2, 
  Sliders, 
  Zap, 
  RotateCcw, 
  Save, 
  Key, 
  Check 
} from 'lucide-react';
import type { UserSettings, ThemeColor } from '../types';
import { soundFx } from '../utils/soundEffects';


interface SettingsModalProps {
  isOpen: boolean;
  settings: UserSettings;
  voices: SpeechSynthesisVoice[];
  onClose: () => void;
  onSave: (newSettings: UserSettings) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  voices,
  onClose,
  onSave,
  onResetDefaults,
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    soundFx.play('click');
    onSave(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const themes: { id: ThemeColor; label: string; color: string }[] = [
    { id: 'cyan', label: 'Cyber Cyan', color: '#00f0ff' },
    { id: 'purple', label: 'Neon Violet', color: '#c084fc' },
    { id: 'green', label: 'Matrix Emerald', color: '#10b981' },
    { id: 'amber', label: 'Solar Amber', color: '#f59e0b' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="w-full max-w-lg glass-panel rounded-2xl border border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/20 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="font-orbitron text-sm font-bold tracking-wider text-white uppercase glow-text-cyan">
              MAYA System Architecture Preferences
            </h2>
          </div>
          <button
            onClick={() => {
              soundFx.play('click');
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs font-rajdhani">
          {/* Section 1: Voice & Vocal Synthesis */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <Volume2 className="w-3.5 h-3.5" />
              Vocal Synthesis Calibration
            </h3>

            {/* Voice Dropdown */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Synthesizer Voice Profile</label>
              <select
                value={localSettings.selectedVoice}
                onChange={(e) => setLocalSettings({ ...localSettings, selectedVoice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-400 focus:outline-none font-mono-code text-[11px]"
              >
                <option value="">Default Neural Voice (Auto-detect Best Natural)</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Rate Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Vocal Cadence (Rate):</span>
                <span className="font-mono-code text-cyan-300 font-bold">{localSettings.speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={localSettings.speechRate}
                onChange={(e) => setLocalSettings({ ...localSettings, speechRate: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Voice Pitch Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Vocal Harmonic Frequency (Pitch):</span>
                <span className="font-mono-code text-cyan-300 font-bold">{localSettings.speechPitch}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={localSettings.speechPitch}
                onChange={(e) => setLocalSettings({ ...localSettings, speechPitch: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Voice Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={localSettings.voiceOutput}
                  onChange={(e) => setLocalSettings({ ...localSettings, voiceOutput: e.target.checked })}
                  className="accent-cyan-400"
                />
                <span className="text-slate-300 font-medium">Read Responses Aloud</span>
              </label>

              <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={localSettings.soundEffects}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, soundEffects: e.target.checked });
                    soundFx.setEnabled(e.target.checked);
                  }}
                  className="accent-cyan-400"
                />
                <span className="text-slate-300 font-medium">Interface Audio FX</span>
              </label>
            </div>
          </div>

          {/* Section 2: Visuals & Core Intensity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <Zap className="w-3.5 h-3.5" />
              Core Hologram Dynamics
            </h3>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Holographic Particle Intensity</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'balanced', 'high'] as const).map((intensity) => (
                  <button
                    key={intensity}
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, animationIntensity: intensity })}
                    className={`py-1.5 px-3 rounded-lg border text-center uppercase tracking-wider font-bold transition-all ${
                      localSettings.animationIntensity === intensity
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Theme */}
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">HUD Accent Luminescence</label>
              <div className="grid grid-cols-4 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, themeColor: t.id })}
                    className={`p-1.5 rounded-lg border flex items-center justify-center space-x-1.5 transition-all ${
                      localSettings.themeColor === t.id
                        ? 'border-white bg-slate-900 shadow-md'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-[10px] font-bold">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: AI Intelligence Engine Backend */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                Intelligence & Question-Answering Engine
              </h3>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                CHATGPT-ENABLED
              </span>
            </div>

            <div className="space-y-2">
              <label className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="aiBackend"
                  checked={localSettings.aiBackend === 'local'}
                  onChange={() => setLocalSettings({ ...localSettings, aiBackend: 'local' })}
                  className="accent-cyan-400 mt-1"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-100 font-bold">MAYA Neural Cloud & Knowledge Matrix</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-semibold">DEFAULT • NO KEY NEEDED</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Answers any question like ChatGPT (science, history, coding, geography, math, definitions, explanations). Grounded with live encyclopedic intelligence without needing an API key.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="aiBackend"
                  checked={localSettings.aiBackend === 'custom'}
                  onChange={() => setLocalSettings({ ...localSettings, aiBackend: 'custom' })}
                  className="accent-cyan-400 mt-1"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-100 font-bold">Custom AI API Key (OpenAI / Groq / OpenRouter / Ollama)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Connect your own high-speed API key or local LLM server for dedicated model execution.
                  </p>
                </div>
              </label>
            </div>

            {localSettings.aiBackend === 'custom' && (
              <div className="p-3 rounded-lg bg-slate-950/70 border border-cyan-500/30 space-y-2.5 animate-fade-in">
                {/* 1-Click Presets */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">Quick Endpoint Presets:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { name: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions' },
                      { name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions' },
                      { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions' },
                      { name: 'Ollama', url: 'http://localhost:11434/v1/chat/completions' },
                    ].map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, apiEndpoint: preset.url })}
                        className="py-1 px-1.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white text-[10px] font-mono-code transition-colors text-center"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5 font-medium">OpenAI/Compatible Proxy URL:</label>
                  <input
                    type="text"
                    placeholder="https://api.openai.com/v1/chat/completions"
                    value={localSettings.apiEndpoint || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, apiEndpoint: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-[11px] font-mono-code text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5 font-medium">API Bearer Key:</label>
                  <input
                    type="password"
                    placeholder="sk-... or gsk_..."
                    value={localSettings.apiKey || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-[11px] font-mono-code text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-cyan-500/20 bg-slate-950/80">
          <button
            onClick={() => {
              soundFx.play('alert');
              onResetDefaults();
              onClose();
            }}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-red-400 transition-colors text-xs font-rajdhani uppercase tracking-wider"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-colors text-xs font-rajdhani uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] text-xs font-rajdhani uppercase"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Configured</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Protocols</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
