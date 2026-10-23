import React from 'react';
import { 
  Tv, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  CornerDownLeft, 
  RotateCcw, 
  X,
  QrCode
} from 'lucide-react';

interface RemoteNavigationGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemoteNavigationGuide: React.FC<RemoteNavigationGuideProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-2xl p-8 rounded-3xl bg-[#0c1017] border border-cyan-500/30 shadow-[0_0_60px_rgba(0,202,255,0.3)] text-gray-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#FFA41C]">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Unified Fire TV & Vega OS Remote Input
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Supports Fire OS WebView, Vega OS WebView, and host TV simulators simultaneously
            </p>
          </div>
        </div>

        {/* Shortcut Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {/* 1. Left/Right */}
          <div className="p-4 rounded-2xl bg-[#131922] border border-white/5 flex items-start gap-3">
            <div className="flex items-center gap-1 p-2 rounded-xl bg-black/50 text-[#FFA41C] border border-amber-500/30">
              <ArrowLeft className="w-4 h-4" />
              <ArrowRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">D-Pad Left / Right</div>
              <div className="text-[11px] text-cyan-300 font-mono">keyCode 37/21 or 39/22</div>
              <div className="text-xs text-gray-400 mt-1 leading-snug">
                Cycle active focus between detected bounding boxes on the paused TV screen.
              </div>
            </div>
          </div>

          {/* 2. Up/Down */}
          <div className="p-4 rounded-2xl bg-[#131922] border border-white/5 flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-black/50 text-cyan-400 border border-cyan-500/30">
              <ArrowUp className="w-3.5 h-3.5" />
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">D-Pad Up / Down</div>
              <div className="text-[11px] text-cyan-300 font-mono">keyCode 38/19 or 40/20</div>
              <div className="text-xs text-gray-400 mt-1 leading-snug">
                Toggle between <span className="text-amber-400 font-semibold">Exact Match</span> and <span className="text-cyan-300 font-semibold">Budget "Get The Look"</span> tabs.
              </div>
            </div>
          </div>

          {/* 3. Enter/Select */}
          <div className="p-4 rounded-2xl bg-[#131922] border border-white/5 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-black/50 text-emerald-400 border border-emerald-500/30">
              <CornerDownLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Select / Enter</div>
              <div className="text-[11px] text-cyan-300 font-mono">keyCode 13 or 23</div>
              <div className="text-xs text-gray-400 mt-1 leading-snug">
                If playing: pause & trigger AI Frame Scan; if overlay open: trigger "Send to Alexa+ / Amazon Cart".
              </div>
            </div>
          </div>

          {/* 4. Play/Pause */}
          <div className="p-4 rounded-2xl bg-[#131922] border border-white/5 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-black/50 text-amber-400 border border-amber-500/30 font-mono font-black text-xs">
              [⏯]
            </div>
            <div>
              <div className="text-sm font-bold text-white">Play / Pause Media Key</div>
              <div className="text-[11px] text-cyan-300 font-mono">keyCode 179 / 85 / F4 / Space</div>
              <div className="text-xs text-gray-400 mt-1 leading-snug">
                Toggle playback and trigger instant AI Amazon LookUp scan.
              </div>
            </div>
          </div>

          {/* 5. Back */}
          <div className="p-4 rounded-2xl bg-[#131922] border border-white/5 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-black/50 text-red-400 border border-red-500/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Back Button</div>
              <div className="text-[11px] text-cyan-300 font-mono">keyCode 4 / 27 / Escape / Backspace</div>
              <div className="text-xs text-gray-400 mt-1 leading-snug">
                Dismiss the AI commerce overlay and immediately resume video playback.
              </div>
            </div>
          </div>

          {/* 6. Phone QR */}
          <div className="p-4 rounded-2xl bg-[#131922] border border-white/5 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-black/50 text-purple-400 border border-purple-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Instant Amazon QR Handoff</div>
              <div className="text-[11px] text-cyan-300 font-mono">https://www.amazon.com/dp/ASIN</div>
              <div className="text-xs text-gray-400 mt-1 leading-snug">
                Scan with phone camera to open directly in the Amazon Shopping App.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span>Click the Fire TV Remote widget in the bottom-left corner to test interactively!</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-extrabold hover:bg-amber-400 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
