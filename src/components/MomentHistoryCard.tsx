import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, MapPin, Tag, Brain, Calendar, Compass, Clock, Trash2, ArrowRight } from "lucide-react";
import { CapsuleMoment } from "../types";

interface MomentHistoryCardProps {
  moment: CapsuleMoment;
  onDelete: (id: string) => void;
  brutalistBorders: boolean;
  key?: string;
}

export default function MomentHistoryCard({
  moment,
  onDelete,
  brutalistBorders,
}: MomentHistoryCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [percentPlayed, setPercentPlayed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio and progress
  const togglePlayAudio = () => {
    if (!moment.audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(moment.audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPercentPlayed(0);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    } else {
      audioRef.current.play().catch((err) => {
        console.warn("Could not play audio:", err);
      });
      setIsPlaying(true);
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setPercentPlayed(progress || 0);
        }
      }, 50);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Format date readable
  const formattedDate = new Date(moment.timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get filter css filters string
  const getFilterStyle = (filterName: string) => {
    switch (filterName) {
      case "noire":
        return "grayscale(1) contrast(1.4) brightness(0.9)";
      case "amber":
        return "sepia(1) saturate(1.8) hue-rotate(345deg) brightness(0.95) contrast(1.15)";
      case "clay":
        return "sepia(0.6) saturate(1.4) hue-rotate(330deg) contrast(1.1)";
      case "solstice":
        return "contrast(1.5) saturate(2) hue-rotate(310deg) brightness(1.05)";
      case "raw":
      default:
        return "none";
    }
  };

  return (
    <div
      id={`moment-card-${moment.id}`}
      className={`bg-[#1A1A1A] text-[#F5F5F5] overflow-hidden group transition-all duration-300 hover:border-neutral-700 relative flex flex-col ${
        brutalistBorders ? "border-2 border-white rounded-none" : "border border-neutral-800 rounded-xl"
      }`}
    >
      {/* Decorative Stamp Tag */}
      <div className="absolute top-3 right-3 bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-[9px] font-mono select-none pointer-events-none text-neutral-500 z-10 tracking-widest uppercase">
        {moment.filter} MODE
      </div>

      {/* Industrial Header */}
      <div className="p-4 border-b border-neutral-800 bg-neutral-900/40 flex items-start justify-between gap-2">
        <div className="space-y-1">
          {/* Main Timecode styled in Space Grotesk / Monospace */}
          <h4 className="font-display font-medium tracking-tight text-[#FFBF00] text-sm md:text-base select-all">
            {moment.timecode}
          </h4>
          <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-500" /> {formattedDate}
            </span>
            {moment.location && (
              <span className="flex items-center gap-0.5 max-w-[120px] md:max-w-[200px] truncate" title={moment.location.description}>
                <MapPin className="w-3 h-3 text-[#E2725B]" />{" "}
                {moment.location.description || `${moment.location.latitude.toFixed(3)}, ${moment.location.longitude.toFixed(3)}`}
              </span>
            )}
          </div>
        </div>

        {/* Delete Moment action */}
        <button
          id={`delete-${moment.id}`}
          onClick={() => onDelete(moment.id)}
          className="p-1.5 bg-neutral-900/80 border border-neutral-800 hover:border-red-900 rounded hover:bg-red-950/20 text-neutral-500 hover:text-red-400 transition-all cursor-pointer"
          title="Apagar cápsula"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid View */}
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-neutral-800">
        {/* Photo view with active filter */}
        <div className="w-full md:w-2/5 aspect-square shrink-0 relative bg-neutral-950 flex items-center justify-center overflow-hidden">
          <img
            src={moment.photoUrl}
            alt="Momento Cápsula"
            className="w-full h-full object-cover select-none"
            style={{ filter: getFilterStyle(moment.filter) }}
          />
          {/* Film grain layer if not raw */}
          {moment.filter !== "raw" && <div className="absolute inset-0 grain pointer-events-none mix-blend-overlay" />}
          
          {/* Compass specs indicator overlay */}
          <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-1 rounded text-[9px] font-mono text-neutral-400 border border-white/5 space-y-0.5 leading-none">
            <div className="flex items-center gap-1">
              <Compass className="w-2.5 h-2.5 text-[#FFBF00]" />
              <span>RAW.GRID_101</span>
            </div>
          </div>
        </div>

        {/* Info detail content */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* User Justification / Intention */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">
                JUSTIFICATIVA REGISTRADA
              </span>
              <p className="font-sans text-sm text-neutral-200 leading-relaxed italic border-l border-neutral-800 pl-2.5 py-0.5">
                "{moment.justification || "Momento arquivado em meditação silenciosa..."}"
              </p>
            </div>

            {/* AI Reflection / Metaphor from Gemini */}
            {moment.reflection && (
              <div className="p-3 bg-neutral-900/60 rounded border border-[#FFBF00]/10 border-l-2 border-l-[#FFBF00] space-y-1.5, space-y-1">
                <span className="text-[10px] uppercase font-display font-medium tracking-wider text-[#FFBF00] flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-[#FFBF00]" /> REFLEXÃO DO ARQUIVISTA
                </span>
                <p className="font-sans text-xs text-neutral-300 leading-relaxed">
                  {moment.reflection}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {/* Audio player if vocal intent exists */}
            {moment.audioUrl && (
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center gap-3">
                <button
                  id={`play-audio-${moment.id}`}
                  onClick={togglePlayAudio}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isPlaying ? "bg-[#E2725B] text-white animate-pulse" : "bg-neutral-800 text-[#FFBF00]"
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>ÁUDIO INTENÇÃO</span>
                    <span>{isPlaying ? "REPRODUZINDO" : "ÁUDIO GRAVADO"}</span>
                  </div>
                  {/* Progress timeline bar */}
                  <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden w-full relative">
                    <div
                      className="absolute top-0 left-0 bottom-0 bg-[#E2725B] transition-all duration-300"
                      style={{ width: `${percentPlayed}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Industrial category Tags */}
            {moment.tags && moment.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <Tag className="w-3 h-3 text-[#E2725B] shrink-0" />
                {moment.tags.map((tag, tagIdx) => (
                  <span
                    key={tagIdx}
                    id={`tag-${tag}`}
                    className="px-2 py-0.5 bg-[#E2725B]/10 text-[#E2725B] rounded text-[10px] font-display font-bold uppercase border border-[#E2725B]/20"
                  >
                    {tag.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
