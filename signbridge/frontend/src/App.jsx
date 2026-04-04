import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import WebcamPanel from './components/WebcamPanel';
import OutputPanel from './components/OutputPanel';
import StatusBar from './components/StatusBar';
import { useWebcam } from './hooks/useWebcam';
import { usePrediction } from './hooks/usePrediction';
import { checkHealth } from './api/signbridge';

export default function App() {
  const [selectedLang, setSelectedLang] = useState('english');
  const [isConnected, setIsConnected] = useState(false);

  const {
    videoRef,
    canvasRef,
    isActive: isCameraActive,
    error: cameraError,
    startCamera,
    stopCamera,
    captureFrame,
  } = useWebcam();

  const {
    predictions,
    currentPrediction,
    isDetecting,
    fps,
    confidence,
    startDetection,
    stopDetection,
  } = usePrediction(captureFrame, isCameraActive);

  // ── Health Check ──
  useEffect(() => {
    const check = async () => {
      const healthy = await checkHealth();
      setIsConnected(healthy);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Auto-start detection when camera becomes active ──
  // useEffect ensures we always see the latest isCameraActive state,
  // avoiding the stale-closure bug of calling startDetection() in a setTimeout.
  useEffect(() => {
    if (isCameraActive && !isDetecting) {
      startDetection();
    }
  }, [isCameraActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start/Stop Handlers ──
  const handleStart = useCallback(async () => {
    await startCamera();
  }, [startCamera]);

  const handleStop = useCallback(() => {
    stopDetection();
    stopCamera();
  }, [stopDetection, stopCamera]);

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space — toggle camera + detection
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (isCameraActive) {
          handleStop();
        } else {
          handleStart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCameraActive, handleStart, handleStop]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Navbar */}
      <Navbar
        isConnected={isConnected}
        selectedLang={selectedLang}
        onLangChange={setSelectedLang}
      />

      {/* Main Content — Two Panel Layout */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 lg:p-6 overflow-hidden min-h-0">
        {/* Left Panel — Webcam */}
        <section className="w-full lg:w-1/2 flex flex-col animate-[fade-in_0.5s_ease-out]" aria-label="Webcam Feed">
          <WebcamPanel
            videoRef={videoRef}
            canvasRef={canvasRef}
            isActive={isCameraActive}
            isDetecting={isDetecting}
            error={cameraError}
            onStart={handleStart}
            onStop={handleStop}
          />
        </section>

        {/* Right Panel — Output + Avatar */}
        <section className="w-full lg:w-1/2 flex flex-col animate-[slide-in-right_0.5s_ease-out]" aria-label="Recognition Output">
          <OutputPanel
            predictions={predictions}
            currentPrediction={currentPrediction}
            selectedLang={selectedLang}
            isDetecting={isDetecting}
          />
        </section>
      </main>

      {/* Status Bar */}
      <StatusBar
        isConnected={isConnected}
        isDetecting={isDetecting}
        fps={fps}
        confidence={confidence}
        lastSign={currentPrediction?.sign}
      />
    </div>
  );
}
