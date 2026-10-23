import React, { useEffect, useState } from 'react';
import { Mic, CheckCircle2, ShoppingBag, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CatalogProduct } from '../types';

interface AlexaVoiceWaveModalProps {
  product: CatalogProduct;
  isOpen: boolean;
  onClose: () => void;
}

// Generates an authentic subtle Alexa chime using Web Audio API
const playAlexaChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // First tone (587 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Second chime (880 Hz)
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.5);
    }, 120);
  } catch (e) {
    console.debug('Audio context note:', e);
  }
};

export const AlexaVoiceWaveModal: React.FC<AlexaVoiceWaveModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [phase, setPhase] = useState<'listening' | 'processing' | 'confirmed'>('listening');

  useEffect(() => {
    if (!isOpen) {
      setPhase('listening');
      return;
    }

    playAlexaChime();
    setPhase('listening');

    // Progression: Listening -> Processing -> Confirmed -> auto close
    const t1 = setTimeout(() => {
      setPhase('processing');
    }, 1200);

    const t2 = setTimeout(() => {
      setPhase('confirmed');
      try {
        confetti({
          particleCount: 65,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#FF9900', '#00CAFF', '#FFA41C', '#ffffff'],
        });
      } catch (err) {
        console.debug('Confetti error:', err);
      }
    }, 2400);

    const t3 = setTimeout(() => {
      onClose();
    }, 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-xl p-8 rounded-3xl bg-[#0d121c] border-2 border-cyan-400/50 shadow-[0_0_60px_rgba(0,202,255,0.4)] text-center overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Alexa Signature Cyan & Blue Ring */}
        <div className="relative mx-auto mb-6 flex items-center justify-center w-28 h-28">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00A8E1] to-[#00CAFF] opacity-75 blur-md animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-[#131921] border-4 border-[#00CAFF] flex items-center justify-center shadow-[0_0_25px_#00CAFF]">
            {phase === 'confirmed' ? (
              <CheckCircle2 className="w-12 h-12 text-[#FFA41C] animate-scale-up" />
            ) : (
              <Mic className="w-10 h-10 text-cyan-300 animate-pulse" />
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Alexa+ Living Room Voice Commerce
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight">
            {phase === 'listening' && `"Alexa, add the Budget Alternative to my cart"`}
            {phase === 'processing' && `Verifying with Prime Cart Agent...`}
            {phase === 'confirmed' && `Added to Amazon Cart!`}
          </h3>

          <p className="mt-2 text-sm text-gray-300 line-clamp-2 px-4">
            {product.title}
          </p>
        </div>

        {/* Voice Equalizer Waveform Animation */}
        {phase !== 'confirmed' ? (
          <div className="flex items-center justify-center gap-1.5 h-16 my-4 px-6 py-2 bg-black/40 rounded-2xl border border-white/5">
            {[30, 65, 90, 45, 80, 100, 70, 50, 85, 40, 95, 60, 35].map((initialHeight, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-[#FFA41C] shadow-[0_0_8px_#00CAFF]"
                style={{
                  height: phase === 'processing' ? `${(i % 4 + 2) * 15}%` : `${initialHeight}%`,
                  animation: `waveBar ${0.6 + (i % 5) * 0.15}s infinite ease-in-out alternate`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center my-4 py-3 bg-[#131921]/90 rounded-2xl border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShoppingBag className="w-4 h-4" />
              <span>1 Item ready in your Amazon Mobile & Fire TV Cart</span>
            </div>
            <div className="text-xs text-gray-400 mt-1 font-mono">
              Price: {product.estimatedPrice} {product.asin ? `• ASIN: ${product.asin}` : ''}
            </div>
          </div>
        )}

        {/* Footer Guidance */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span>Synced with your Amazon account (1-Click)</span>
          <span className="font-mono text-cyan-300">Press [ENTER] or [BACK]</span>
        </div>
      </div>
    </div>
  );
};
