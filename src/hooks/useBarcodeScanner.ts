import { useCallback, useEffect, useRef } from "react";

const DEFAULT_SCAN_TIMEOUT = 50;
const DEFAULT_MIN_LENGTH = 4;
const DEFAULT_BAUD_RATE = 9600;
const DEFAULT_RECONNECT_INTERVAL = 30000;

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

type SerialPortLike = {
  readable?: ReadableStream<Uint8Array> | null;
  writable?: WritableStream<Uint8Array> | null;
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
};

type SerialApi = {
  getPorts: () => Promise<SerialPortLike[]>;
  requestPort: () => Promise<SerialPortLike>;
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
  if (!item || typeof item !== "object") {
    return undefined;
  }

  const candidate = item as Record<string, unknown>;
  const rawValue =
    candidate.product_barcode ?? candidate.barcode ?? candidate.id;

  if (typeof rawValue === "number") {
    return String(rawValue);
  }

  return typeof rawValue === "string" ? rawValue : undefined;
};

const getSerialApi = (): SerialApi | null => {
  if (typeof navigator === "undefined") {
    return null;
  }
  const serialNavigator = navigator as Navigator & { serial?: SerialApi };
  return serialNavigator.serial ?? null;
};

const DEFAULT_SERIAL_CONFIG: SerialRuntimeConfig = {
  enabled: true,
  baudRate: DEFAULT_BAUD_RATE,
  reconnectIntervalMs: DEFAULT_RECONNECT_INTERVAL,
  requestOnConnect: true,
};

