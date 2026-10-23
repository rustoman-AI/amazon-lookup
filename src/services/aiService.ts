import type { AppMode, AnalyzedItem, FrameAnalysisResponse } from '../types';

/**
 * Resolve the backend origin dynamically so a physical Fire TV Stick on the
 * same Wi-Fi/LAN hits the dev machine's IP (not "localhost", which on the Stick
 * would point at the Stick itself). When served over http://192.168.x.y:5173,
 * the backend is assumed to run at http://192.168.x.y:3001.
 */
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (typeof window !== 'undefined' && window.location?.hostname
    ? `http://${window.location.hostname}:3001`
    : 'http://localhost:3001');

const BACKEND_URL = `${API_BASE}/api/analyze-frame`;
const HEALTH_URL = `${API_BASE}/health`;

/**
 * Health check to verify if the Amazon LookUp backend is reachable on port 3001
 */
export async function checkBackendHealth(): Promise<{ online: boolean; message: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(HEALTH_URL, {
      signal: controller.signal,
      method: 'GET',
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return { online: true, message: 'Bedrock API connected (port 3001)' };
    }
    return { online: false, message: `Backend responded with HTTP ${res.status}` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Offline';
    return { online: false, message: `Local backend unreachable (${errorMsg})` };
  }
}

/**
 * Captures the current frame and sends it to the Amazon LookUp backend (or returns cached items).
 */
export async function analyzeFrame(
  imageBase64: string,
  sceneId: string,
  videoTimestamp: number,
  mode: AppMode,
  fallbackItems: AnalyzedItem[]
): Promise<FrameAnalysisResponse> {
  const startTime = performance.now();

  // Mode: Instant Demo Cache
  if (mode === 'demo') {
    // Simulate ~800ms scanning laser animation time for smooth TV presentation
    await new Promise((resolve) => setTimeout(resolve, 800));
    const latency = Math.round(performance.now() - startTime);
    return {
      timestamp: videoTimestamp,
      sceneId,
      mode: 'mock',
      processingTimeMs: latency,
      items: fallbackItems,
    };
  }

  // Mode: Live Bedrock API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        imageBase64,
        sceneId,
        videoTimestamp,
        mock: false,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const latency = Math.round(performance.now() - startTime);

    if (data && Array.isArray(data.items) && data.items.length > 0) {
      return {
        timestamp: data.timestamp ?? videoTimestamp,
        sceneId: data.sceneId ?? sceneId,
        mode: data.mode ?? 'live',
        processingTimeMs: latency,
        items: data.items,
      };
    }

    return {
      timestamp: videoTimestamp,
      sceneId,
      mode: 'mock',
      processingTimeMs: latency,
      items: fallbackItems,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown';
    console.warn(`[Amazon LookUp] Live Bedrock backend unavailable (${errorMsg}). Activating verified fallback items.`);

    const elapsed = performance.now() - startTime;
    if (elapsed < 800) {
      await new Promise((resolve) => setTimeout(resolve, 800 - elapsed));
    }

    return {
      timestamp: videoTimestamp,
      sceneId,
      mode: 'mock',
      processingTimeMs: Math.round(performance.now() - startTime),
      items: fallbackItems,
    };
  }
}
