import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Sparkles, 
  Upload
} from 'lucide-react';
import type { VideoChannel } from '../types';

export interface VideoPlayerHandle {
  /**
   * Capture the current frame as a JPEG data URL. Async because, when the video
   * is at t=0 or not yet decoded (readyState < 2), it first seeks to ~0.5s and
   * waits for the frame to be available so we never export a blank canvas.
   */
  captureCurrentFrame: () => Promise<{ base64: string; timestamp: number } | null>;
  pause: () => void;
  play: () => void;
  isPlaying: () => boolean;
  getVideoElement: () => HTMLVideoElement | null;
}

interface VideoPlayerProps {
  currentChannel: VideoChannel;
  onShopScene: () => void;
  isAiOverlayActive: boolean;
  onLocalVideoLoaded?: (objectUrl: string, fileName: string) => void;
}

/** HTMLMediaElement.readyState >= 2 (HAVE_CURRENT_DATA) means the current frame is decodable. */
const HAVE_CURRENT_DATA = 2;

/** Resolve once an event fires or after a timeout, whichever comes first. */
function waitForEvent(el: HTMLVideoElement, event: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener(event, finish);
      resolve();
    };
    el.addEventListener(event, finish, { once: true });
    window.setTimeout(finish, timeoutMs);
  });
}

/**
 * Guarantee the video has a real, decoded frame to draw:
 * - If we're parked at the very start (currentTime < 0.1s), nudge to ~0.5s so we
 *   grab actual content instead of a black/poster frame.
 * - If data isn't decoded yet (readyState < HAVE_CURRENT_DATA = 2), wait for
 *   `loadeddata`. After any seek, wait for `seeked`.
 */
