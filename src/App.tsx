import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  AICoreState, 
  ChatMessage, 
  ActivityLog, 
  UserSettings, 
  SystemTelemetry,
  AssistantMode 
} from './types';
import { Header } from './components/Header';
import { AICore } from './components/AICore';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { BottomControlBar } from './components/BottomControlBar';
import { SettingsModal } from './components/SettingsModal';
import { CameraVisionModal } from './components/CameraVisionModal';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { processUserQuery } from './services/aiService';
import { soundFx } from './utils/soundEffects';

const STORAGE_KEY_SETTINGS = 'maya_settings_v1';
const STORAGE_KEY_CHATS = 'maya_chats_v1';
const STORAGE_KEY_RECENTS = 'maya_recents_v1';

const DEFAULT_SETTINGS: UserSettings = {
  voiceOutput: true,
  autoListen: false,
  animationIntensity: 'balanced',
  soundEffects: true,
  selectedVoice: '',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  assistantMode: 'general',
  themeColor: 'cyan',
  aiBackend: 'local',
};

export const App: React.FC = () => {
  // 1. Settings state with LocalStorage persistence
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 2. Chat history with LocalStorage persistence
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHATS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'msg-init',
        sender: 'maya',
        text: 'MAYA Neural Core v4.2-NEO initialized. All telemetry nominal. Speech recognition and vocal synthesis engines online. How may I assist you today, Operator?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'done',
      }
    ];
  });

  // 3. Recent commands list
  const [recentCommands, setRecentCommands] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECENTS);
      return saved ? JSON.parse(saved) : ['Who are you?', 'Run system diagnostics', 'What is the weather?'];
    } catch {
      return ['Who are you?', 'Run system diagnostics'];
    }
  });

  // 4. System telemetry state
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    neuralLoad: 38,
    memoryAllocated: 3.2,
    latencyMs: 12,
    coreTemp: 41,
    audioLevel: 0,
    sessionDuration: 0,
    queryCount: 1,
  });

  // 5. System activity logs
  const [logs, setLogs] = useState<ActivityLog[]>(() => [
    { id: '1', timestamp: new Date().toLocaleTimeString(), type: 'core', message: 'Holographic Neural Core booted' },
    { id: '2', timestamp: new Date().toLocaleTimeString(), type: 'audio', message: 'Audio synthesis synthesizer online' },
    { id: '3', timestamp: new Date().toLocaleTimeString(), type: 'voice', message: 'Web Speech Recognition matrix ready' },
  ]);

  // 6. UI Modals & Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [bannerAlert, setBannerAlert] = useState<{ text: string; type: 'error' | 'info' | 'warn' } | null>(null);

  const addLog = useCallback((type: ActivityLog['type'], message: string) => {
    setLogs(prev => [
      ...prev.slice(-49), // Keep latest 50 logs
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type,
        message,
      }
    ]);
  }, []);

  // 7. Speech Synthesis hook
  const { isSpeaking, voices, isSupported: isTtsSupported, speak, cancel: cancelSpeech } = useSpeechSynthesis();

  // Reference for query executor to break circular dependencies
  const queryExecutorRef = useRef<(text: string, isVoice: boolean) => void>(() => {});

  // 8. Speech Recognition hook
  const handleFinalSpeechResult = useCallback((spokenText: string) => {
    if (!spokenText.trim()) return;
    queryExecutorRef.current(spokenText.trim(), true);
  }, []);

  const handleSpeechError = useCallback((errText: string) => {
    addLog('warn', errText);
    soundFx.play('alert');
  }, [addLog]);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isSpeechRecogSupported,
    error: speechError,
    audioLevel: micAudioLevel,
    frequencyData: micFreqData,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(handleFinalSpeechResult, handleSpeechError);

  // Derive coreState cleanly without set-state in effect
  const coreState: AICoreState = isProcessing
    ? 'processing'
    : isListening
    ? 'listening'
    : isSpeaking
    ? 'speaking'
    : 'idle';


  // Update session duration & simulated ambient hardware telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        sessionDuration: prev.sessionDuration + 1,
        neuralLoad: Math.min(95, Math.max(20, Math.round(prev.neuralLoad + (Math.sin(prev.sessionDuration * 0.2) * 4)))),
        latencyMs: Math.round(11 + ((prev.sessionDuration % 5) * 0.5)),
        coreTemp: Math.round(40 + ((prev.sessionDuration % 4) * 0.4)),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(recentCommands));
    } catch {}
  }, [recentCommands]);

  // Execute User Query (from voice or text)
  const executeUserQuery = useCallback(async (inputText: string, isVoice: boolean = false) => {
    const cleanText = inputText.trim();
    if (!cleanText) return;

    // 1. Add User Message
    const userMsgId = 'usr-' + Date.now();
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice,
    };

    setMessages(prev => [...prev, newMsg]);
    setRecentCommands(prev => [cleanText, ...prev.filter(c => c.toLowerCase() !== cleanText.toLowerCase())].slice(0, 10));
    setTelemetry(prev => ({ ...prev, queryCount: prev.queryCount + 1 }));

    addLog('voice', `Received command: "${cleanText}" [${isVoice ? 'VOICE' : 'KEYBOARD'}]`);

    // 2. Set processing state
    setIsProcessing(true);
    if (isListening) {
      stopListening();
    }

    // 3. Process via AI Service
    try {
      const result = await processUserQuery(
        cleanText,
        settings.assistantMode,
        {
          endpoint: settings.apiEndpoint,
          apiKey: settings.apiKey,
          useApi: settings.aiBackend === 'custom'
        }
      );

      // 4. Add MAYA Response
      const mayaMsg: ChatMessage = {
        id: 'maya-' + Date.now(),
        sender: 'maya',
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        commandType: result.commandType,
        actionUrl: result.actionUrl,
        status: 'done',
      };

      setMessages(prev => [...prev, mayaMsg]);
      addLog('core', `Processed response for type [${result.commandType || 'general'}]`);
      soundFx.play('message-received');
      setIsProcessing(false);

      // Open optical camera HUD if command requested it
      if (result.commandType === 'open-camera') {
        setIsCameraOpen(true);
      }

      // 5. Read aloud if voice output is enabled
      if (settings.voiceOutput && isTtsSupported) {
        speak(result.text, {
          voiceName: settings.selectedVoice,
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          volume: settings.speechVolume,
          onEnd: () => {
            // If autoListen is enabled, automatically start listening again!
            if (settings.autoListen) {
              setTimeout(() => {
                startListening();
              }, 500);
            }
          },
        });
      }

    } catch (err: any) {
      addLog('warn', `Error computing query: ${err?.message}`);
      setIsProcessing(false);
    }
  }, [
    isListening, 
    stopListening, 
    settings.assistantMode, 
    settings.apiEndpoint, 
    settings.apiKey, 
    settings.aiBackend, 
    settings.voiceOutput, 
    settings.selectedVoice, 
    settings.speechRate, 
    settings.speechPitch, 
    settings.speechVolume, 
    settings.autoListen, 
    isTtsSupported, 
    addLog, 
    speak, 
    startListening
  ]);

  // Optical Vision Callback handlers
  const handleCameraObjectIdentified = useCallback((objectName: string, explanation: string) => {
    const mayaMsg: ChatMessage = {
      id: 'obj-' + Date.now(),
      sender: 'maya',
      text: explanation,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      commandType: 'vision-scan',
      status: 'done',
    };
    setMessages(prev => [...prev, mayaMsg]);
    addLog('core', `Optical target locked: ${objectName.toUpperCase()}`);
    setTelemetry(prev => ({ ...prev, queryCount: prev.queryCount + 1 }));
  }, [addLog]);

  const handleSpeakExplanation = useCallback((text: string) => {
    if (settings.voiceOutput && isTtsSupported) {
      speak(text, {
        voiceName: settings.selectedVoice,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
      });
    }
  }, [settings.voiceOutput, settings.selectedVoice, settings.speechRate, settings.speechPitch, isTtsSupported, speak]);


  // Keep queryExecutorRef updated
  useEffect(() => {
    queryExecutorRef.current = executeUserQuery;
  }, [executeUserQuery]);

  // Toggle Listening
  const handleToggleListening = () => {
    if (isSpeaking) {
      cancelSpeech();
    }

    if (isListening) {
      stopListening();
      addLog('voice', 'Microphone stream deactivated');
    } else {
      if (!isSpeechRecogSupported) {
        setBannerAlert({
          text: 'Speech Recognition is not supported by your current browser. You can use the ✨ test prompts menu or type directly.',
          type: 'warn'
        });
        soundFx.play('alert');
        return;
      }
      resetTranscript();
      startListening();
      addLog('voice', 'Microphone stream engaged');
    }
  };

  // Toggle Voice Output
  const handleToggleVoiceOutput = () => {
    const nextVal = !settings.voiceOutput;
    setSettings(prev => ({ ...prev, voiceOutput: nextVal }));
    if (!nextVal && isSpeaking) {
      cancelSpeech();
    }
    addLog('audio', `Voice output ${nextVal ? 'ENABLED' : 'MUTED'}`);
  };

  // Clear Messages
  const handleClearMessages = () => {
    setMessages([]);
    addLog('sys', 'Conversation history purged from memory cache');
  };

  // Simulate Voice Command (for testing or if mic is denied)
  const handleSimulateVoiceCommand = (cmd: string) => {
    addLog('voice', `Simulated voice trigger: "${cmd}"`);
    executeUserQuery(cmd, true);
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCameraOpen) {
          setIsCameraOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isListening) {
          stopListening();
          soundFx.play('listen-stop');
        } else if (isSpeaking) {
          cancelSpeech();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCameraOpen, isSettingsOpen, isListening, isSpeaking, stopListening, cancelSpeech]);

  const activeAlert = bannerAlert || (speechError ? { text: speechError, type: 'warn' as const } : null);

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col relative overflow-x-hidden bg-cyber-grid">
      {/* Sci-Fi Background Ambient Vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* Futuristic Banner Notification */}
      {activeAlert && (
        <div className="relative z-40 bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 text-xs font-rajdhani flex items-center justify-between text-amber-200 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold uppercase tracking-wider">SYSTEM NOTICE:</span>
            <span>{activeAlert.text}</span>
          </div>
          <button
            onClick={() => setBannerAlert(null)}
            className="text-amber-400 hover:text-white uppercase font-bold text-[10px] px-2 py-0.5 rounded border border-amber-700/50"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        coreState={coreState}
        assistantMode={settings.assistantMode}
        isMicActive={isListening}
        isCameraActive={isCameraOpen}
        isVoiceOutputEnabled={settings.voiceOutput}
        themeColor={settings.themeColor}
        onToggleVoiceOutput={handleToggleVoiceOutput}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleMic={handleToggleListening}
        onToggleCamera={() => setIsCameraOpen(!isCameraOpen)}
      />


      {/* Main Dashboard Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4 flex flex-col lg:flex-row items-center lg:items-stretch justify-between gap-4 relative z-10">
        {/* Left Control Panel */}
        <div className="w-full lg:w-80 order-2 lg:order-1 flex justify-center">
          <LeftPanel
            telemetry={telemetry}
            assistantMode={settings.assistantMode}
            isListening={isListening}
            audioLevel={micAudioLevel}
            frequencyData={micFreqData}
            recentCommands={recentCommands}
            onSelectMode={(mode: AssistantMode) => {
              setSettings(prev => ({ ...prev, assistantMode: mode }));
              addLog('sys', `Assistant mode transitioned to [${mode.toUpperCase()}]`);
            }}
            onExecuteCommand={(cmd) => executeUserQuery(cmd, false)}
          />
        </div>

        {/* Center AI Core */}
        <div className="flex-1 flex flex-col items-center justify-center order-1 lg:order-2 my-auto min-h-[350px] sm:min-h-[420px]">
          <AICore
            state={coreState}
            audioLevel={micAudioLevel}
            frequencyData={micFreqData}
            animationIntensity={settings.animationIntensity}
            onCoreClick={handleToggleListening}
          />
        </div>

        {/* Right Information Panel */}
        <div className="w-full lg:w-96 order-3 flex justify-center">
          <RightPanel
            messages={messages}
            logs={logs}
            isSpeaking={isSpeaking}
            isListening={isListening}
            sessionDuration={telemetry.sessionDuration}
            queryCount={telemetry.queryCount}
            onSpeakMessage={(text) => {
              speak(text, {
                voiceName: settings.selectedVoice,
                rate: settings.speechRate,
                pitch: settings.speechPitch,
              });
            }}
            onClearMessages={handleClearMessages}
            onQuickPrompt={(prompt) => executeUserQuery(prompt, false)}
          />
        </div>
      </main>

      {/* Bottom Control Bar */}
      <footer className="w-full px-2 sm:px-4 pb-3 sm:pb-4 pt-1 flex justify-center relative z-20">
        <BottomControlBar
          coreState={coreState}
          isListening={isListening}
          isVoiceOutputEnabled={settings.voiceOutput}
          transcript={transcript}
          interimTranscript={interimTranscript}
          onToggleListening={handleToggleListening}
          onSendMessage={(text, isVoice) => executeUserQuery(text, isVoice)}
          onToggleVoiceOutput={handleToggleVoiceOutput}
          onClearMessages={handleClearMessages}
          onSimulateVoiceCommand={handleSimulateVoiceCommand}
        />
      </footer>

      {/* Optical Sensor & Object Recognition Modal */}
      <CameraVisionModal
        isOpen={isCameraOpen}
        isSpeaking={isSpeaking}
        onClose={() => setIsCameraOpen(false)}
        onObjectIdentified={handleCameraObjectIdentified}
        onSpeakExplanation={handleSpeakExplanation}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        voices={voices}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(newSettings) => {
          setSettings(newSettings);
          addLog('sys', 'System configuration updated');
        }}
        onResetDefaults={() => {
          setSettings(DEFAULT_SETTINGS);
          addLog('sys', 'System settings reset to default values');
        }}
      />
    </div>
  );
};

export default App;
