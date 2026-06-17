import React from "react";
import { X, Volume2, Key, Sliders, RefreshCw, Trash2, ShieldCheck, Heart } from "lucide-react";
import { AppSettings } from "../types";

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
  onClearHistory: () => void;
  historyCount: number;
}

export default function SettingsModal({
  settings,
  onUpdateSettings,
  onClose,
  onClearHistory,
  historyCount,
}: SettingsModalProps) {
  const toggleSetting = (key: keyof Omit<AppSettings, "filterIntensity" | "defaultFilter">) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleFilterChange = (val: AppSettings["defaultFilter"]) => {
    onUpdateSettings({
      ...settings,
      defaultFilter: val,
    });
  };

  return (
    <div id="settings-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        id="settings-container"
        className={`w-full max-w-md bg-[#1A1A1A] text-[#F5F5F5] overflow-hidden ${
          settings.brutalistBorders ? "border-3 border-white rounded-none" : "border border-neutral-800 rounded-2xl"
        } shadow-2xl amber-glow`}
      >
        {/* Header */}
        <div id="settings-header" className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#FFBF00]" />
            <h2 className="font-display font-medium tracking-tight text-lg text-white">
              CÁPSULA // CONFIGS
            </h2>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="p-1 px-2 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div id="settings-body" className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick instructions / Brand alignment */}
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs leading-relaxed text-neutral-400 space-y-1">
            <p className="font-display font-bold text-neutral-300">ESTÉTICA FRIENDLY BRUTALIST</p>
            <p>
              Cápsula é uma ferramenta de arquivamento consciente. Todo registro visual requer intenção, 
              gerando blocos de tempos industriais perpétuos.
            </p>
          </div>

          {/* Setting option: Borders */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-[#E2725B]">
              Experiência Visual & Som
            </h3>

            {/* Brutalist design */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900/40 transition-colors">
              <div className="space-y-0.5">
                <span className="text-sm font-medium block">Bordas Brutalistas Pesadas</span>
                <span className="text-xs text-neutral-400 block">Ativa bordas sólidas de 3px e cantos retos</span>
              </div>
              <button
                id="toggle-brutalist-borders"
                onClick={() => toggleSetting("brutalistBorders")}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.brutalistBorders ? "bg-[#FFBF00]" : "bg-neutral-800"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-[#121212] transition-transform ${
                    settings.brutalistBorders ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Sound effects */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900/40 transition-colors">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold flex items-center gap-1">
                  Efeito de Obturador <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                </span>
                <span className="text-xs text-neutral-400 block">Sons mecânicos ao registrar momentos</span>
              </div>
              <button
                id="toggle-shutter-sound"
                onClick={() => toggleSetting("shutterSound")}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.shutterSound ? "bg-[#FFBF00]" : "bg-neutral-800"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-[#121212] transition-transform ${
                    settings.shutterSound ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* AI assisted tags */}
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900/40 transition-colors">
              <div className="space-y-0.5">
                <span className="text-sm font-medium">Análise de IA (Gemini)</span>
                <span className="text-xs text-neutral-400 block">Gera reflexões metafóricas e tags industriais</span>
              </div>
              <button
                id="toggle-ai-tags"
                onClick={() => toggleSetting("aiAssistedTags")}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.aiAssistedTags ? "bg-[#FFBF00]" : "bg-neutral-800"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-[#121212] transition-transform ${
                    settings.aiAssistedTags ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Setting option: Default filters */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-[#E2725B]">
              Filtro Padrão de Revelação
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "raw", name: "RAW Original" },
                { id: "noire", name: "NOIRE (Grão P&B)" },
                { id: "amber", name: "AMBER (Halftone Gold)" },
                { id: "clay", name: "CLAY (Argila Quente)" },
                { id: "solstice", name: "SOLSTICE (Alto Contraste)" },
              ].map((filt) => (
                <button
                  key={filt.id}
                  id={`filter-opt-${filt.id}`}
                  onClick={() => handleFilterChange(filt.id as AppSettings["defaultFilter"])}
                  className={`p-2.5 text-left border rounded transition-all cursor-pointer ${
                    settings.defaultFilter === filt.id
                      ? "bg-[#FFBF00]/10 border-[#FFBF00] text-[#FFBF00] font-semibold"
                      : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                  }`}
                >
                  {filt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Setting option: Archive administration */}
          <div className="space-y-3 pt-2">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-red-400">
              Administração de Memória
            </h3>
            <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Momentos arquivados na cápsula:</span>
                <span className="font-mono bg-neutral-900 px-2 py-0.5 rounded text-red-400 font-bold">
                  {historyCount} REGISTROS
                </span>
              </div>
              <button
                id="clear-archive-btn"
                onClick={() => {
                  if (confirm("Tem certeza que deseja apagar todo o acervo da Cápsula? Esta ação é irreversível.")) {
                    onClearHistory();
                  }
                }}
                disabled={historyCount === 0}
                className={`w-full py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold rounded brutalist-button border cursor-pointer border-red-800/80 bg-red-900/10 hover:bg-red-900/30 text-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Trash2 className="w-4 h-4" />
                LIMPAR TODO O ACERVO LOCAL
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div id="settings-footer" className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" /> LOCAL DATA PERSISTENCE
          </span>
          <span className="flex items-center gap-1">
            CÁPSULA v1.2.0 <Heart className="w-3 h-3 text-[#E2725B]" />
          </span>
        </div>
      </div>
    </div>
  );
}