/**
 * Listens to keyboard events and Web Serial API streams to detect barcode scans.
 * Invokes callbacks when a matching barcode is found or when a scan does not match anything.
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
  const keyboardBufferRef = useRef("");
  const serialBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const itemsRef = useRef<T[]>(items);
  const getBarcodeRef = useRef<BarcodeAccessor<T> | undefined>(getBarcode);
  const onScanSuccessRef = useRef<ScanSuccessHandler<T> | undefined>(
    onScanSuccess
  );
  const onScanFailureRef = useRef<ScanFailureHandler | undefined>(
    onScanFailure
  );
  const onSerialUnsupportedRef = useRef(onSerialUnsupported);
  const onSerialErrorRef = useRef(onSerialError);
  const optionsRef = useRef<ScannerOptions>({ scanTimeout, minBarcodeLength });
  const serialConfigRef = useRef<SerialRuntimeConfig>({
    ...DEFAULT_SERIAL_CONFIG,
    ...(serial ?? {}),
  });
  const enabledRef = useRef(enabled);

  const portRef = useRef<SerialPortLike | null>(null);
  const readerRef =
    useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const decoderRef = useRef(new TextDecoder());
  const isConnectingRef = useRef(false);
  const isReadingRef = useRef(false);
  const reconnectIntervalRef = useRef<number | null>(null);
  const automaticRequestBlockedRef = useRef(false);
  const serialUnsupportedNotifiedRef = useRef(false);

  const resetKeyboardBuffer = useCallback(() => {
    keyboardBufferRef.current = "";
    lastKeyTimeRef.current = 0;
  }, []);

  const processScannedBarcode = useCallback((rawValue: string) => {
    const barcode = rawValue.trim();
    if (!barcode) {
      return;
    }

    const matchedItem = itemsRef.current.find((item) => {
      const candidate =
        getBarcodeRef.current?.(item) ?? getFallbackBarcode(item);
      return candidate === barcode;
    });

    if (matchedItem) {
      onScanSuccessRef.current?.(matchedItem, barcode);
    } else {
      onScanFailureRef.current?.(barcode);
    }
  }, []);

  const ensurePortOpen = useCallback(async (serialPort: SerialPortLike) => {
    if (serialPort.readable) {
      return;
    }

    try {
      await serialPort.open({ baudRate: serialConfigRef.current.baudRate });
    } catch (error) {
      onSerialErrorRef.current?.(error);
      console.error("Failed to open serial port:", error);
      throw error;
    }
  }, []);

  const handleBarcodeMatch = useCallback(
    (rawValue: string) => {
      processScannedBarcode(rawValue);
    },
    [processScannedBarcode]
  );

  const handleIncomingChunk = useCallback(
    (chunk: string) => {
    serialBufferRef.current += chunk;
    const normalized = serialBufferRef.current.replace(/\r\n/g, "\n");
    const parts = normalized.split(/\r|\n/);

    for (let index = 0; index < parts.length - 1; index += 1) {
      const line = parts[index]?.trim();
      if (line) {
        handleBarcodeMatch(line);
      }
    }

    serialBufferRef.current = parts[parts.length - 1] ?? "";
    },
    [handleBarcodeMatch]
  );

  const stopReading = useCallback(async () => {
    const reader = readerRef.current;
    readerRef.current = null;
    serialBufferRef.current = "";
    isReadingRef.current = false;

    if (!reader) {
      return;
    }

    try {
      await reader.cancel();
    } catch (error) {
      onSerialErrorRef.current?.(error);
      console.warn("Error cancelling reader:", error);
    }

    try {
      reader.releaseLock();
    } catch (error) {
      onSerialErrorRef.current?.(error);
      console.warn("Error releasing reader lock:", error);
    }
  }, []);

  const startReading = useCallback(
    async (activePort: SerialPortLike | null = portRef.current) => {
    if (
      !activePort ||
      !enabledRef.current ||
      !serialConfigRef.current.enabled ||
      isReadingRef.current ||
      !activePort.readable
    ) {
      return;
    }

    serialBufferRef.current = "";
    isReadingRef.current = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      reader = activePort.readable.getReader();
      readerRef.current = reader;

      while (enabledRef.current) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          const chunk = decoderRef.current.decode(value, { stream: true });
          handleIncomingChunk(chunk);
        }
      }
    } catch (error) {
      onSerialErrorRef.current?.(error);
      console.error("Read loop error:", error);
    } finally {
      serialBufferRef.current = "";
      if (reader) {
        try {
          reader.releaseLock();
        } catch (error) {
          onSerialErrorRef.current?.(error);
          console.warn("Error releasing reader lock:", error);
        }
      }

      readerRef.current = null;
      isReadingRef.current = false;

      if (!activePort.readable && portRef.current === activePort) {
        portRef.current = null;
      }
    }
    },
    [handleIncomingChunk]
  );

  const connectPort = useCallback(async () => {
    if (
      isConnectingRef.current ||
      portRef.current ||
      !enabledRef.current ||
      !serialConfigRef.current.enabled
    ) {
      return;
    }

    const serialApi = getSerialApi();
    if (!serialApi) {
      if (!serialUnsupportedNotifiedRef.current) {
        serialUnsupportedNotifiedRef.current = true;
        onSerialUnsupportedRef.current?.();
        console.warn("Web Serial API is not supported in this browser.");
      }
      return;
    }

    isConnectingRef.current = true;

    try {
      const availablePorts = await serialApi.getPorts();
      let serialPort: SerialPortLike | null =
        availablePorts.length > 0 ? availablePorts[0] : null;

      if (
        !serialPort &&
        serialConfigRef.current.requestOnConnect &&
        !automaticRequestBlockedRef.current
      ) {
        try {
          serialPort = await serialApi.requestPort();
        } catch (error) {
          automaticRequestBlockedRef.current = true;
          onSerialErrorRef.current?.(error);
          console.warn("Serial port permission request failed:", error);
          return;
        }
      }

      if (!serialPort) {
        return;
      }

      await ensurePortOpen(serialPort);
      portRef.current = serialPort;
      await startReading(serialPort);
    } catch (error) {
      onSerialErrorRef.current?.(error);
      console.error("Failed to connect to serial port:", error);
    } finally {
      isConnectingRef.current = false;
    }
  }, [ensurePortOpen, startReading]);

  const disconnectPort = useCallback(async () => {
    const activePort = portRef.current;
    await stopReading();

    if (!activePort) {
      return;
    }

    try {
      await activePort.close();
    } catch (error) {
      onSerialErrorRef.current?.(error);
      console.warn("Error closing serial port:", error);
    } finally {
      portRef.current = null;
    }
  }, [stopReading]);

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
    optionsRef.current = { scanTimeout, minBarcodeLength };
  }, [scanTimeout, minBarcodeLength]);

  useEffect(() => {
    serialConfigRef.current = {
      ...DEFAULT_SERIAL_CONFIG,
      ...(serial ?? {}),
    };
  }, [serial]);

  useEffect(() => {
    onSerialUnsupportedRef.current = onSerialUnsupported;
  }, [onSerialUnsupported]);

  useEffect(() => {
    onSerialErrorRef.current = onSerialError;
  }, [onSerialError]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled, processScannedBarcode, resetKeyboardBuffer]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      const { scanTimeout: timeout, minBarcodeLength: minLength } =
        optionsRef.current;

      if (event.key === "Enter") {
        const isPotentialScan =
          keyboardBufferRef.current.length >= minLength &&
          now - lastKeyTimeRef.current <= timeout;

        if (isPotentialScan) {
          event.preventDefault();
          const scannedBarcode = keyboardBufferRef.current;
          processScannedBarcode(scannedBarcode);
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

      const isPrintableKey =
        event.key.length === 1 && !event.ctrlKey && !event.metaKey;

      if (isPrintableKey) {
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

  useEffect(() => {
    if (
      !enabled ||
      typeof window === "undefined" ||
      typeof navigator === "undefined"
    ) {
      return () => {
        void disconnectPort();
      };
    }

    if (!serialConfigRef.current.enabled) {
      return () => {
        void disconnectPort();
      };
    }

    void connectPort();

    const intervalId = window.setInterval(() => {
      if (
        !enabledRef.current ||
        portRef.current ||
        !serialConfigRef.current.enabled
      ) {
        return;
      }
      void connectPort();
    }, serialConfigRef.current.reconnectIntervalMs);

    reconnectIntervalRef.current = intervalId;

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
      void disconnectPort();
    };
  }, [connectPort, disconnectPort, enabled, serial]);

  return { reset: resetKeyboardBuffer };
};

export default useBarcodeScanner;
