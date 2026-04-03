export default function StatusBar({ isConnected, isDetecting, fps, confidence, lastSign }) {
  return (
    <footer className="glass px-6 py-2.5 flex items-center justify-between text-xs" id="status-bar">
      {/* Left: Connection + Detection */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected
            ? 'bg-[var(--color-accent-success)]'
            : 'bg-[var(--color-accent-danger)]'
          }`}></span>
          <span className="text-[var(--color-text-muted)]">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div className="w-px h-3 bg-[var(--color-border-default)]"></div>

        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isDetecting
            ? 'bg-[var(--color-accent-success)] animate-pulse'
            : 'bg-[var(--color-text-muted)]'
          }`}></span>
          <span className="text-[var(--color-text-muted)]">
            {isDetecting ? 'Detecting' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Center: Last Sign */}
      {lastSign && (
        <div className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-[var(--color-accent-primary)]/10">
          <span className="text-[var(--color-text-muted)]">Last:</span>
          <span className="text-[var(--color-accent-secondary)] font-medium">{lastSign}</span>
        </div>
      )}

      {/* Right: FPS + Confidence */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--color-text-muted)]">FPS</span>
          <span className={`font-mono font-medium ${fps > 0 ? 'text-[var(--color-accent-success)]' : 'text-[var(--color-text-muted)]'}`}>
            {fps}
          </span>
        </div>

        <div className="w-px h-3 bg-[var(--color-border-default)]"></div>

        <div className="flex items-center gap-1.5">
          <span className="text-[var(--color-text-muted)]">Conf</span>
          <span className={`font-mono font-medium ${
            confidence > 90 ? 'text-[var(--color-accent-success)]'
            : confidence > 70 ? 'text-[var(--color-accent-warning)]'
            : confidence > 0 ? 'text-[var(--color-accent-danger)]'
            : 'text-[var(--color-text-muted)]'
          }`}>
            {confidence > 0 ? `${confidence}%` : '--'}
          </span>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="hidden md:flex items-center gap-1 text-[var(--color-text-muted)]">
          <span className="px-1 py-0.5 rounded bg-white/5 text-[10px] font-mono">Space</span>
          <span className="text-[10px]">toggle</span>
        </div>
      </div>
    </footer>
  );
}
