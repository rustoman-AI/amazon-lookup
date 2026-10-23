import React, { useState } from 'react';
import { 
  Tv, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Mic, 
  Play, 
  Pause,
  Sparkles,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface FireTvRemoteWidgetProps {
  isPlaying: boolean;
  isAiOverlayActive: boolean;
  onPlayPause: () => void;
  onShopScene: () => void;
  onNavigateLeft: () => void;
  onNavigateRight: () => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onSelect: () => void;
  onBack: () => void;
  onTriggerMic: () => void;
}

export const FireTvRemoteWidget: React.FC<FireTvRemoteWidgetProps> = ({
  isPlaying,
  isAiOverlayActive,
  onPlayPause,
  onShopScene,
  onNavigateLeft,
  onNavigateRight,
  onNavigateUp,
  onNavigateDown,
  onSelect,
  onBack,
  onTriggerMic,
}) => {
  // Default to the compact pill so the remote never covers the video HUD
  // ("Load Local MP4") or the bottom-left Alexa voice toast. Users expand it
  // on demand.
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="fixed top-24 left-6 z-50 select-none">
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#131921]/95 text-cyan-300 border border-cyan-500/40 shadow-2xl backdrop-blur-xl hover:border-amber-400 hover:text-amber-400 transition-all font-mono text-xs font-bold"
        >
          <Tv className="w-4 h-4 text-[#FFA41C]" />
          <span>Fire TV / Vega Remote</span>
          <Maximize2 className="w-3.5 h-3.5 ml-1 text-gray-400" />
        </button>
      ) : (
        <div className="w-64 p-4 rounded-3xl bg-[#0e131d]/95 border border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFA41C] animate-pulse" />
              <span className="text-xs font-black tracking-widest text-white uppercase font-mono">
                Fire TV & Vega Remote
              </span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
              title="Minimize Remote"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alexa Voice Mic Button */}
          <div className="my-3 flex justify-center">
            <button
              onClick={onTriggerMic}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00A8E1] to-[#00CAFF] hover:brightness-110 text-black flex items-center justify-center shadow-[0_0_15px_rgba(0,202,255,0.6)] active:scale-95 transition-all"
              title="Alexa Voice Push"
            >
              <Mic className="w-6 h-6 text-black" />
            </button>
          </div>

          {/* D-Pad Circle */}
          <div className="my-2 relative w-36 h-36 mx-auto rounded-full bg-[#161d2a] border border-white/10 flex items-center justify-center shadow-inner">
            {/* UP */}
            <button
              onClick={onNavigateUp}
              className="absolute top-1 left-1/2 -translate-x-1/2 p-2 text-gray-300 hover:text-[#FFA41C] active:scale-90 transition-all"
              title="Arrow Up (Exact Match)"
            >
              <ChevronUp className="w-5 h-5" />
            </button>

            {/* DOWN */}
            <button
              onClick={onNavigateDown}
              className="absolute bottom-1 left-1/2 -translate-x-1/2 p-2 text-gray-300 hover:text-cyan-400 active:scale-90 transition-all"
              title="Arrow Down (Budget Alternative)"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            {/* LEFT */}
            <button
              onClick={onNavigateLeft}
              className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-[#FFA41C] active:scale-90 transition-all"
              title="Arrow Left (Previous Box)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* RIGHT */}
            <button
              onClick={onNavigateRight}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-[#FFA41C] active:scale-90 transition-all"
              title="Arrow Right (Next Box)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* CENTER SELECT / ENTER */}
            <button
              onClick={onSelect}
              className="w-14 h-14 rounded-full bg-[#20293a] border border-[#FFA41C]/40 text-amber-400 font-extrabold text-[11px] flex flex-col items-center justify-center shadow-[0_0_15px_rgba(255,164,28,0.3)] active:scale-95 transition-all hover:bg-amber-500/20"
              title="Select / Enter"
            >
              <span>SELECT</span>
            </button>
          </div>

          {/* Action Row */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={onBack}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono flex items-center justify-center gap-1 text-gray-300 active:scale-95 transition-all"
              title="Back / Escape"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={onPlayPause}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono flex items-center justify-center gap-1 text-gray-300 active:scale-95 transition-all"
              title="Play / Pause (Space / F4 / MediaPlayPause)"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </div>

          {/* Big "Shop Scene" Remote Button */}
          <button
            onClick={onShopScene}
            className={`mt-2.5 w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isAiOverlayActive
                ? 'bg-amber-500/20 text-[#FFA41C] border border-[#FFA41C]'
                : 'bg-gradient-to-r from-[#FF9900] to-[#FFA41C] text-black shadow-[0_0_20px_rgba(255,164,28,0.5)]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>{isAiOverlayActive ? 'Rescan Scene' : 'Shop Scene [S]'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
