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
    intervalRef.current = setInterval(async () => {
      const frame = captureFrame();
      if (!frame) return;

      frameCountRef.current++;

      try {
        const result = await predictSign(frame);
        if (result && result.prediction) {
          const entry = {
            id: Date.now(),
            sign: result.prediction,
            confidence: result.confidence || 0,
            translations: result.translations || {},
            timestamp: new Date(),
          };

          setCurrentPrediction(entry);
          setConfidence(Math.round((result.confidence || 0) * 100));
          setPredictions(prev => [entry, ...prev].slice(0, 50)); // Keep last 50
        }
      } catch (err) {
        console.error('Prediction error:', err);
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
