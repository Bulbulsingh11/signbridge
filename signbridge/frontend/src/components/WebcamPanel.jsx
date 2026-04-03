export default function WebcamPanel({ videoRef, canvasRef, isActive, isDetecting, error, onStart, onStop }) {
  return (
    <div className="flex flex-col gap-4 h-full" id="webcam-panel">
      {/* Webcam Container */}
      <div className="relative flex-1 rounded-2xl overflow-hidden glass glow-border min-h-[300px]">
        {/* Video Feed */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          playsInline
          muted
        />

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Placeholder when inactive */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-bg-card)]">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-success)]/20 flex items-center justify-center animate-[breathe_3s_ease-in-out_infinite]">
              <svg className="w-10 h-10 text-[var(--color-accent-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[var(--color-text-secondary)] text-sm font-medium">Camera Inactive</p>
              <p className="text-[var(--color-text-muted)] text-xs mt-1">Click Start to begin sign detection</p>
            </div>
          </div>
        )}

        {/* Scanning Line Overlay */}
        {isDetecting && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent-success)] to-transparent opacity-60 animate-[scanning_3s_ease-in-out_infinite]"></div>
          </div>
        )}

        {/* Corner Brackets */}
        {isActive && (
          <div className="absolute inset-4 pointer-events-none">
            {/* TL */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[var(--color-accent-primary)] rounded-tl-lg opacity-60"></div>
            {/* TR */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[var(--color-accent-primary)] rounded-tr-lg opacity-60"></div>
            {/* BL */}
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[var(--color-accent-primary)] rounded-bl-lg opacity-60"></div>
            {/* BR */}
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[var(--color-accent-primary)] rounded-br-lg opacity-60"></div>
          </div>
        )}

        {/* Status Badge */}
        {isActive && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-xs">
            <span className={`w-2 h-2 rounded-full ${isDetecting
              ? 'bg-[var(--color-accent-success)] animate-pulse'
              : 'bg-[var(--color-accent-warning)]'
            }`}></span>
            <span className="text-white/80">
              {isDetecting ? 'Detecting...' : 'Camera Ready'}
            </span>
          </div>
        )}

        {/* Recording Indicator */}
        {isDetecting && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 backdrop-blur-sm text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-red-300 font-medium">REC</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute bottom-3 left-3 right-3 px-4 py-2 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-300 text-xs">
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3" id="webcam-controls">
        {!isActive ? (
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white font-semibold text-sm cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_var(--color-accent-glow)] hover:scale-[1.02] active:scale-[0.98]"
            id="btn-start-camera"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={onStop}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass glass-hover text-[var(--color-accent-danger)] font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-red-500/10 active:scale-[0.98]"
              id="btn-stop-camera"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
