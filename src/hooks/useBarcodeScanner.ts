import { useEffect, useRef } from "react";

const DEFAULT_SCAN_TIMEOUT = 50;
const DEFAULT_MIN_LENGTH = 4;

type BarcodeAccessor<T> = (item: T) => string | null | undefined;
type ScanSuccessHandler<T> = (item: T, barcode: string) => void;
type ScanFailureHandler = (barcode: string) => void;

type ScannerOptions = {
  scanTimeout: number;
  minBarcodeLength: number;
};

export type UseBarcodeScannerOptions<T> = {
  enabled?: boolean;
  items?: T[];
  getBarcode?: BarcodeAccessor<T>;
  onScanSuccess?: ScanSuccessHandler<T>;
  onScanFailure?: ScanFailureHandler;
  scanTimeout?: number;
  minBarcodeLength?: number;
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

/**
 * Listens to keyboard events and attempts to match rapid sequences against a data source.
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
}: UseBarcodeScannerOptions<T> = {}): UseBarcodeScannerReturn => {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const itemsRef = useRef<T[]>(items);
  const getBarcodeRef = useRef<BarcodeAccessor<T> | undefined>(getBarcode);
  const onScanSuccessRef = useRef<ScanSuccessHandler<T> | undefined>(
    onScanSuccess
  );
  const onScanFailureRef = useRef<ScanFailureHandler | undefined>(
    onScanFailure
  );
  const optionsRef = useRef<ScannerOptions>({ scanTimeout, minBarcodeLength });

  const resetBuffer = () => {
    bufferRef.current = "";
    lastKeyTimeRef.current = 0;
  };

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
    if (!enabled || typeof window === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      const { scanTimeout: timeout, minBarcodeLength: minLength } =
        optionsRef.current;

      if (event.key === "Enter") {
        const isPotentialScan =
          bufferRef.current.length >= minLength &&
          now - lastKeyTimeRef.current <= timeout;

        if (isPotentialScan) {
          event.preventDefault();
          const scannedBarcode = bufferRef.current;
          const matchedItem = itemsRef.current.find((item) => {
            const barcode =
              getBarcodeRef.current?.(item) ?? getFallbackBarcode(item);
            return barcode === scannedBarcode;
          });

          if (matchedItem) {
            onScanSuccessRef.current?.(matchedItem, scannedBarcode);
          } else if (scannedBarcode) {
            onScanFailureRef.current?.(scannedBarcode);
          }
        }

        resetBuffer();
        return;
      }

      if (event.key === "Backspace") {
        resetBuffer();
        return;
      }

      if (now - lastKeyTimeRef.current > timeout) {
        resetBuffer();
      }

      const isPrintableKey =
        event.key.length === 1 && !event.ctrlKey && !event.metaKey;

      if (isPrintableKey) {
        bufferRef.current += event.key;
        lastKeyTimeRef.current = now;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      resetBuffer();
    };
  }, [enabled]);

  return { reset: resetBuffer };
};

export default useBarcodeScanner;
