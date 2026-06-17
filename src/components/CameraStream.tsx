import React, { useState, useRef, useEffect } from "react";
import { Camera, RefreshCw, Upload, Sparkles, Image as ImageIcon, Trash2, Zap, Settings as SettingsIcon, AlertCircle } from "lucide-react";
import { AppSettings } from "../types";

interface CameraStreamProps {
  settings: AppSettings;
  onPhotoCaptured: (photoBase64: string) => void;
  onOpenSettings: () => void;
  brutalistBorders: boolean;
  shutterTriggerRef: React.MutableRefObject<(() => void) | null>;
  captureLoading: boolean;
}

export default function CameraStream({
  settings,
  onPhotoCaptured,
  onOpenSettings,
  brutalistBorders,
  shutterTriggerRef,
  captureLoading,
}: CameraStreamProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<"pending" | "granted" | "denied">("pending");
  const [flashMode, setFlashMode] = useState<"on" | "off" | "auto">("off");
  
  // Local state for local files or generated images
  const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Play synthesized retro camera shutter click
  const synthShutterClick = () => {
    if (!settings.shutterSound) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      // High frequency click
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(2500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
      
      gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Could not synth shutter sound:", e);
    }
  };

  // Setup actual webcamera permissions
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    async function setupCamera() {
      try {
        setPermissionState("pending");
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
        activeStream = userStream;
        setStream(userStream);
        setPermissionState("granted");
        
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
      } catch (err) {
        console.warn("Camera API permission denied or blocked inside secure iframe environment.", err);
        setPermissionState("denied");
      }
    }

    setupCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Expose the shutter action to parent via ref
  useEffect(() => {
    shutterTriggerRef.current = snapPhoto;
    return () => {
      shutterTriggerRef.current = null;
    };
  }, [stream, permissionState, localFileUrl, settings, flashMode]);

  const snapPhoto = () => {
    if (captureLoading) return;
    
    // Sound playback
    synthShutterClick();

    // Trigger visual white light flash glare
    setIsFlashActive(true);
    setTimeout(() => {
      setIsFlashActive(false);
    }, 180);

    // Vibration feedback if settings toggled
    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(80);
    }

    // Capture logic
    if (permissionState === "granted" && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight) || 640;
      
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw centered squared frame
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        onPhotoCaptured(dataUrl);
      }
    } else if (localFileUrl) {
      // Return selected image base64
      onPhotoCaptured(localFileUrl);
    } else {
      // Capture simulated architectural camera pattern
      generateSimulatedCapture();
    }
  };

  const generateSimulatedCapture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Create cozy futuristic architectural background
      const grad = ctx.createLinearGradient(0, 0, 640, 640);
      grad.addColorStop(0, "#121212");
      grad.addColorStop(0.5, "#252528");
      grad.addColorStop(1, "#18181a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 640);

      // Draw structured grid / brutalist shadow layers to mimic screenshot
      ctx.strokeStyle = "rgba(255, 191, 0, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 240);
      ctx.lineTo(520, 240);
      ctx.lineTo(520, 480);
      ctx.lineTo(120, 480);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = "rgba(40, 40, 40, 0.7)";
      ctx.fillRect(160, 280, 240, 140);
      
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(320, 0); ctx.lineTo(320, 640);
      ctx.moveTo(0, 320); ctx.lineTo(640, 320);
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw amber center cross
      ctx.strokeStyle = "#FFBF00";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(310, 320); ctx.lineTo(330, 320);
      ctx.moveTo(320, 310); ctx.lineTo(320, 330);
      ctx.stroke();

      const base64 = canvas.toDataURL("image/jpeg", 0.85);
      onPhotoCaptured(base64);
    }
  };

  // Drag and drop mechanics for image files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecione apenas arquivos de imagem.");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setLocalFileUrl(reader.result as string);
    };
  };

  return (
    <div id="camera-stream-wrapper" className="flex flex-col gap-3 w-full">
      {/* Viewport Box */}
      <div
        id="camera-viewport-box"
        className={`relative aspect-square w-full bg-neutral-950/90 overflow-hidden flex items-center justify-center ${
          brutalistBorders ? "border-3 border-white rounded-none" : "border border-neutral-800 rounded-2xl"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {/* Flash glare animation frame */}
        {isFlashActive && (
          <div id="flash-glare" className="absolute inset-0 bg-white z-40 animate-fade-out" style={{ animationDuration: "180ms" }} />
        )}

        {/* Real video feed */}
        {permissionState === "granted" && !localFileUrl && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
            id="camera-video-node"
          />
        )}

        {/* Local uploaded file display */}
        {localFileUrl && (
          <div id="local-preview-frame" className="absolute inset-0">
            <img src={localFileUrl} alt="Visualização Cápsula" className="w-full h-full object-cover" />
            <button
              id="clear-loaded-image"
              onClick={() => setLocalFileUrl(null)}
              className="absolute bottom-3 right-3 p-2 bg-black/80 rounded border border-neutral-800 text-red-400 hover:text-red-300 hover:bg-black/90 transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> RETIRAR MIDIA
            </button>
          </div>
        )}

        {/* Simulated Architectural Grid Backdrop if no camera */}
        {permissionState !== "granted" && !localFileUrl && (
          <div id="simulated-view-stage" className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#161616] via-[#101010] to-[#141414] select-none text-center">
            {/* Architectural structural shapes representing "Cápsula" visual template */}
            <div className="absolute inset-0 opacity-15 overflow-hidden flex flex-col justify-between p-4 font-mono text-[9px] text-[#FFBF00] pointer-events-none">
              <div className="flex justify-between">
                <span>GRID: LATENT_SPACE</span>
                <span>ISO 200 / F1.8</span>
              </div>
              <div className="space-y-1 align-bottom text-right">
                <p>SIM_MATRIX // ONLINE</p>
                <p>HOLD INTENT TO ENGAGE</p>
              </div>
            </div>

            {/* Brutalist geometric design elements */}
            <div className="w-2/3 h-1/2 border border-dashed border-neutral-800 rounded flex flex-col items-center justify-center gap-3 relative bg-neutral-900/50 p-4">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-950 px-2 text-[9px] font-mono text-amber-500 tracking-wider">
                TEMPORADA DE MOMENTOS
              </div>
              <ImageIcon className="w-8 h-8 text-[#FFBF00]/60 animate-pulse" />
              <p className="text-xs text-neutral-300 font-sans font-medium px-4">
                Arraste uma foto aqui ou tire uma captura do seletor inteligente
              </p>
            </div>

            {/* Upload Selector */}
            <button
              id="upload-file-selector"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/80 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#FFBF00]" />
              ESCOLHER FOTO LOCAL
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="hidden-file-input"
            />
          </div>
        )}

        {/* Corner Brackets exactly like the image `[ ]` */}
        <div className="absolute inset-4 pointer-events-none z-10 select-none">
          {/* Top-left */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white" />
          {/* Top-right */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white" />
          {/* Bottom-left */}
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white" />
          {/* Bottom-right */}
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white" />
        </div>

        {/* Centered Crosshair exact representation `+` */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
          <div className="w-6 h-6 flex items-center justify-center relative">
            <div className="absolute w-5 h-0.5 bg-[#FFBF00]" />
            <div className="absolute h-5 w-0.5 bg-[#FFBF00]" />
          </div>
        </div>

        {/* Flash Mode controller overlay (Lightning Bolt) */}
        <button
          id="toggle-flash-btn"
          onClick={() => {
            const nextMode = flashMode === "off" ? "on" : flashMode === "on" ? "auto" : "off";
            setFlashMode(nextMode);
          }}
          className={`absolute top-4 left-4 p-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-md transition-colors hover:bg-black/80 text-white z-20 cursor-pointer flex items-center gap-1.5`}
        >
          <Zap className={`w-4 h-4 ${flashMode !== "off" ? "text-[#FFBF00] fill-[#FFBF00]" : "text-neutral-400"}`} />
          {flashMode !== "off" && (
            <span className="text-[10px] font-mono leading-none tracking-widest text-[#FFBF00]">
              {flashMode.toUpperCase()}
            </span>
          )}
        </button>

        {/* Settings modal gear toggle */}
        <button
          id="open-settings-overlay-btn"
          onClick={onOpenSettings}
          className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-md hover:bg-black/80 text-neutral-300 hover:text-white transition-colors z-20 cursor-pointer"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Hidden storage for capture drawing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Warning if camera permission was denied */}
      {permissionState === "denied" && !localFileUrl && (
        <div className="flex items-start gap-2 p-3 bg-[#1A1A1A] border border-neutral-800 rounded-lg text-xs text-neutral-400">
          <AlertCircle className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block text-neutral-200">Simulador de Cápsula Ativo</span>
            <span>
              O navegador bloqueou o acesso físico à câmera no iframe. Você pode fazer upload de fotos ou simplesmente clicar no botão de captura para gerar arte brutalista!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
