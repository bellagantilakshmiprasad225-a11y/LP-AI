export type AICoreState = 'idle' | 'listening' | 'processing' | 'speaking';

export type AssistantMode = 'general' | 'tactical' | 'creative' | 'dev';

export type ThemeColor = 'cyan' | 'purple' | 'green' | 'amber';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'maya' | 'system';
  text: string;
  timestamp: string;
  isVoice?: boolean;
  status?: 'done' | 'pending' | 'error';
  commandType?: string;
  actionUrl?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'info' | 'voice' | 'core' | 'net' | 'audio' | 'success' | 'warn' | 'sys';
  message: string;
}

export interface UserSettings {
  voiceOutput: boolean;
  autoListen: boolean;
  animationIntensity: 'low' | 'balanced' | 'high';
  soundEffects: boolean;
  selectedVoice: string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  assistantMode: AssistantMode;
  themeColor: ThemeColor;
  aiBackend: 'local' | 'custom';
  apiEndpoint?: string;
  apiKey?: string;
}

export interface SystemTelemetry {
  neuralLoad: number; // 0 - 100%
  memoryAllocated: number; // GB
  latencyMs: number;
  coreTemp: number; // Celsius
  audioLevel: number; // 0 - 100%
  sessionDuration: number; // seconds
  queryCount: number;
}
