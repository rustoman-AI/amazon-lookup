import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import type { VideoPlayerHandle } from './components/VideoPlayer';
import { ScanRadarOverlay } from './components/ScanRadarOverlay';
import { BoundingBoxOverlay } from './components/BoundingBoxOverlay';
import { XRayCommerceDrawer } from './components/XRayCommerceDrawer';
import { AlexaVoiceWaveModal } from './components/AlexaVoiceWaveModal';
import { FireTvRemoteWidget } from './components/FireTvRemoteWidget';
import { DeveloperControls } from './components/DeveloperControls';
import { RemoteNavigationGuide } from './components/RemoteNavigationGuide';
import { CHANNELS } from './data/mockData';
import type { AnalyzedItem, CardSelection, AppMode, VideoChannel } from './types';
import { analyzeFrame, API_BASE } from './services/aiService';
import { ShoppingBag, CheckCircle, Mic } from 'lucide-react';
import { classifyRemoteKey, findNextBoundingBox } from '../tv-bbox-navigator/src/index';

// Expose API_BASE so requests from a physical Fire TV device over LAN route correctly
export const RESOLVED_API_BASE = API_BASE;

export function App() {
  // Player & Channel state
  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const [currentChannel, setCurrentChannel] = useState<VideoChannel>(CHANNELS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // AI & Detection state — default to LIVE Amazon Bedrock (Nova Pro) inference.
  const [mode, setMode] = useState<AppMode>('live');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAiOverlayActive, setIsAiOverlayActive] = useState<boolean>(false);
  const [detectedItems, setDetectedItems] = useState<AnalyzedItem[]>([]);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(0);
  const [cardSelection, setCardSelection] = useState<CardSelection>('exact');
  const [analysisMeta, setAnalysisMeta] = useState<{ mode?: string; isLive?: boolean; latency?: number } | null>(null);

  // Modals & Voice UI state
  const [isAlexaModalOpen, setIsAlexaModalOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [cartToast, setCartToast] = useState<{ show: boolean; title: string; price: string } | null>(null);

  // On-screen TV OSD banner shown briefly on channel change (e.g. "CH 2 - Highway Ops").
  const [channelOsd, setChannelOsd] = useState<{ number: number; title: string } | null>(null);
  const osdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger AI Amazon LookUp Scene Analysis
  const handleShopScene = useCallback(async () => {
    if (isScanning) return;

    // 1. Pause video
    playerRef.current?.pause();
    setIsPlaying(false);

    // 2. Extract frame from offscreen canvas at 0.85 quality.
    //    Async: VideoPlayer seeks past t=0 / waits for decode so a blank frame
    //    never gets sent (which would force a demo-cache fallback in live mode).
    const frameData = await playerRef.current?.captureCurrentFrame();
    const imageBase64 = frameData?.base64 || '';
    const videoTimestamp = frameData?.timestamp || 0;

    // 3. Activate scanning laser/radar animation across paused frame
    setIsScanning(true);
    setIsAiOverlayActive(true);

    try {
      // 4. Send to Bedrock API or fetch cached items with simulated radar latency
      const response = await analyzeFrame(
        imageBase64,
        currentChannel.sceneId,
        videoTimestamp,
        mode,
        currentChannel.defaultItems
      );

      setDetectedItems(response.items);
      setFocusedItemIndex(0);
      setCardSelection('exact');
      setAnalysisMeta({
        mode:
          response.mode === 'live'
            ? 'LIVE AWS BEDROCK (us.amazon.nova-pro-v1:0)'
            : 'Instant Demo Cache (0-1000 Coordinates)',
        isLive: response.mode === 'live',
        latency: response.processingTimeMs,
      });
    } catch (err) {
      console.error('Frame analysis fallback:', err);
      setDetectedItems(currentChannel.defaultItems);
      setFocusedItemIndex(0);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, mode, currentChannel]);

  // Resume Video and dismiss AI Overlay
  const handleResumeVideo = useCallback(() => {
    setIsAiOverlayActive(false);
    setIsScanning(false);
    setIsAlexaModalOpen(false);
    playerRef.current?.play();
    setIsPlaying(true);
  }, []);

  // Cycle focus left/right across bounding boxes via tv-bbox-navigator
  const handleNavigateLeft = useCallback(() => {
    if (!detectedItems.length) return;
    const currentItem = detectedItems[focusedItemIndex];
    const nextBox = findNextBoundingBox(detectedItems, currentItem?.id, 'LEFT', { wrap: true });
    if (nextBox) {
      const nextIdx = detectedItems.findIndex((b) => b.id === nextBox.id);
      if (nextIdx !== -1) setFocusedItemIndex(nextIdx);
    } else {
      setFocusedItemIndex((prev) => (prev > 0 ? prev - 1 : detectedItems.length - 1));
    }
  }, [detectedItems, focusedItemIndex]);

  const handleNavigateRight = useCallback(() => {
    if (!detectedItems.length) return;
    const currentItem = detectedItems[focusedItemIndex];
    const nextBox = findNextBoundingBox(detectedItems, currentItem?.id, 'RIGHT', { wrap: true });
    if (nextBox) {
      const nextIdx = detectedItems.findIndex((b) => b.id === nextBox.id);
      if (nextIdx !== -1) setFocusedItemIndex(nextIdx);
    } else {
      setFocusedItemIndex((prev) => (prev < detectedItems.length - 1 ? prev + 1 : 0));
    }
  }, [detectedItems, focusedItemIndex]);

  // Select Exact Match vs Budget Alternative tabs
  const handleNavigateUp = useCallback(() => {
    setCardSelection('exact');
  }, []);

  const handleNavigateDown = useCallback(() => {
    setCardSelection('budget');
  }, []);

  // Single-button cycle through every (item x tier) combination while the X-Ray
  // overlay is open: Item1 Exact -> Item1 Budget -> Item2 Exact -> Item2 Budget -> ... (wraps).
  // Used by the physical Fast-Forward (forward) and Rewind (backward) keys.
  const cycleOverlaySelection = useCallback(
    (dir: 1 | -1) => {
      const count = detectedItems.length;
      if (!count) return;
      // Flatten to a linear index: slot = itemIndex * 2 + (exact=0, budget=1).
      const tierSlot = cardSelection === 'exact' ? 0 : 1;
      const current = focusedItemIndex * 2 + tierSlot;
      const total = count * 2;
      const nextSlot = (current + dir + total) % total;
      const nextItem = Math.floor(nextSlot / 2);
      const nextTier: CardSelection = nextSlot % 2 === 0 ? 'exact' : 'budget';
      setFocusedItemIndex(nextItem);
      setCardSelection(nextTier);
    },
    [detectedItems.length, focusedItemIndex, cardSelection],
  );

  // Trigger Alexa voice or cart confirmation
  const handleTriggerAlexaVoice = useCallback(() => {
    const currentItem = detectedItems[focusedItemIndex];
    if (!currentItem) return;

    const selectedProduct = cardSelection === 'exact' ? currentItem.exactMatch : currentItem.budgetAlternative;
    setIsAlexaModalOpen(true);

    // Show toast
    setCartToast({
      show: true,
      title: selectedProduct.title,
      price: selectedProduct.estimatedPrice,
    });

    setTimeout(() => {
      setCartToast(null);
    }, 4500);
  }, [detectedItems, focusedItemIndex, cardSelection]);

  // Handle Play/Pause toggle
  const handleTogglePlayPause = useCallback(() => {
    if (isAiOverlayActive) {
      handleResumeVideo();
    } else {
      const isCurrentlyPlaying = playerRef.current?.isPlaying();
      if (isCurrentlyPlaying) {
        playerRef.current?.pause();
        setIsPlaying(false);
      } else {
        playerRef.current?.play();
        setIsPlaying(true);
      }
    }
  }, [isAiOverlayActive, handleResumeVideo]);

  // Handle local video upload
  const handleLocalVideoLoaded = (objectUrl: string, fileName: string) => {
    const localChannel: VideoChannel = {
      id: `local-${Date.now()}`,
      sceneId: 'local_custom',
      channelNumber: 99,
      title: `Custom Local: ${fileName}`,
      subtitle: 'Zero-CORS custom local MP4 video file',
      url: objectUrl,
      defaultItems: CHANNELS[0].defaultItems,
    };
    setCurrentChannel(localChannel);
    handleResumeVideo();
  };

  // Show the TV OSD channel banner for ~2.2s.
  const flashChannelOsd = useCallback((channel: VideoChannel) => {
    setChannelOsd({ number: channel.channelNumber, title: channel.title });
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => setChannelOsd(null), 2200);
  }, []);

  // Switch to a specific channel (also used by the dropdown + CH pill buttons).
  const handleSelectChannel = useCallback(
    (channel: VideoChannel) => {
      setCurrentChannel(channel);
      flashChannelOsd(channel);
      handleResumeVideo();
    },
    [flashChannelOsd, handleResumeVideo],
  );

  // Previous channel, wrapping 4 -> 3 -> 2 -> 1 -> 4.
  const handlePrevChannel = useCallback(() => {
    setCurrentChannel((cur) => {
      const idx = CHANNELS.findIndex((c) => c.id === cur.id);
      const base = idx === -1 ? 0 : idx;
      const prev = CHANNELS[(base - 1 + CHANNELS.length) % CHANNELS.length];
      flashChannelOsd(prev);
      return prev;
    });
    handleResumeVideo();
  }, [flashChannelOsd, handleResumeVideo]);

  // Next channel, wrapping 1 -> 2 -> 3 -> 4 -> 1.
  const handleNextChannel = useCallback(() => {
    setCurrentChannel((cur) => {
      const idx = CHANNELS.findIndex((c) => c.id === cur.id);
      const base = idx === -1 ? 0 : idx;
      const next = CHANNELS[(base + 1) % CHANNELS.length];
      flashChannelOsd(next);
      return next;
    });
    handleResumeVideo();
  }, [flashChannelOsd, handleResumeVideo]);

  // Jump directly to channel number 1-4 (number keys).
  const goToChannelNumber = useCallback(
    (n: number) => {
      const target = CHANNELS.find((c) => c.channelNumber === n);
      if (target) handleSelectChannel(target);
    },
    [handleSelectChannel],
  );

  // 2. Unified Fire TV + Vega OS Remote Keycode Handler powered by tv-bbox-navigator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Context-aware classification via open-source tv-bbox-navigator engine.
      // Recognizes D-Pad, media transport (Rewind/Fast-Forward), channel keys,
      // and number keys 1-4.
      const action = classifyRemoteKey(e);

      switch (action) {
        // --- Direct channel number keys 1-4 (work in any context) ---
        case 'CHANNEL_1':
        case 'CHANNEL_2':
        case 'CHANNEL_3':
        case 'CHANNEL_4':
          e.preventDefault();
          goToChannelNumber(Number(action.slice(-1)));
          break;

        // --- Rewind (physical) / dedicated ChannelDown ---
        case 'REWIND':
        case 'CHANNEL_PREV':
          e.preventDefault();
          if (isAiOverlayActive) {
            cycleOverlaySelection(-1); // backward through items + tiers
          } else {
            handlePrevChannel();
          }
          break;

        // --- Fast-Forward (physical) / dedicated ChannelUp ---
        case 'FAST_FORWARD':
        case 'CHANNEL_NEXT':
          e.preventDefault();
          if (isAiOverlayActive) {
            cycleOverlaySelection(1); // forward through items + tiers
          } else {
            handleNextChannel();
          }
          break;

        // --- D-Pad Left: item nav in overlay, else previous channel ---
        case 'LEFT':
          e.preventDefault();
          if (isAiOverlayActive) {
            handleNavigateLeft();
          } else {
            handlePrevChannel();
          }
          break;

        // --- D-Pad Right: item nav in overlay, else next channel ---
        case 'RIGHT':
          e.preventDefault();
          if (isAiOverlayActive) {
            handleNavigateRight();
          } else {
            handleNextChannel();
          }
          break;

        case 'UP':
          if (isAiOverlayActive) {
            e.preventDefault();
            handleNavigateUp();
          }
          break;

        case 'DOWN':
          if (isAiOverlayActive) {
            e.preventDefault();
            handleNavigateDown();
          }
          break;

        case 'SELECT':
          e.preventDefault();
          if (isAiOverlayActive) {
            handleTriggerAlexaVoice();
          } else {
            handleShopScene();
          }
          break;

        case 'PLAY_PAUSE':
          e.preventDefault();
          if (!isAiOverlayActive) {
            // Playing: pause + Shop Scene with AI.
            handleShopScene();
          } else if (!isAlexaModalOpen) {
            // Overlay open, first press: Alexa+ Add to Cart confirmation.
            handleTriggerAlexaVoice();
          } else {
            // Overlay open, Alexa modal already shown: resume playback.
            handleResumeVideo();
          }
          break;

        case 'BACK':
          if (isAiOverlayActive || isAlexaModalOpen || isHelpOpen) {
            e.preventDefault();
            setIsHelpOpen(false);
            handleResumeVideo();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAiOverlayActive,
    isAlexaModalOpen,
    isHelpOpen,
    handleShopScene,
    handleNavigateLeft,
    handleNavigateRight,
    handleNavigateUp,
    handleNavigateDown,
    handleTriggerAlexaVoice,
    handleResumeVideo,
    handlePrevChannel,
    handleNextChannel,
    goToChannelNumber,
    cycleOverlaySelection,
  ]);

  const focusedItem = detectedItems[focusedItemIndex] || null;
  // The X-Ray drawer is on screen exactly when the overlay is active, not
  // scanning, and we have a focused item. The video stage shrinks to match.
  const drawerOpen = isAiOverlayActive && !isScanning && !!focusedItem;

  return (
    <div className="relative w-screen h-screen bg-[#06080d] text-white overflow-hidden flex flex-col font-tv select-none">
      {/* 10-Foot 16:9 TV Aspect Ratio Screen */}
      <main className="relative w-full h-full flex-1 overflow-hidden" role="main">
        {/*
         * Video + bounding-box STAGE. When the X-Ray drawer is open, the stage
         * shrinks to leave room for the 340px drawer, so the video frame and all
         * bounding boxes (e.g. the biker on the RIGHT in Channel 2) stay fully
         * visible to the LEFT of the drawer instead of being covered by it.
         */}
        <div
          className={`absolute top-0 left-0 h-full overflow-hidden transition-all duration-300 ${
            drawerOpen ? 'w-[calc(100%-20rem)]' : 'w-full'
          }`}
        >
          {/* Full-Screen HTML5 Video Player with crossOrigin="anonymous" */}
          <VideoPlayer
            ref={playerRef}
            currentChannel={currentChannel}
            onShopScene={handleShopScene}
            isAiOverlayActive={isAiOverlayActive}
            onLocalVideoLoaded={handleLocalVideoLoaded}
          />

          {/* Scanning Laser/Radar Animation Overlay (Active during AI frame processing) */}
          {isScanning && <ScanRadarOverlay mode={mode} />}

          {/* Interactive Bounding Boxes Overlay (0-1000 Coordinates) */}
          {isAiOverlayActive && !isScanning && (
            <BoundingBoxOverlay
              items={detectedItems}
              focusedIndex={focusedItemIndex}
              onSelectItem={(idx) => {
                setFocusedItemIndex(idx);
                setCardSelection('exact');
              }}
            />
          )}
        </div>

        {/* Top Channel Switcher & Mode Controls */}
        <DeveloperControls
          mode={mode}
          onToggleMode={setMode}
          selectedChannel={currentChannel}
          onSelectChannel={handleSelectChannel}
          onPrevChannel={handlePrevChannel}
          onNextChannel={handleNextChannel}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        {/* TV OSD channel banner (brief, on channel change) */}
        {channelOsd && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 animate-fade-in pointer-events-none">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#0c1017]/95 border border-[#FFA41C]/50 shadow-[0_0_35px_rgba(255,164,28,0.35)] backdrop-blur-xl">
              <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#FF9900] to-[#FFA41C] text-black text-sm font-black font-mono">
                CH {channelOsd.number}
              </span>
              <span className="text-white text-base font-bold tracking-tight">
                {channelOsd.title}
              </span>
            </div>
          </div>
        )}

        {/* Right-Side Amazon X-Ray Commerce Drawer */}
        {isAiOverlayActive && !isScanning && focusedItem && (
          <XRayCommerceDrawer
            item={focusedItem}
            itemIndex={focusedItemIndex}
            totalItems={detectedItems.length}
            cardSelection={cardSelection}
            onSelectCard={setCardSelection}
            onSelectTier={setCardSelection}
            onTriggerAlexaVoice={handleTriggerAlexaVoice}
            onClose={handleResumeVideo}
            inferenceSource={
              analysisMeta
                ? {
                    label: analysisMeta.mode ?? 'Inference',
                    isLive: Boolean(analysisMeta.isLive),
                    latencyMs: analysisMeta.latency ?? 0,
                  }
                : null
            }
          />
        )}

        {/*
         * Animated Alexa+ Voice Bar — only shown while the overlay is active but
         * the drawer is NOT yet open (i.e. during the brief no-focused-item gap).
         * Hidden once the drawer is open, since the drawer has its own Alexa+
         * voice button, keeping the bottom-left corner clean.
         */}
        {isAiOverlayActive && !isScanning && !drawerOpen && (
          <div className="absolute bottom-24 left-8 z-30 flex items-center gap-3 px-4 py-2 rounded-full bg-[#0c1017]/90 border border-cyan-500/40 shadow-[0_0_25px_rgba(0,202,255,0.25)] backdrop-blur-xl animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00A8E1] to-[#00CAFF] flex items-center justify-center text-black">
              <Mic className="w-4 h-4 text-black animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                Alexa+ Voice Assistant
              </span>
              <span className="text-xs text-white font-medium">
                "Alexa, add the Budget Alternative to my cart"
              </span>
            </div>
            {analysisMeta && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ml-2 ${
                  analysisMeta.isLive
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                    : 'bg-black/60 text-amber-400 border-white/10'
                }`}
              >
                {analysisMeta.latency}ms
              </span>
            )}
          </div>
        )}

        {/* Inference Source Badge — proves LIVE Amazon Bedrock vs Demo Cache */}
        {isAiOverlayActive && !isScanning && analysisMeta && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-xl ${
                analysisMeta.isLive
                  ? 'bg-emerald-500/15 border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                  : 'bg-[#FFA41C]/15 border-amber-400/50 shadow-[0_0_25px_rgba(255,164,28,0.25)]'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  analysisMeta.isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span
                className={`text-xs font-mono font-bold tracking-wide ${
                  analysisMeta.isLive ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {analysisMeta.mode}
              </span>
              <span className="w-[1px] h-3.5 bg-white/20" />
              <span className="text-[11px] font-mono text-white">
                {analysisMeta.latency}ms real inference
              </span>
            </div>
          </div>
        )}

        {/* Living Room TV Toast Notification: Cart Push */}
        {cartToast && (
          <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl bg-[#131921]/95 border-2 border-emerald-400/60 shadow-[0_10px_40px_rgba(16,185,129,0.35)] backdrop-blur-xl flex items-center gap-3.5 max-w-md animate-bounce-subtle">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Added to Amazon Cart</span>
              </div>
              <div className="text-xs font-semibold text-white truncate mt-0.5">
                {cartToast.title}
              </div>
              <div className="text-[11px] text-gray-400 font-mono">
                {cartToast.price} • Synced to Fire TV & Mobile App
              </div>
            </div>
          </div>
        )}

        {/* Alexa Voice Waveform Modal */}
        {focusedItem && (
          <AlexaVoiceWaveModal
            isOpen={isAlexaModalOpen}
            product={cardSelection === 'exact' ? focusedItem.exactMatch : focusedItem.budgetAlternative}
            onClose={() => setIsAlexaModalOpen(false)}
          />
        )}

        {/* Remote Navigation Guide Modal */}
        <RemoteNavigationGuide
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />

        {/*
         * Interactive On-Screen Fire TV & Vega Remote Widget.
         * Hidden while the drawer is open to keep the (now narrower) video view
         * unobstructed — the drawer provides the needed actions.
         */}
        {!drawerOpen && (
          <FireTvRemoteWidget
            isPlaying={isPlaying}
            isAiOverlayActive={isAiOverlayActive}
            onPlayPause={handleTogglePlayPause}
            onShopScene={handleShopScene}
            onNavigateLeft={handleNavigateLeft}
            onNavigateRight={handleNavigateRight}
            onNavigateUp={handleNavigateUp}
            onNavigateDown={handleNavigateDown}
            onSelect={isAiOverlayActive ? handleTriggerAlexaVoice : handleShopScene}
            onBack={handleResumeVideo}
            onTriggerMic={handleTriggerAlexaVoice}
          />
        )}
      </main>
    </div>
  );
}

export default App;
