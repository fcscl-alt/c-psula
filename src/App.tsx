import React, { useState, useEffect, useRef } from "react";
import { Camera, History, Zap, Settings as SettingsIcon, Mic, Keyboard, Play, RefreshCw, Send, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import { CapsuleMoment, AppSettings } from "./types";
import CameraStream from "./components/CameraStream";
import AudioIntentRecorder from "./components/AudioIntentRecorder";
import MomentHistoryCard from "./components/MomentHistoryCard";
import SettingsModal from "./components/SettingsModal";
import { processPhotoWithGemini } from "./lib/ai";
import { saveMomentToSupabase } from "./lib/db";

export default function App() {
  // Navigation tabs: "capture" | "history" as requested
  const [currentTab, setCurrentTab] = useState<"capture" | "history">("capture");
  
  // App states
  const [moments, setMoments] = useState<CapsuleMoment[]>([]);
  const [justification, setJustification] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  
  // Mode selection: text or microphone voice layout
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"raw" | "noire" | "amber" | "clay" | "solstice">("raw");
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number; description?: string } | undefined>(undefined);

  // Settings state with Friendly Brutalist default parameters
  const [settings, setSettings] = useState<AppSettings>({
    vibrationEnabled: true,
    shutterSound: true,
    brutalistBorders: true,
    filterIntensity: 85,
    aiAssistedTags: true,
    defaultFilter: "raw",
  });

  const shutterTriggerRef = useRef<(() => void) | null>(null);

  // Read archived moments and configuration specs from localStorage on load
  useEffect(() => {
    try {
      const storedMoments = localStorage.getItem("capsula_moments_archive");
      if (storedMoments) {
        setMoments(JSON.parse(storedMoments));
      }
      
      const storedSettings = localStorage.getItem("capsula_app_settings");
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
        setActiveFilter(parsed.defaultFilter);
      }
    } catch (e) {
      console.error("Local storage lookup failed on start:", e);
    }

    // Try to gather location coordinates from hardware
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Format coordinates
          setLocationCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            description: "Coordenadas Locais"
          });
        },
        (error) => {
          // Fallback to random poetic coordinates to match editorial mood
          console.log("Using poetic default coords due to denied permission inside applet frame.");
          setLocationCoords({
            latitude: -23.55052,
            longitude: -46.633308,
            description: "São Paulo, SP"
          });
        }
      );
    }
  }, []);

  // Sync settings of default filters
  useEffect(() => {
    setActiveFilter(settings.defaultFilter);
  }, [settings.defaultFilter]);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem("capsula_app_settings", JSON.stringify(newSettings));
  };

  const handleClearHistory = () => {
    setMoments([]);
    localStorage.removeItem("capsula_moments_archive");
    setIsSettingsOpen(false);
  };

  const handleDeleteMoment = (id: string) => {
    const nextList = moments.filter((m) => m.id !== id);
    setMoments(nextList);
    localStorage.setItem("capsula_moments_archive", JSON.stringify(nextList));
  };

  // When sound note is recorded successfully from microphone
  const handleAudioRecorded = (base64Audio: string, durationSec: number) => {
    setAudioUrl(base64Audio);
    setAudioDuration(durationSec);
    
    // Automatically trigger reflection analyzer or translate audio context
    if (justification.trim() === "") {
      setJustification(`Áudio intenção de ${durationSec}s`);
    }
  };

  // Take photo action
  const triggerCapture = () => {
    if (shutterTriggerRef.current) {
      shutterTriggerRef.current();
    }
  };

  // Callback when CameraStream snaps image
  const handlePhotoCaptured = async (photoBase64: string) => {
    setCaptureLoading(true);
    
    // Industrial code generator representation CAP-[YYYY.MM.DD]-[HH.MM.SS]
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const datesCode = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
    const timesCode = `${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
    const timecode = `CAP-${datesCode}-${timesCode}`;
    const uniqueId = `mom_${Date.now()}`;

    let title = "Momento capturado";
    let reflection = `Momento arquivado na cápsula: "${justification || "Em meditação silenciosa..."}"`;
    let tagsList = ["ATENÇÃO", "PRESENTE", "REGISTRO"];

    if (settings.aiAssistedTags) {
      try {
        const aiResult = await processPhotoWithGemini(photoBase64, justification || undefined);
        title = aiResult.title;
        reflection = aiResult.reflection;
      } catch (err) {
        console.warn("Erro ao processar foto com Gemini, usando fallback local:", err);
      }
    }

    // Capture geolocation coordinates description or default coordinates
    const geo = locationCoords || {
      latitude: -12.981,
      longitude: -38.291,
      description: "Salvador, BA"
    };

    const newMoment: CapsuleMoment = {
      id: uniqueId,
      timestamp: now.toISOString(),
      timecode,
      photoUrl: photoBase64,
      justification: justification || "Preservação silenciosa.",
      audioUrl: audioUrl,
      reflection,
      tags: tagsList,
      filter: activeFilter,
      location: geo,
    };

    try {
      await saveMomentToSupabase({
        title,
        reflection,
        description: justification || "Preservação silenciosa.",
        photo: photoBase64,
      });
    } catch (err) {
      console.error("Erro ao salvar no Supabase:", err);
    }

    const updatedMoments = [newMoment, ...moments];
    setMoments(updatedMoments);

    // Reset snap indicadores
    setJustification("");
    setAudioUrl(undefined);
    setAudioDuration(0);
    setCaptureLoading(false);
    
    // Transition nicely to historical moments view immediately to see captured block
    setTimeout(() => {
      setCurrentTab("history");
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-0 sm:p-4 text-[#F5F5F5] font-sans selection:bg-[#FFBF00] selection:text-[#121212]">
      {/* Container Device Wrapper simulating elegant modern physical smartphone framed in center */}
      <div
        className={`w-full max-w-[480px] bg-[#121212] min-h-screen sm:min-h-[850px] flex flex-col justify-between shadow-2xl relative ${
          settings.brutalistBorders ? "sm:border-4 sm:border-white" : "sm:border sm:border-neutral-800 sm:rounded-3xl"
        } overflow-hidden`}
      >
        {/* Dynamic visual light glare backdrop */}
        <div className="absolute inset-0 bg-[#FFBF00]/2 pointer-events-none" />

        {/* Top bar header section */}
        <header className="p-4 border-b border-neutral-800/80 bg-neutral-950/40 backdrop-blur flex items-center justify-between sticky top-0 z-30">
          {/* Lightning status / layout mode */}
          <div className="flex items-center gap-1">
            <Zap className="w-5 h-5 text-[#FFBF00] fill-[#FFBF00] animate-pulse" />
            <span className="text-[10px] font-mono text-[#FFBF00] font-bold tracking-widest hidden xs:inline">
              SYS_ON
            </span>
          </div>

          {/* Central Title exactly like wireframe (Space Grotesk style) */}
          <h1 className="font-display font-bold text-xl tracking-tight text-white flex items-center gap-1 justify-center">
            Cápsula
          </h1>

          {/* Settings Toggle Trigger */}
          <button
            id="nav-settings-btn"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 hover:bg-neutral-900 rounded text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Abrir configurações"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </header>

        {/* Primary Screen Area based on Selected Tab */}
        <main className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {currentTab === "capture" ? (
            <div id="capture-tab-view" className="space-y-6 animate-fade-in">
              
              {/* Filter mode carousel selection directly above camera */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                  FILTRO ATIVO DE ESTUDO
                </span>
                <div className="flex gap-1.5">
                  {(["raw", "noire", "amber", "clay", "solstice"] as const).map((filterId) => (
                    <button
                      key={filterId}
                      id={`active-filter-select-${filterId}`}
                      onClick={() => setActiveFilter(filterId)}
                      className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                        activeFilter === filterId
                          ? "bg-[#FFBF00] text-[#121212]"
                          : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                      }`}
                    >
                      {filterId}
                    </button>
                  ))}
                </div>
              </div>

              {/* Viewport Frame component */}
              <CameraStream
                settings={settings}
                onPhotoCaptured={handlePhotoCaptured}
                onOpenSettings={() => setIsSettingsOpen(true)}
                brutalistBorders={settings.brutalistBorders}
                shutterTriggerRef={shutterTriggerRef}
                captureLoading={captureLoading}
              />

              {/* Input section: Hold to record intent or type justification */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                    INTENÇÃO & JUSTIFICATIVA
                  </span>
                  
                  {/* Toggle between typing and voice recording */}
                  <div className="flex gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-900">
                    <button
                      id="use-text-mode"
                      onClick={() => setInputMode("text")}
                      className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                        inputMode === "text" ? "bg-neutral-800 text-[#FFBF00]" : "text-neutral-400 hover:text-white"
                      }`}
                      title="Utilizar teclado físico"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id="use-voice-mode"
                      onClick={() => setInputMode("voice")}
                      className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                        inputMode === "voice" ? "bg-neutral-800 text-[#FFBF00]" : "text-neutral-400 hover:text-white"
                      }`}
                      title="Utilizar captação de voz"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Switchable active input widget */}
                {inputMode === "text" ? (
                  <div
                    id="text-input-box"
                    className={`bg-[#1A1A1A] p-2 flex items-center justify-between transition-all ${
                      settings.brutalistBorders ? "border-2 border-white rounded-none" : "border border-neutral-800 rounded-xl"
                    } hover:border-[#FFBF00]`}
                  >
                    <input
                      id="justification-input"
                      type="text"
                      className="bg-transparent text-sm text-white focus:outline-none flex-1 font-sans placeholder-neutral-500 px-2 leading-relaxed"
                      placeholder="Hold to record intent or type justification"
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                    />
                    <button
                      id="confirm-text-btn"
                      onClick={() => {
                        if (justification.trim() !== "") {
                          // Mini click trigger
                          const original = justification;
                          setJustification(original + " ✓");
                        }
                      }}
                      className="p-1 px-2 text-neutral-400 hover:text-[#FFBF00] transition-colors cursor-pointer"
                      title="Gravar justificativa"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <AudioIntentRecorder
                    onAudioRecorded={handleAudioRecorded}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    brutalistBorders={settings.brutalistBorders}
                  />
                )}

                {/* Small indicator if audio context matches */}
                {audioUrl && (
                  <div className="flex items-center gap-1.5 p-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-emerald-400 animate-fade-in font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ÁUDIO CONFIGURADO ({audioDuration}S). INTENÇÃO SALVA!</span>
                  </div>
                )}
              </div>

              {/* Large Yellow double circle Capture Button Section */}
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                {/* Physical Double circle design */}
                <button
                  id="main-capture-button"
                  onClick={triggerCapture}
                  disabled={captureLoading}
                  className="relative group transition-transform focus:outline-none cursor-pointer"
                >
                  {/* Outer circle ring */}
                  <div className="w-[84px] h-[84px] rounded-full border-4 border-neutral-850/80 bg-neutral-950/60 flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-[#FFBF00]/30">
                    {/* Inner circle yellow center button */}
                    <div className="w-16 h-16 rounded-full border border-neutral-950 bg-[#FFBF00] transition-all group-active:scale-95 flex items-center justify-center amber-glow" />
                  </div>
                </button>
                <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">
                  REGISTRAR INSTANTE
                </span>
              </div>
            </div>
          ) : (
            /* Historical view / Archive list */
            <div id="history-tab-view" className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                  RELAÇÃO DE ACERVO LOCAL
                </span>
                <span className="font-mono text-xs text-neutral-400">
                  {moments.length} CÁPSULAS SALVAS
                </span>
              </div>

              {moments.length === 0 ? (
                <div className="text-center py-16 p-6 bg-[#1A1A1A]/50 rounded-xl border border-dashed border-neutral-800 space-y-4">
                  <div className="text-neutral-600 font-mono text-[10px] tracking-widest flex justify-center">
                    CÁPSULA_V_ZERO.NULL
                  </div>
                  <HelpCircle className="w-10 h-10 text-neutral-700 mx-auto" />
                  <p className="text-sm text-neutral-400 font-sans max-w-xs mx-auto leading-relaxed">
                    Nenhum momento arquivado. Vá para a tela de captura, documente sua intenção e congele seu primeiro instante!
                  </p>
                  <button
                    id="return-capture-tab"
                    onClick={() => setCurrentTab("capture")}
                    className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold rounded text-[#FFBF00] transition-colors cursor-pointer"
                  >
                    ACESSAR CAPTURA
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {moments.map((mom) => (
                    <MomentHistoryCard
                      key={mom.id}
                      moment={mom}
                      onDelete={handleDeleteMoment}
                      brutalistBorders={settings.brutalistBorders}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Global Loading screen transition overlay */}
        {captureLoading && (
          <div id="capture-loading-screen" className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 space-y-4">
            <RefreshCw className="w-8 h-8 text-[#FFBF00] animate-spin" />
            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-[#FFBF00] text-sm uppercase tracking-wider">
                Congelando no Tempo
              </h3>
              <p className="font-sans text-xs text-neutral-400 max-w-xs leading-relaxed">
                O Archivist está analisando os dados visuais e gerando reflexões conscientes sobre a sua intenção...
              </p>
            </div>
          </div>
        )}

        {/* Settings Modal Component details */}
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={saveSettings}
            onClose={() => setIsSettingsOpen(false)}
            onClearHistory={handleClearHistory}
            historyCount={moments.length}
          />
        )}

        {/* Nav Bar Controls at bottom (Capture and History options) */}
        <footer className="bg-neutral-950 border-t border-neutral-800 flex items-center justify-around py-3 sticky bottom-0 z-30">
          <button
            id="tab-capture"
            onClick={() => setCurrentTab("capture")}
            className={`flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer px-6 py-1`}
          >
            <Camera className={`w-5 h-5 ${currentTab === "capture" ? "text-[#FFBF00]" : "text-neutral-500"}`} />
            <span
              className={`font-display text-xs tracking-wider transition-colors font-bold ${
                currentTab === "capture" ? "text-[#FFBF00]" : "text-neutral-500"
              }`}
            >
              Capture
            </span>
          </button>

          <button
            id="tab-history"
            onClick={() => setCurrentTab("history")}
            className={`flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer px-6 py-1`}
          >
            <History className={`w-5 h-5 ${currentTab === "history" ? "text-[#FFBF00]" : "text-neutral-500"}`} />
            <span
              className={`font-display text-xs tracking-wider transition-colors font-bold ${
                currentTab === "history" ? "text-[#FFBF00]" : "text-neutral-500"
              }`}
            >
              History
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
}