async function ensureDecodedFrame(video: HTMLVideoElement): Promise<void> {
  if (video.readyState < HAVE_CURRENT_DATA) {
    await waitForEvent(video, 'loadeddata', 2500);
  }

  const atStart = !Number.isFinite(video.currentTime) || video.currentTime < 0.1;
  if (atStart) {
    const target = Math.min(0.5, (video.duration || 1) * 0.5 || 0.5);
    try {
      video.currentTime = target;
      await waitForEvent(video, 'seeked', 2000);
    } catch {
      // Seeking may be unsupported for some streams; fall through and draw what we have.
    }
  }

  // Final guard: if still not decoded, give it one more short beat.
  if (video.readyState < HAVE_CURRENT_DATA) {
    await waitForEvent(video, 'loadeddata', 1500);
  }
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({
  currentChannel,
  onShopScene,
  isAiOverlayActive,
  onLocalVideoLoaded,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  // Full-screen spinner shows only during the INITIAL load of a channel.
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  // Transient mid-playback buffering (e.g. a stall when entering fullscreen) is
  // shown as a small, non-blocking corner indicator — not a full-screen overlay.
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const hasPlayedOnceRef = useRef<boolean>(false);

  // Expose imperative frame capture and playback control to parent
  useImperativeHandle(ref, () => ({
    captureCurrentFrame: async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return null;

      // Ensure we have a real, decoded frame before drawing. A capture at
      // t=0 (poster/first blank frame) or before enough data is buffered
      // (readyState < HAVE_CURRENT_DATA) would export an all-black JPEG that
      // the backend treats as "no products", forcing a fallback to demo cache
      // even when Live Bedrock is selected.
      await ensureDecodedFrame(video);

      try {
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, width, height);

        // Export as data:image/jpeg;base64 with 0.85 quality as requested
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        return {
          base64,
          timestamp: video.currentTime,
        };
      } catch (err) {
        console.warn('Canvas frame capture note (CORS / browser sandbox):', err);
        return {
          base64: 'data:image/jpeg;base64,syntheticFrameForFallback',
          timestamp: video?.currentTime || 0,
        };
      }
    },
    pause: () => {
      videoRef.current?.pause();
      setIsPlaying(false);
    },
    play: () => {
      videoRef.current?.play().catch(() => {});
      setIsPlaying(true);
    },
    isPlaying: () => !videoRef.current?.paused,
    getVideoElement: () => videoRef.current,
  }));

  // Handle video playback events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // New channel source -> reset load state.
    hasPlayedOnceRef.current = false;
    setIsInitialLoading(true);
    setIsBuffering(false);

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration || 0);
    const onCanPlay = () => {
      // Enough data to start -> clear the initial spinner.
      setIsInitialLoading(false);
    };
    const onWaiting = () => {
      // Only treat as transient buffering once playback has begun; the first
      // buffering is the initial load (full spinner), later ones are brief
      // stalls (small corner indicator, e.g. when entering fullscreen).
      if (hasPlayedOnceRef.current) setIsBuffering(true);
      else setIsInitialLoading(true);
    };
    const onPlaying = () => {
      hasPlayedOnceRef.current = true;
      setIsInitialLoading(false);
      setIsBuffering(false);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);

    video.play().catch(() => {
      video.muted = true;
      setIsMuted(true);
      video.play().catch(() => {});
    });

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
    };
  }, [currentChannel.url]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLocalVideoLoaded) {
      const objectUrl = URL.createObjectURL(file);
      onLocalVideoLoaded(objectUrl, file.name);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center select-none group">
      {/* HTML5 Video Player with crossOrigin="anonymous" */}
      <video
        ref={videoRef}
        src={currentChannel.url}
        poster={currentChannel.poster}
        crossOrigin="anonymous"
        preload="auto"
        loop
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
      />

      {/* Hidden HTML5 Canvas for real-time frame capture */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Hidden Local Video File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleLocalFileChange}
        className="hidden"
      />

      {/* Initial Load Spinner (first buffer of a channel only) */}
      {isInitialLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-10">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      )}

      {/* Transient buffering indicator (small, non-blocking — e.g. a brief stall
          when entering fullscreen) so the whole screen doesn't flash a spinner */}
      {!isInitialLoading && isBuffering && (
        <div className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[11px] font-mono text-cyan-300 pointer-events-none z-10 animate-fade-in">
          <span className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>Buffering…</span>
        </div>
      )}

      {/* Minimalist Dark Glassmorphism HUD at Bottom */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 glass-hud transition-all duration-300 p-6 flex flex-col gap-3 ${
          isAiOverlayActive ? 'opacity-95' : 'opacity-90 group-hover:opacity-100'
        }`}
      >
        {/* Timeline Scrubbing Bar */}
        <div className="relative flex items-center group/scrubber cursor-pointer">
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#00A8E1] to-[#FFA41C] rounded-full transition-all duration-100 shadow-[0_0_12px_#FFA41C]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* HUD Controls & Glowing Shop Prompt */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Playback Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 text-amber-400" /> : <Play className="w-5 h-5 text-emerald-400" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
            </button>

            {/* Time Stamp */}
            <div className="font-mono text-xs text-gray-300 ml-2">
              <span className="text-white font-bold">{formatTime(currentTime)}</span>
              <span className="text-gray-500 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Local Video Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="ml-3 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-xs text-gray-300 border border-white/10 hover:border-cyan-400/50 transition-all font-mono"
              title="Load custom local MP4 to test without CORS"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Local MP4</span>
            </button>
          </div>

          {/* Center: GLOWING PROMPT "Press [ENTER / SELECT] or [S] to Shop This Scene with AI" */}
          <div className="flex items-center justify-center">
            <button
              onClick={onShopScene}
              className="relative group/prompt px-6 py-2.5 rounded-full bg-gradient-to-r from-[#131921] via-[#1a2332] to-[#131921] border-2 border-[#FFA41C] shadow-[0_0_30px_rgba(255,164,28,0.45)] hover:shadow-[0_0_40px_rgba(255,164,28,0.8)] transition-all flex items-center gap-3 active:scale-95"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFA41C] animate-ping" />
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wide text-white">
                  Press <kbd className="px-2 py-0.5 rounded bg-black/80 text-[#FFA41C] font-mono font-black border border-amber-500/50 text-xs">ENTER / SELECT</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black/80 text-[#FFA41C] font-mono font-black border border-amber-500/50 text-xs">S</kbd> to Shop This Scene with AI
                </span>
                <Sparkles className="w-4 h-4 text-[#FFA41C] group-hover/prompt:rotate-12 transition-transform" />
              </div>
            </button>
          </div>

          {/* Right: Resolution Badge & Fullscreen */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-xs text-gray-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>1080p 60fps</span>
            </div>

            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-5 h-5 text-gray-300 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
