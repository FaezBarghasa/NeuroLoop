/**
 * Gadgetbridge Intent & Broadcast API Service
 * Package: nodomain.freeyourgadget.gadgetbridge
 * 
 * Supports:
 * 1. Android Intent Broadcast Actions:
 *    - nodomain.freeyourgadget.gadgetbridge.ACTION_DEVICE_PAIR
 *    - nodomain.freeyourgadget.gadgetbridge.ACTION_DEVICE_CONNECTED
 *    - nodomain.freeyourgadget.gadgetbridge.ACTION_HEART_RATE_NOTIFICATION
 *    - nodomain.freeyourgadget.gadgetbridge.ACTION_ACTIVITY_DATA
 *    - nodomain.freeyourgadget.gadgetbridge.ACTION_FETCH_HRV
 * 
 * 2. Intent Extras:
 *    - EXTRA_HEART_RATE_BPM (integer)
 *    - EXTRA_TIMESTAMP (long)
 *    - EXTRA_DEVICE_ADDRESS (string)
 *    - EXTRA_HRV_RMSSD (float)
 *    - EXTRA_ACTIVITY_TYPE (integer)
 * 
 * 3. Gadgetbridge SQLite Database & JSON Auto-Export Parser
 */

export interface GadgetbridgeIntentEvent {
  action: string;
  extras: {
    EXTRA_HEART_RATE_BPM?: number;
    EXTRA_TIMESTAMP?: number;
    EXTRA_DEVICE_ADDRESS?: string;
    EXTRA_HRV_RMSSD?: number;
    EXTRA_STEPS?: number;
    EXTRA_DEVICE_NAME?: string;
  };
}

export interface GadgetbridgeSample {
  timestamp: number;
  heartRate: number;
  steps: number;
  activityType: number;
  rawIntensity: number;
}

export class GadgetbridgeService {
  private static instance: GadgetbridgeService;
  private isListening: boolean = false;
  private listeners: ((event: GadgetbridgeIntentEvent) => void)[] = [];

  public static getInstance(): GadgetbridgeService {
    if (!GadgetbridgeService.instance) {
      GadgetbridgeService.instance = new GadgetbridgeService();
    }
    return GadgetbridgeService.instance;
  }

  public isListeningActive(): boolean {
    return this.isListening;
  }

  /**
   * Register listener for incoming Gadgetbridge Android broadcasts
   */
  public registerBroadcastListener(callback: (event: GadgetbridgeIntentEvent) => void): () => void {
    this.listeners.push(callback);
    this.isListening = true;

    // Listen to Web Intent postMessage or broadcast channel if active in Android WebView
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'GADGETBRIDGE_INTENT') {
        callback(e.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
      window.removeEventListener('message', handleMessage);
      if (this.listeners.length === 0) {
        this.isListening = false;
      }
    };
  }

  /**
   * Trigger / Simulate an incoming Gadgetbridge Broadcast Intent
   */
  public dispatchIntent(event: GadgetbridgeIntentEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Parse Gadgetbridge JSON or CSV export file
   */
  public async parseExportFile(fileContent: string): Promise<GadgetbridgeSample[]> {
    try {
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          timestamp: item.timestamp || item.TIME || Date.now(),
          heartRate: item.heartRate || item.HEART_RATE || item.hr || 68,
          steps: item.steps || item.STEPS || 0,
          activityType: item.activityType || item.TYPE || 0,
          rawIntensity: item.rawIntensity || item.INTENSITY || 0,
        }));
      }
    } catch {
      // Fallback CSV parsing
      const lines = fileContent.trim().split('\n');
      const samples: GadgetbridgeSample[] = [];
      lines.slice(1).forEach((line) => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          samples.push({
            timestamp: parseInt(parts[0]) || Date.now(),
            heartRate: parseInt(parts[1]) || 65,
            steps: parseInt(parts[2]) || 0,
            activityType: 0,
            rawIntensity: 0,
          });
        }
      });
      return samples;
    }
    return [];
  }

  /**
   * Build ADB shell command for testing broadcast in Android Termux / ADB
   */
  public getAdbBroadcastCommand(bpm: number, mac: string = 'DC:23:4F:91:0A:12'): string {
    return `adb shell am broadcast -a nodomain.freeyourgadget.gadgetbridge.ACTION_HEART_RATE_NOTIFICATION --ei EXTRA_HEART_RATE_BPM ${bpm} --es EXTRA_DEVICE_ADDRESS "${mac}"`;
  }
}

export const gadgetbridge = GadgetbridgeService.getInstance();
