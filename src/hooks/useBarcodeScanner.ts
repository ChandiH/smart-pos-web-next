// useBarcodeScanner.ts
import { useCallback, useEffect, useRef } from "react";

/**
 * Configuration defaults
 */
const DEFAULT_SCAN_TIMEOUT = 50;
const DEFAULT_MIN_LENGTH = 4;
const DEFAULT_BAUD_RATE = 9600;
const DEFAULT_RECONNECT_INTERVAL = 30_000;

/**
 * Global singletons so multiple hook instances share one serial connection/reader
 */
let GLOBAL_SERIAL_PORT: SerialPort | null = null;
let GLOBAL_SERIAL_READER: ReadableStreamDefaultReader<Uint8Array> | null = null;
let GLOBAL_IS_OPENING = false;
let GLOBAL_IS_READING = false;

/**
 * Types
 */
type BarcodeAccessor<T> = (item: T) => string | null | undefined;
type ScanSuccessHandler<T> = (item: T, barcode: string) => void;
type ScanFailureHandler = (barcode: string) => void;

type ScannerOptions = {
  scanTimeout: number;
  minBarcodeLength: number;
};

type SerialConfigOptions = {
  enabled?: boolean;
  baudRate?: number;
  reconnectIntervalMs?: number;
  requestOnConnect?: boolean;
};

type SerialRuntimeConfig = {
  enabled: boolean;
  baudRate: number;
  reconnectIntervalMs: number;
  requestOnConnect: boolean;
};

type SerialApi = {
  getPorts: () => Promise<SerialPort[]>;
  requestPort: (options?: unknown) => Promise<SerialPort>;
};

export type UseBarcodeScannerOptions<T> = {
  enabled?: boolean;
  items?: T[];
  getBarcode?: BarcodeAccessor<T>;
  onScanSuccess?: ScanSuccessHandler<T>;
  onScanFailure?: ScanFailureHandler;
  scanTimeout?: number;
  minBarcodeLength?: number;
  serial?: SerialConfigOptions;
  onSerialUnsupported?: () => void;
  onSerialError?: (error: unknown) => void;
};

export type UseBarcodeScannerReturn = {
  reset: () => void;
};

const getFallbackBarcode = (item: unknown): string | undefined => {
  if (!item || typeof item !== "object") return undefined;
  const candidate = item as Record<string, unknown>;
  const rawValue = candidate.product_barcode ?? candidate.barcode ?? candidate.id;
  if (typeof rawValue === "number") return String(rawValue);
  return typeof rawValue === "string" ? rawValue : undefined;
};

const getSerialApi = (): SerialApi | null => {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & { serial?: SerialApi };
  return nav.serial ?? null;
};

const DEFAULT_SERIAL_RUNTIME: SerialRuntimeConfig = {
  enabled: true,
  baudRate: DEFAULT_BAUD_RATE,
  reconnectIntervalMs: DEFAULT_RECONNECT_INTERVAL,
  requestOnConnect: true,
};

/**
 * Hook
 */
