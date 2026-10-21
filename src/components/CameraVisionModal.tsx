import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  X, 
  Scan, 
  Volume2, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Eye, 
  ShieldCheck,
  SwitchCamera
} from 'lucide-react';
import { detectObjects, getObjectExplanation, type DetectedObject } from '../services/visionService';
import { soundFx } from '../utils/soundEffects';

interface CameraVisionModalProps {
  isOpen: boolean;
  isSpeaking: boolean;
  onClose: () => void;
  onObjectIdentified: (objectName: string, explanation: string) => void;
  onSpeakExplanation: (text: string) => void;
}

export const CameraVisionModal: React.FC<CameraVisionModalProps> = ({
  isOpen,
  isSpeaking: _isSpeaking,
  onClose,
  onObjectIdentified,
  onSpeakExplanation,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [explanationText, setExplanationText] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const lastSpokenClassRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    try {
      setCameraError(null);
      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera MediaDevices API not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        setFrozenFrame(null);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser, or upload an image below to test object recognition.');
      } else {
        setCameraError(`Camera initialization failed: ${err.message || 'Device not available'}`);
      }
    }
  }, [facingMode, stopCamera]);

  // Handle Object Analysis & Speech
  const handleAnalyzeObject = useCallback((obj: DetectedObject) => {
    soundFx.play('message-received');
    const text = getObjectExplanation(obj.class, obj.score);
    setSelectedObject(obj);
    setExplanationText(text);
    onObjectIdentified(obj.class, text);

    if (autoSpeak) {
      onSpeakExplanation(text);
    }
  }, [autoSpeak, onObjectIdentified, onSpeakExplanation]);

  const runDetectionRef = useRef<() => void>(() => {});

  // Detection loop
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
      detectionLoopRef.current = requestAnimationFrame(() => runDetectionRef.current());
      return;
    }

    try {
      const predictions = await detectObjects(videoRef.current);
      setDetectedObjects(predictions);
      setIsLoadingModel(false);

      // Draw bounding boxes on HUD Canvas
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        predictions.forEach(pred => {
          const [x, y, width, height] = pred.bbox;
          const scorePercent = Math.round(pred.score * 100);

          // Neon Cyan Bounding Box
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.strokeRect(x, y, width, height);

          // Corner tick accents
          const tick = Math.min(width, height) * 0.2;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          // Top Left
          ctx.moveTo(x, y + tick); ctx.lineTo(x, y); ctx.lineTo(x + tick, y);
          // Top Right
          ctx.moveTo(x + width - tick, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + tick);
          // Bottom Left
          ctx.moveTo(x, y + height - tick); ctx.lineTo(x, y + height); ctx.lineTo(x + tick, y + height);
          // Bottom Right
          ctx.moveTo(x + width - tick, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - tick);
          ctx.stroke();

          // Label Plate
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
          const label = `[ ${pred.class.toUpperCase()} // ${scorePercent}% ]`;
          ctx.font = 'bold 12px "Rajdhani", sans-serif';
          const textWidth = ctx.measureText(label).width;
          ctx.fillRect(x, Math.max(0, y - 24), textWidth + 16, 22);

          ctx.fillStyle = '#00f0ff';
          ctx.fillText(label, x + 8, Math.max(16, y - 8));
        });
      }

      // Auto-analyze top high-confidence object if not spoken recently
      if (predictions.length > 0 && autoSpeak) {
        const top = predictions[0];
        if (top.score > 0.65 && top.class !== lastSpokenClassRef.current) {
          lastSpokenClassRef.current = top.class;
          handleAnalyzeObject(top);
        }
      }
    } catch (e) {
      console.warn('Detection cycle error:', e);
    }

    // Schedule next detection frame (throttle to ~300ms for high performance)
    setTimeout(() => {
      detectionLoopRef.current = requestAnimationFrame(() => runDetectionRef.current());
    }, 280);
  }, [autoSpeak, handleAnalyzeObject]);

  useEffect(() => {
    runDetectionRef.current = runDetection;
  }, [runDetection]);

  // Lifecycle
  useEffect(() => {
    if (!isOpen) return;

    soundFx.play('listen-start');
    const timer = setTimeout(() => {
      startCamera();
    }, 50);

    return () => {
      clearTimeout(timer);
      stopCamera();
      lastSpokenClassRef.current = '';
    };
  }, [isOpen, startCamera, stopCamera]);


  // Start detection when camera becomes active
  useEffect(() => {
    if (isCameraActive) {
      detectionLoopRef.current = requestAnimationFrame(() => runDetectionRef.current());
    }
    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }
    };
  }, [isCameraActive]);

  // Handle Image Upload for testing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.play('click');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setFrozenFrame(dataUrl);
      stopCamera();

      // Create an image element to run detection
      const img = new Image();
      img.src = dataUrl;
      img.onload = async () => {
        setIsLoadingModel(true);
        const predictions = await detectObjects(img);
        setDetectedObjects(predictions);
        setIsLoadingModel(false);

        if (predictions.length > 0) {
          handleAnalyzeObject(predictions[0]);
        } else {
          setExplanationText('No recognizable objects detected with high confidence in this snapshot. Please try an image with clear lighting.');
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Sample Preset Test Objects
  const handlePresetTest = (presetName: string) => {
    soundFx.play('click');
    const presetMap: Record<string, DetectedObject> = {
      'cell phone': { class: 'cell phone', score: 0.96, bbox: [120, 80, 200, 360] },
      'cup': { class: 'cup', score: 0.92, bbox: [160, 120, 180, 220] },
      'laptop': { class: 'laptop', score: 0.95, bbox: [80, 100, 380, 260] },
      'book': { class: 'book', score: 0.89, bbox: [140, 110, 220, 280] },
      'clock': { class: 'clock', score: 0.94, bbox: [150, 90, 210, 210] },
    };

    const preset = presetMap[presetName];
    if (preset) {
      setDetectedObjects([preset]);
      handleAnalyzeObject(preset);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
      <div 
        className="w-full max-w-4xl glass-panel rounded-2xl border border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-cyan-500/20 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              <Camera className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-orbitron text-sm font-bold tracking-wider text-white uppercase glow-text-cyan">
                  MAYA Optical Sensor & Object Recognition HUD
                </h2>
                <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded border border-cyan-500/40 text-cyan-300 bg-cyan-950/50">
                  COCO-SSD v2
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-rajdhani tracking-wider uppercase">
                Real-Time Computer Vision • Optical Object Analysis & Speech
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.play('click');
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2 Cols: Camera Viewport HUD */}
          <div className="lg:col-span-2 flex flex-col space-y-3">
            {/* Main Video Screen Container with Cyber Reticle */}
            <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-cyan-500/30 shadow-inner flex items-center justify-center group">
              {/* Actual Video Feed */}
              {frozenFrame ? (
                <img 
                  src={frozenFrame} 
                  alt="Snapshot" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
                />
              )}

              {/* Real-time Bounding Box Canvas Overlay */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />

              {/* Sci-Fi HUD Corner Brackets */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

              {/* Central Aiming Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-16 h-16 rounded-full border border-dashed border-cyan-400 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                </div>
              </div>

              {/* Laser Scanning Line */}
              {isCameraActive && (
                <div 
                  className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75 shadow-[0_0_12px_#00f0ff] pointer-events-none"
                  style={{
                    animation: 'scanLine 3s ease-in-out infinite alternate',
                  }}
                />
              )}

              {/* Telemetry Overlays */}
              <div className="absolute top-3 left-3 bg-slate-950/80 px-2 py-1 rounded border border-cyan-500/20 text-[10px] font-mono-code text-cyan-300 z-20 flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
                <span>{isCameraActive ? 'OPTICAL FEED LIVE' : 'FEED STANDBY'}</span>
              </div>

              <div className="absolute bottom-3 right-3 bg-slate-950/80 px-2 py-1 rounded border border-cyan-500/20 text-[10px] font-mono-code text-slate-300 z-20">
                {detectedObjects.length > 0 ? (
                  <span className="text-cyan-300 font-bold">
                    {detectedObjects.length} TARGET{detectedObjects.length > 1 ? 'S' : ''} ACQUIRED
                  </span>
                ) : (
                  <span>SCANNING FIELD OF VIEW...</span>
                )}
              </div>

              {/* Loading / Camera Error State */}
              {!isCameraActive && !frozenFrame && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 z-30 space-y-3">
                  {cameraError ? (
                    <>
                      <AlertTriangle className="w-10 h-10 text-amber-400 animate-pulse" />
                      <p className="text-xs text-amber-200 max-w-md">{cameraError}</p>
                      <div className="flex flex-wrap gap-2 justify-center pt-2">
                        <button
                          onClick={() => startCamera()}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs font-rajdhani uppercase hover:bg-cyan-400"
                        >
                          Retry Camera Permission
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 text-xs font-rajdhani uppercase hover:bg-cyan-950/50"
                        >
                          Upload Photo Instead
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                      <p className="text-xs font-mono-code text-cyan-300">
                        {isLoadingModel ? 'INITIALIZING TENSORFLOW NEURAL VISION CORE...' : 'REQUESTING OPTICAL SENSOR PERMISSION...'}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Viewport Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-cyan-500/20 text-xs font-rajdhani">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    soundFx.play('click');
                    if (isCameraActive) {
                      stopCamera();
                    } else {
                      startCamera();
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                    isCameraActive
                      ? 'bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60'
                      : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isCameraActive ? 'Halt Optical Feed' : 'Engage Camera'}</span>
                </button>

                {/* Flip camera on mobile */}
                {isCameraActive && (
                  <button
                    onClick={() => {
                      soundFx.play('click');
                      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
                      setFacingMode(nextMode);
                      startCamera(nextMode);
                    }}
                    title="Switch Front/Rear Camera"
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-cyan-300"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}

                {/* Upload Image Option */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-cyan-300 transition-colors"
                  title="Upload image file to recognize object"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload Image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Auto-Speak Vocal Explanation Toggle */}
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-cyan-300">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Auto-Vocalize Detected Object
                </span>
              </label>
            </div>

            {/* Quick Test Presets (in case no camera or testing instant identification) */}
            <div className="space-y-1">
              <span className="text-[10px] font-rajdhani text-slate-400 uppercase tracking-wider block">
                Instant Test Objects Simulation:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['cell phone', 'cup', 'laptop', 'book', 'clock'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetTest(preset)}
                    className="px-2.5 py-1 rounded bg-slate-900/70 border border-cyan-500/20 text-cyan-300/80 hover:text-cyan-200 hover:border-cyan-400 text-[11px] font-mono-code transition-colors flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3 text-cyan-400" />
                    <span>{preset.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Object Identification Readout & Answer */}
          <div className="flex flex-col space-y-3 glass-panel-subtle p-3.5 rounded-xl border border-cyan-500/20 max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <div className="flex items-center space-x-1.5 text-cyan-300 font-orbitron text-xs font-bold uppercase tracking-wider">
                <Scan className="w-4 h-4 text-cyan-400" />
                <span>Identification Stream</span>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Detected Objects Badges List */}
            <div>
              <label className="text-[10px] font-rajdhani uppercase text-slate-400 tracking-wider block mb-1.5">
                Active Targets in Viewport:
              </label>
              {detectedObjects.length === 0 ? (
                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-center text-slate-500 text-xs font-mono-code">
                  Point your camera toward an object (phone, cup, laptop, book, watch, etc.)
                </div>
              ) : (
                <div className="space-y-1.5">
                  {detectedObjects.map((obj, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnalyzeObject(obj)}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                        selectedObject?.class === obj.class
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-bold text-xs uppercase font-rajdhani tracking-wider">
                          {obj.class}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-code text-cyan-400">
                        {Math.round(obj.score * 100)}% Match
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MAYA Detailed Answer Card */}
            <div className="flex-1 flex flex-col space-y-2 pt-2 border-t border-cyan-500/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-rajdhani uppercase text-cyan-300 tracking-wider font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  MAYA Vocalized Answer
                </span>

                {explanationText && (
                  <button
                    onClick={() => {
                      soundFx.play('click');
                      onSpeakExplanation(explanationText);
                    }}
                    className="flex items-center space-x-1 text-[10px] text-cyan-300 hover:text-white uppercase font-rajdhani border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-950/40"
                    title="Read this explanation aloud"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Re-speak</span>
                  </button>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-cyan-500/30 text-xs font-mono-code leading-relaxed text-slate-200 whitespace-pre-wrap min-h-[140px] shadow-inner">
                {explanationText || (
                  <span className="text-slate-500 italic">
                    Awaiting object lock. Show any physical object to the optical sensor, and MAYA will generate and vocalize a complete technical breakdown.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-cyan-500/20 bg-slate-950/80 flex items-center justify-between text-xs font-rajdhani">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Computer Vision Core Ready • Supports 80+ Real-World Object Classes
          </span>

          <button
            onClick={() => {
              soundFx.play('click');
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase transition-all shadow-[0_0_12px_rgba(0,240,255,0.4)]"
          >
            Close Viewport
          </button>
        </div>
      </div>
    </div>
  );
};
