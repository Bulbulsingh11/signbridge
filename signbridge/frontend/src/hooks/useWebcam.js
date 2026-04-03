import { useState, useRef, useCallback, useEffect } from 'react';

export function useWebcam() {
  // Refs for video element, hidden canvas, and media stream
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  // State flags
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  // Permission: true = granted, false = denied, null = not asked yet
  const [hasPermission, setHasPermission] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      // Store the stream for later cleanup
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setHasPermission(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access.'
        : 'Could not access camera. Please check your device.');
      setHasPermission(false);
      setIsActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    // Stop all tracks of the media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    // Detach the stream from the video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const captureFrame = useCallback(() => {
    // Return null if the camera is not ready
    if (!videoRef.current || !canvasRef.current || !isActive) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Use actual video dimensions when available
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // JPEG with moderate compression for faster upload
    return canvas.toDataURL('image/jpeg', 0.7);
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Helper to toggle camera state from UI components
  const toggleCamera = useCallback(() => {
    if (isActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isActive, startCamera, stopCamera]);

  return {
    videoRef,
    canvasRef,
    isActive,
    error,
    hasPermission,
    startCamera,
    stopCamera,
    toggleCamera,
    captureFrame,
  };
}

