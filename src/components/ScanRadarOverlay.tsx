import React, { useEffect, useState } from 'react';
import { Sparkles, Scan, Cpu } from 'lucide-react';
import { API_BASE } from '../services/aiService';

interface ScanRadarOverlayProps {
  mode: 'live' | 'demo';
}

export const ScanRadarOverlay: React.FC<ScanRadarOverlayProps> = ({ mode }) => {
  const [modelLabel, setModelLabel] = useState<string>('Amazon Nova Pro / AWS Bedrock');

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    async function fetchHealth() {
      try {
        const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        const modelId: string | undefined = data?.model;
        if (!mounted) return;
        if (typeof modelId === 'string' && modelId.length > 0) {
          const id = modelId.toLowerCase();
          const name =
            id.includes('nova-pro')
              ? 'Amazon Nova Pro'
              : id.includes('claude-3-5-sonnet')
              ? 'Claude 3.5 Sonnet'
              : id.includes('claude')
              ? 'Claude'
              : id.includes('nova')
              ? 'Amazon Nova'
              : modelId;
          setModelLabel(`${name} / AWS Bedrock`);
        }
      } catch {
        // Silent fallback to default label; do not disrupt demo/mock mode.
      } finally {
        clearTimeout(timeoutId);
      }
    }

    fetchHealth();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden select-none">
      {/* Darkened visual focus tint */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all duration-300" />

      {/* Cyber/Tech scanning grid overlay */}
      <div className="absolute inset-0 scan-grid opacity-30" />

      {/* Sweeping Laser Beam Line */}
      <div className="absolute left-0 right-0 h-24 radar-sweep-line animate-scan-laser opacity-90">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_20px_4px_#00CAFF]" />
        <div className="absolute bottom-[-1px] left-1/4 w-1/2 h-[3px] bg-[#FFA41C] shadow-[0_0_25px_6px_#FFA41C]" />
      </div>

      {/* Central Targeting Radar HUD */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          {/* Concentric rotating radar rings */}
          <div className="relative w-48 h-48 rounded-full border border-cyan-400/30 flex items-center justify-center animate-[spin_6s_linear_infinite]">
            <div className="w-36 h-36 rounded-full border border-dashed border-amber-400/40 animate-[spin_10s_linear_infinite_reverse]" />
            <div className="absolute w-24 h-24 rounded-full border border-cyan-300/60 shadow-[0_0_30px_rgba(0,202,255,0.4)]" />
            
            {/* Center target crosshair */}
            <div className="absolute w-full h-[1px] bg-cyan-400/40" />
            <div className="absolute h-full w-[1px] bg-cyan-400/40" />
            <div className="w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_15px_#FFA41C] animate-ping" />
          </div>

          {/* Status HUD Pill */}
          <div className="mt-8 px-6 py-3 rounded-full bg-[#0c0f17]/90 border border-cyan-400/40 shadow-[0_0_35px_rgba(0,202,255,0.3)] backdrop-blur-xl flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping absolute" />
              <span className="w-3 h-3 rounded-full bg-cyan-400 relative" />
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                {mode === 'live' ? 'AWS Bedrock Vision Analysis' : 'Instant AI Vision Scan'}
              </span>
              <span className="text-[11px] text-gray-300 font-mono">
                Detecting fashion, watches & lifestyle items...
              </span>
            </div>

            <div className="h-6 w-[1px] bg-white/20 ml-2" />
            
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
              1080p Frame
            </span>
          </div>
        </div>
      </div>

      {/* 4 Corner Optical Target Brackets */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-cyan-400/70" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-cyan-400/70" />
      <div className="absolute bottom-24 left-8 w-12 h-12 border-b-2 border-l-2 border-cyan-400/70" />
      <div className="absolute bottom-24 right-8 w-12 h-12 border-b-2 border-r-2 border-cyan-400/70" />

      {/* Real-time telemetry badges */}
      <div className="absolute top-8 left-24 flex items-center gap-2 text-xs font-mono text-cyan-300/80 bg-black/60 px-3 py-1.5 rounded-lg border border-cyan-500/20 backdrop-blur-md">
        <Cpu className="w-3.5 h-3.5 text-amber-400" />
        <span>MODEL: {modelLabel}</span>
      </div>

      <div className="absolute top-8 right-24 flex items-center gap-2 text-xs font-mono text-amber-300/80 bg-black/60 px-3 py-1.5 rounded-lg border border-amber-500/20 backdrop-blur-md">
        <Scan className="w-3.5 h-3.5 text-cyan-400" />
        <span>BOUNDING BOX DETECTION: ACTIVE</span>
      </div>
    </div>
  );
};
