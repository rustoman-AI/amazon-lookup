import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  Film,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { AppMode, VideoChannel } from '../types';
import { CHANNELS } from '../data/mockData';
import { checkBackendHealth, API_BASE } from '../services/aiService';

interface DeveloperControlsProps {
  mode: AppMode;
  onToggleMode: (newMode: AppMode) => void;
  selectedChannel: VideoChannel;
  onSelectChannel: (channel: VideoChannel) => void;
  onPrevChannel: () => void;
  onNextChannel: () => void;
  onOpenHelp: () => void;
}

export const DeveloperControls: React.FC<DeveloperControlsProps> = ({
  mode,
  onToggleMode,
  selectedChannel,
  onSelectChannel,
  onPrevChannel,
  onNextChannel,
  onOpenHelp,
}) => {
  const [backendStatus, setBackendStatus] = useState<{ online: boolean; message: string }>({
    online: false,
    message: 'Checking...',
  });
  const [showChannelMenu, setShowChannelMenu] = useState(false);

  useEffect(() => {
    checkBackendHealth().then(setBackendStatus);
    const interval = setInterval(() => {
      checkBackendHealth().then(setBackendStatus);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header 
      aria-label="Amazon LookUp Top Developer Controls"
      className="absolute top-0 left-0 right-0 z-30 px-3 py-1.5 flex items-center justify-between gap-2 bg-gradient-to-b from-[#06080d]/95 via-[#06080d]/60 to-transparent pointer-events-auto select-none text-xs"
    >
      {/* Left: Brand + Demo Mode Switch */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Logo — camera-target / X-Ray lens mark */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF9900] to-[#FFA41C] flex items-center justify-center shadow-[0_0_12px_rgba(255,164,28,0.6)] flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="#0c0f17"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* X-Ray camera-target reticle: outer lens, crosshair ticks, focused center */}
              <circle cx="12" cy="12" r="8.5" />
              <circle cx="12" cy="12" r="3" fill="#0c0f17" stroke="none" />
              <line x1="12" y1="1.5" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="22.5" />
              <line x1="1.5" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="22.5" y2="12" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-black tracking-tight text-white whitespace-nowrap">
                Amazon <span className="text-[#FF9900]">LookUp</span>
              </span>
              <span className="hidden md:inline px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 text-[9px] font-mono font-bold whitespace-nowrap">
                AI Shoppable TV X-Ray
              </span>
            </div>
            <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap hidden sm:inline">
              See It. Pause It. LookUp on Amazon • Fire TV &amp; Vega OS
            </span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-white/15" />

        {/* Built-in Demo Mode Switch: [Mode: Live Bedrock API | Instant Demo Cache] */}
        <div className="flex items-center rounded-full bg-[#131921]/90 border border-white/15 p-1 shadow-lg backdrop-blur-md">
          <button
            onClick={() => onToggleMode('live')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              mode === 'live'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-gray-400 hover:text-white'
            }`}
            title={`Calls ${API_BASE}/api/analyze-frame with smart fallback`}
          >
            <span className={`w-2 h-2 rounded-full ${backendStatus.online ? 'bg-emerald-300' : 'bg-amber-400'} animate-pulse`} />
            <span>Live Bedrock API</span>
          </button>

          <button
            onClick={() => onToggleMode('demo')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              mode === 'demo'
                ? 'bg-gradient-to-r from-[#FF9900] to-[#FFA41C] text-black shadow-[0_0_12px_rgba(255,164,28,0.5)]'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Zero-latency cached items for instantaneous evaluation"
          >
            <Sparkles className="w-3 h-3 text-black" />
            <span>Instant Demo Cache</span>
          </button>
        </div>

        {/* Backend health status badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-gray-400 bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
          <div className={`w-1.5 h-1.5 rounded-full ${backendStatus.online ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{backendStatus.online ? 'Bedrock Port 3001 Connected' : 'Fallback Engine Ready (Port 3001)'}</span>
        </div>
      </div>

      {/* Right: Channel Switcher & Remote Guide */}
      <div className="flex items-center gap-2">
        {/* One-click PREV CH button (Silk-cursor friendly, no dropdown needed) */}
        <button
          onClick={onPrevChannel}
          aria-label="Previous channel"
          title="Previous Channel (Rewind)"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#131921]/90 border border-white/15 text-xs font-mono font-bold text-gray-100 hover:bg-amber-500/20 hover:border-amber-400 hover:text-[#FFA41C] active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>PREV CH</span>
        </button>

        {/* Channel Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowChannelMenu(!showChannelMenu)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131921]/90 border border-white/15 text-xs text-gray-200 hover:border-amber-400/50 transition-all font-mono"
          >
            <Film className="w-3.5 h-3.5 text-[#FFA41C]" />
            <span className="font-semibold line-clamp-1 max-w-[170px]">
              CH {selectedChannel.channelNumber}: {selectedChannel.title}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showChannelMenu && (
            <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl bg-[#0e131d]/95 border border-white/15 shadow-2xl backdrop-blur-2xl p-2 z-50 animate-fade-in">
              <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 border-b border-white/10">
                Switch Fire TV Video Channel
              </div>
              <div className="mt-1 space-y-1">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      onSelectChannel(ch);
                      setShowChannelMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between text-xs ${
                      ch.id === selectedChannel.id
                        ? 'bg-amber-500/20 text-[#FFA41C] font-bold border border-amber-500/30'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-cyan-300">
                          CH {ch.channelNumber}
                        </span>
                        <span>{ch.title}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{ch.subtitle}</div>
                    </div>
                    {ch.id === selectedChannel.id && <CheckCircle2 className="w-4 h-4 text-[#FFA41C] flex-shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* One-click NEXT CH button */}
        <button
          onClick={onNextChannel}
          aria-label="Next channel"
          title="Next Channel (Fast-Forward)"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#131921]/90 border border-white/15 text-xs font-mono font-bold text-gray-100 hover:bg-amber-500/20 hover:border-amber-400 hover:text-[#FFA41C] active:scale-95 transition-all"
        >
          <span>NEXT CH</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Remote Guide Button */}
        <button
          onClick={onOpenHelp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono text-cyan-300 border border-cyan-400/30 transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Remote Guide</span>
        </button>
      </div>
    </header>
  );
};
