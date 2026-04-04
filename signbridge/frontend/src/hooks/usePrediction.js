import { useState, useRef, useCallback, useEffect } from 'react';
import { predictSign } from '../api/signbridge';

export function usePrediction(captureFrame, isWebcamActive) {
  const [predictions, setPredictions] = useState([]);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [fps, setFps] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const intervalRef = useRef(null);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef(null);

  const startDetection = useCallback(() => {
    if (!isWebcamActive) return;
    setIsDetecting(true);

    // FPS counter
    frameCountRef.current = 0;
    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    // Prediction loop — every 500ms
    const lastSignRef = { current: null };
    const stabilityCounterRef = { current: 0 };
    const isProcessingRef = { current: false };
    const STABILITY_THRESHOLD = 3; // Number of detections needed for a sign to be 'finalized'

    intervalRef.current = setInterval(async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const frame = captureFrame();
        if (!frame) {
          isProcessingRef.current = false;
          return;
        }

        frameCountRef.current++;

        const result = await predictSign(frame);
        if (result && result.prediction) {
          const sign = result.prediction;
          const conf = result.confidence || 0;
          
          const entry = {
            id: Date.now(),
            sign: sign,
            confidence: conf,
            isMock: result.isMock || false,
            translations: result.translations || {},
            timestamp: new Date(),
          };

          setCurrentPrediction(entry);
          setConfidence(Math.round(conf * 100));

          // --- Sign History Logic (Debounced/Smoothed) ---
          // Only add to transcript if:
          // 1. It's high confidence (> 0.7)
          // 2. It's different from the last added sign OR enough time passed
          if (conf > 0.7) {
            if (sign !== lastSignRef.current) {
              stabilityCounterRef.current++;
              
              if (stabilityCounterRef.current >= STABILITY_THRESHOLD) {
                setPredictions(prev => [entry, ...prev].slice(0, 50));
                lastSignRef.current = sign;
                stabilityCounterRef.current = 0;
              }
            } else {
              // Sign is the same, reset counter to avoid re-adding
              stabilityCounterRef.current = 0;
            }
          }
        } else {
          // No hand/sign detected, reset stability
          setCurrentPrediction(null);
          setConfidence(0);
          stabilityCounterRef.current = 0;
        }
      } catch (err) {
        console.error('Prediction error:', err);
      } finally {
        isProcessingRef.current = false;
      }
    }, 500);
  }, [captureFrame, isWebcamActive]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }
    setFps(0);
  }, []);

  // Stop detection when webcam turns off — use a ref to avoid sync setState in effect
  const isDetectingRef = useRef(false);
  useEffect(() => {
    isDetectingRef.current = isDetecting;
  }, [isDetecting]);

  useEffect(() => {
    if (!isWebcamActive && isDetectingRef.current) {
      // Clear intervals first (side effects), then update state via timeout to break sync chain
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (fpsIntervalRef.current) { clearInterval(fpsIntervalRef.current); fpsIntervalRef.current = null; }
      const t = setTimeout(() => { setIsDetecting(false); setFps(0); }, 0);
      return () => clearTimeout(t);
    }
  }, [isWebcamActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
    };
  }, []);

  return {
    predictions,
    currentPrediction,
    isDetecting,
    fps,
    confidence,
    startDetection,
    stopDetection,
    clearPredictions: () => setPredictions([]),
  };
}