const useBarcodeScanner = <T,>({
  enabled = true,
  items = [],
  getBarcode,
  onScanSuccess,
  onScanFailure,
  scanTimeout = DEFAULT_SCAN_TIMEOUT,
  minBarcodeLength = DEFAULT_MIN_LENGTH,
  serial,
  onSerialUnsupported,
  onSerialError,
}: UseBarcodeScannerOptions<T> = {}): UseBarcodeScannerReturn => {
  // --- keyboard scanner state (per-hook)
  const keyboardBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  // --- serial buffer and runtime refs
  const serialBufferRef = useRef("");

  // keep stable refs for latest values / callbacks
  const itemsRef = useRef<T[]>(items);
  const getBarcodeRef = useRef<BarcodeAccessor<T> | undefined>(getBarcode);
  const onScanSuccessRef = useRef<ScanSuccessHandler<T> | undefined>(onScanSuccess);
  const onScanFailureRef = useRef<ScanFailureHandler | undefined>(onScanFailure);
  const onSerialUnsupportedRef = useRef(onSerialUnsupported);
  const onSerialErrorRef = useRef(onSerialError);

  const optionsRef = useRef<ScannerOptions>({ scanTimeout, minBarcodeLength });
  const serialConfigRef = useRef<SerialRuntimeConfig>({
    ...DEFAULT_SERIAL_RUNTIME,
    ...(serial ?? {}),
  });
  const enabledRef = useRef<boolean>(enabled);

  const reconnectIntervalRef = useRef<number | null>(null);

  // --- helper to reset keyboard buffer
  const resetKeyboardBuffer = useCallback(() => {
    keyboardBufferRef.current = "";
    lastKeyTimeRef.current = 0;
  }, []);

  // --- process a barcode string, attempt to match item or call failure handler
  const processScannedBarcode = useCallback((rawValue: string) => {
    const barcode = rawValue.trim();
    if (!barcode) return;

    const matchedItem = itemsRef.current.find((item) => {
      const candidate = getBarcodeRef.current?.(item) ?? getFallbackBarcode(item);
      return candidate === barcode;
    });

    if (matchedItem) {
      onScanSuccessRef.current?.(matchedItem, barcode);
    } else {
      onScanFailureRef.current?.(barcode);
    }
  }, []);

  // --- Ensure a global serial port is opened (shares across hook instances)
  const ensureGlobalPortOpen = useCallback(async (): Promise<SerialPort | null> => {
    if (GLOBAL_SERIAL_PORT && GLOBAL_SERIAL_PORT.readable) {
      return GLOBAL_SERIAL_PORT;
    }

    const serialApi = getSerialApi();
    if (!serialApi) {
      onSerialUnsupportedRef.current?.();
      return null;
    }

    if (GLOBAL_IS_OPENING) {
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 50));
        if (GLOBAL_SERIAL_PORT?.readable) return GLOBAL_SERIAL_PORT;
        if (!GLOBAL_IS_OPENING) break;
      }
    }

    GLOBAL_IS_OPENING = true;

    try {
      // IMPORTANT:
      // Option C → NEVER call requestPort().
      // Only check getPorts() and auto-connect if allowed.
      const ports = await serialApi.getPorts();
      const port = ports[0] ?? null;

      if (!port) {
        // Scanner not plugged OR permission not granted earlier.
        // Do nothing — reconnect interval will retry automatically.
        return null;
      }

      if (!port.readable) {
        await port.open({ baudRate: serialConfigRef.current.baudRate });
      }

      GLOBAL_SERIAL_PORT = port;
      return port;
    } catch (error) {
      onSerialErrorRef.current?.(error);
      console.error("ensureGlobalPortOpen error:", error);
      return null;
    } finally {
      GLOBAL_IS_OPENING = false;
    }
  }, []);

  // --- Start the global read loop (single reader for all hook instances)
  const startGlobalReadLoop = useCallback(
    async (port: SerialPort) => {
      if (!port) return;
      if (!enabledRef.current) return;
      if (!serialConfigRef.current.enabled) return;
      if (GLOBAL_IS_READING) return;
      if (!port.readable) return;

      GLOBAL_IS_READING = true;
      serialBufferRef.current = "";

      try {
        const reader = port.readable.getReader();
        GLOBAL_SERIAL_READER = reader;

        while (enabledRef.current && serialConfigRef.current.enabled) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value && value.length) {
            const chunk = new TextDecoder().decode(value, { stream: true });
            serialBufferRef.current += chunk;
            const normalized = serialBufferRef.current.replace(/\r\n/g, "\n");
            const parts = normalized.split(/\r|\n/);
            for (let i = 0; i < parts.length - 1; i += 1) {
              const line = parts[i]?.trim();
              if (line) processScannedBarcode(line);
            }
            serialBufferRef.current = parts[parts.length - 1] ?? "";
          }
        }
      } catch (error) {
        onSerialErrorRef.current?.(error);
        console.error("Global read loop error:", error);
      } finally {
        // clean up reader
        try {
          if (GLOBAL_SERIAL_READER) {
            try {
              await GLOBAL_SERIAL_READER.cancel();
            } catch (_) {
              // ignore
            }
            try {
              GLOBAL_SERIAL_READER.releaseLock();
            } catch (_) {
              // ignore
            }
          }
        } catch (_) {
          // noop
        }
        GLOBAL_SERIAL_READER = null;
        GLOBAL_IS_READING = false;

        // If the port isn't readable anymore, drop the reference so it can reconnect later
        try {
          if (GLOBAL_SERIAL_PORT && !GLOBAL_SERIAL_PORT.readable) {
            GLOBAL_SERIAL_PORT = null;
          }
        } catch (_) {
          // ignore
        }
      }
    },
    [processScannedBarcode]
  );

  const stopGlobalReadLoop = useCallback(async () => {
    if (!GLOBAL_SERIAL_READER) return;
    try {
      await GLOBAL_SERIAL_READER.cancel();
    } catch (_) {
      // ignore
    }
    try {
      GLOBAL_SERIAL_READER.releaseLock();
    } catch (_) {
      // ignore
    }
    GLOBAL_SERIAL_READER = null;
    GLOBAL_IS_READING = false;
  }, []);

  const disconnectGlobalPort = useCallback(async () => {
    await stopGlobalReadLoop();
    if (GLOBAL_SERIAL_PORT) {
      try {
        // close is asynchronous; some implementations require closing
        await (GLOBAL_SERIAL_PORT as any).close?.();
      } catch (err) {
        console.warn("Error closing global serial port:", err);
      } finally {
        GLOBAL_SERIAL_PORT = null;
      }
    }
  }, [stopGlobalReadLoop]);

  const connectAndStart = useCallback(async () => {
    if (!enabledRef.current) return;
    if (!serialConfigRef.current.enabled) return;

    const serialApi = getSerialApi();
    if (!serialApi) {
      onSerialUnsupportedRef.current?.();
      console.warn("Web Serial API not available");
      return;
    }

    if (GLOBAL_SERIAL_PORT && GLOBAL_IS_READING) {
      return;
    }

    try {
      const port = await ensureGlobalPortOpen();
      if (!port) return;
      await startGlobalReadLoop(port);
    } catch (err) {
      onSerialErrorRef.current?.(err);
      console.error("connectAndStart error:", err);
    }
  }, [ensureGlobalPortOpen, startGlobalReadLoop]);

  // --- Keep refs up to date whenever inputs change (so callbacks always see latest data)
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    getBarcodeRef.current = getBarcode;
  }, [getBarcode]);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    onScanFailureRef.current = onScanFailure;
  }, [onScanFailure]);

  useEffect(() => {
    onSerialUnsupportedRef.current = onSerialUnsupported;
  }, [onSerialUnsupported]);

  useEffect(() => {
    onSerialErrorRef.current = onSerialError;
  }, [onSerialError]);

  useEffect(() => {
    optionsRef.current = { scanTimeout, minBarcodeLength };
  }, [scanTimeout, minBarcodeLength]);

  useEffect(() => {
    serialConfigRef.current = {
      ...DEFAULT_SERIAL_RUNTIME,
      ...(serial ?? {}),
    };
  }, [serial]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // --- Keyboard scanning (listens for quick key sequences ending with Enter)
  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === "undefined") return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      const { scanTimeout: timeout, minBarcodeLength: minLength } = optionsRef.current;

      if (event.key === "Enter") {
        const maybeScan =
          keyboardBufferRef.current.length >= minLength &&
          now - lastKeyTimeRef.current <= timeout;

        if (maybeScan) {
          event.preventDefault();
          processScannedBarcode(keyboardBufferRef.current);
        }
        resetKeyboardBuffer();
        return;
      }

      if (event.key === "Backspace") {
        resetKeyboardBuffer();
        return;
      }

      if (now - lastKeyTimeRef.current > timeout) {
        resetKeyboardBuffer();
      }

      const isPrintable = event.key.length === 1 && !event.ctrlKey && !event.metaKey;
      if (isPrintable) {
        keyboardBufferRef.current += event.key;
        lastKeyTimeRef.current = now;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      resetKeyboardBuffer();
    };
  }, [enabled, processScannedBarcode, resetKeyboardBuffer]);

  // --- Serial lifecycle: connect/start and reconnection loop
  useEffect(() => {
    if (!enabled) {
      void stopGlobalReadLoop();
      return undefined;
    }

    if (!serialConfigRef.current.enabled) {
      void disconnectGlobalPort();
      return undefined;
    }

    void connectAndStart();

    const intervalId = window.setInterval(() => {
      if (!enabledRef.current) return;
      if (!serialConfigRef.current.enabled) return;
      if (!GLOBAL_SERIAL_PORT) {
        void connectAndStart();
      }
    }, serialConfigRef.current.reconnectIntervalMs);

    reconnectIntervalRef.current = intervalId;

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
      if (!enabledRef.current) {
        void stopGlobalReadLoop();
      }
    };
  }, [connectAndStart, disconnectGlobalPort, stopGlobalReadLoop, enabled]);

  return {
    reset: resetKeyboardBuffer,
  };
};

export default useBarcodeScanner;
