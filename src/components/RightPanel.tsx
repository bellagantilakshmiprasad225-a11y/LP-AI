import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Volume2, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageSquare, 
  ListFilter, 
  Trash2 
} from 'lucide-react';
import type { ChatMessage, ActivityLog } from '../types';

import { soundFx } from '../utils/soundEffects';

interface RightPanelProps {
  messages: ChatMessage[];
  logs: ActivityLog[];
  isSpeaking: boolean;
  isListening: boolean;
  sessionDuration: number;
  queryCount: number;
  onSpeakMessage: (text: string) => void;
  onClearMessages: () => void;
  onQuickPrompt: (prompt: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  messages,
  logs,
  isListening,
  sessionDuration,
  queryCount,
  onSpeakMessage,
  onClearMessages,
  onQuickPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'logs'>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  // Auto-scroll logs
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  const handleCopy = (id: string, text: string) => {
    soundFx.play('click');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <aside className="w-full lg:w-96 flex flex-col p-3 sm:p-4 glass-panel rounded-xl border border-cyan-500/20 shadow-2xl h-[450px] lg:h-[calc(100vh-130px)]">
      {/* Panel Top Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              soundFx.play('click');
              setActiveTab('chat');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-rajdhani font-bold tracking-wider uppercase transition-all ${
              activeTab === 'chat'
                ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Dialogue Feed</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              {messages.length}
            </span>
          </button>

          <button
            onClick={() => {
              soundFx.play('click');
              setActiveTab('logs');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-rajdhani font-bold tracking-wider uppercase transition-all ${
              activeTab === 'logs'
                ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Telemetry Logs</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              {logs.length}
            </span>
          </button>
        </div>

        {activeTab === 'chat' && messages.length > 0 && (
          <button
            onClick={() => {
              soundFx.play('alert');
              onClearMessages();
            }}
            title="Clear Chat Logs"
            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1" ref={activeTab === 'chat' ? chatScrollRef : logScrollRef}>
        {activeTab === 'chat' ? (
          /* DIALOGUE CHAT VIEW */
          messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-full border border-cyan-500/20 bg-cyan-950/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-cyan-400/60" />
              </div>
              <div>
                <p className="font-orbitron text-xs text-slate-300 tracking-wider">AWAITING INPUT</p>
                <p className="text-[11px] text-slate-500 mt-1">Speak into the microphone or submit a command below.</p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                {['Who are you?', 'Current time', 'Run diagnostics', 'Open GitHub'].map((hint, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundFx.play('click');
                      onQuickPrompt(hint);
                    }}
                    className="text-[10px] font-mono-code px-2 py-1 rounded bg-slate-900/60 border border-cyan-500/20 text-cyan-300/80 hover:border-cyan-400 hover:text-cyan-200 transition-colors"
                  >
                    "{hint}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMaya = msg.sender === 'maya';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1 ${isMaya ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono-code text-slate-400">
                    {isMaya ? (
                      <>
                        <Bot className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-400 font-bold tracking-wider">MAYA AI</span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-300 font-bold">OPERATOR</span>
                        <User className="w-3 h-3 text-slate-300" />
                      </>
                    )}
                    <span>• {msg.timestamp}</span>
                    {msg.isVoice && (
                      <span className="text-[9px] px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        VOICE
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[92%] p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isMaya
                        ? 'bg-slate-900/80 border border-cyan-500/30 text-slate-100 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                        : 'bg-gradient-to-r from-blue-900/60 to-cyan-900/50 border border-blue-500/30 text-white'
                    }`}
                  >
                    {msg.text}

                    {/* Action Link if command opened URL */}
                    {msg.actionUrl && (
                      <div className="mt-2 pt-1.5 border-t border-cyan-500/20">
                        <a
                          href={msg.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] text-cyan-300 hover:underline"
                        >
                          <span>Open Target Viewport</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions for MAYA responses (Replay Voice & Copy) */}
                  {isMaya && (
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 pl-1">
                      <button
                        onClick={() => {
                          soundFx.play('click');
                          onSpeakMessage(msg.text);
                        }}
                        className="hover:text-cyan-300 flex items-center space-x-1 transition-colors"
                        title="Read message aloud"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay</span>
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="hover:text-cyan-300 flex items-center space-x-1 transition-colors"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          /* SYSTEM ACTIVITY LOGS VIEW */
          <div className="space-y-1.5 font-mono-code text-[11px]">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No system telemetry recorded.</p>
            ) : (
              logs.map((log) => {
                const badgeColor =
                  log.type === 'voice' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800' :
                  log.type === 'core' ? 'text-cyan-400 bg-cyan-950/40 border-cyan-800' :
                  log.type === 'net' ? 'text-blue-400 bg-blue-950/40 border-blue-800' :
                  log.type === 'warn' ? 'text-amber-400 bg-amber-950/40 border-amber-800' :
                  'text-slate-400 bg-slate-900 border-slate-800';

                return (
                  <div key={log.id} className="p-1.5 rounded bg-slate-950/40 border border-slate-900 flex items-start space-x-2">
                    <span className="text-slate-500 text-[10px] shrink-0">{log.timestamp}</span>
                    <span className={`text-[9px] uppercase px-1 rounded border shrink-0 ${badgeColor}`}>
                      {log.type}
                    </span>
                    <span className="text-slate-300 break-words flex-1 leading-tight">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Panel Bottom Telemetry Footer */}
      <div className="pt-2.5 mt-2 border-t border-cyan-500/20 grid grid-cols-3 gap-2 text-[10px] font-mono-code text-slate-400">
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
          <span className="block text-slate-500 text-[9px]">SESSION</span>
          <span className="text-cyan-300 font-bold">{formatDuration(sessionDuration)}</span>
        </div>
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
          <span className="block text-slate-500 text-[9px]">QUERIES</span>
          <span className="text-cyan-300 font-bold">{queryCount} OPS</span>
        </div>
        <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
          <span className="block text-slate-500 text-[9px]">VOICE RECOG</span>
          <span className={`font-bold ${isListening ? 'text-emerald-400' : 'text-slate-300'}`}>
            {isListening ? 'STREAMING' : 'READY'}
          </span>
        </div>
      </div>
    </aside>
  );
};
