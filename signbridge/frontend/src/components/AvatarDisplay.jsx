export default function AvatarDisplay({ currentSign, isDetecting }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4" id="avatar-display">
      {/* Avatar Container */}
      <div className={`relative w-28 h-28 ${isDetecting ? '' : 'animate-[breathe_3s_ease-in-out_infinite]'}`}>
        {/* Glow Ring */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-success)] opacity-20 blur-lg transition-opacity duration-500 ${isDetecting ? 'opacity-30' : 'opacity-10'}`}></div>

        {/* Avatar Body */}
        <svg className="relative w-full h-full" viewBox="0 0 120 120" fill="none">
          {/* Background Circle */}
          <circle cx="60" cy="60" r="56" fill="url(#avatar-bg)" stroke="url(#avatar-border)" strokeWidth="1.5"/>
          
          {/* Head */}
          <ellipse cx="60" cy="42" rx="18" ry="20" fill="var(--color-accent-secondary)" fillOpacity="0.2" stroke="var(--color-accent-secondary)" strokeWidth="1.2"/>
          
          {/* Eyes */}
          <circle cx="52" cy="39" r="2.5" fill="var(--color-accent-primary)">
            {isDetecting && <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite"/>}
          </circle>
          <circle cx="68" cy="39" r="2.5" fill="var(--color-accent-primary)">
            {isDetecting && <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite"/>}
          </circle>
          
          {/* Mouth - changes based on state */}
          {isDetecting ? (
            <path d="M52 50 Q60 56 68 50" stroke="var(--color-accent-success)" strokeWidth="1.5" fill="none" strokeLinecap="round">
              <animate attributeName="d" values="M52 50 Q60 56 68 50;M52 49 Q60 54 68 49;M52 50 Q60 56 68 50" dur="1.5s" repeatCount="indefinite"/>
            </path>
          ) : (
            <path d="M54 49 Q60 52 66 49" stroke="var(--color-accent-secondary)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          )}

          {/* Body */}
          <path d="M38 75 Q38 64 60 64 Q82 64 82 75 L82 90 Q82 95 77 95 L43 95 Q38 95 38 90 Z" 
                fill="var(--color-accent-primary)" fillOpacity="0.15" stroke="var(--color-accent-primary)" strokeWidth="1"/>

          {/* Left Hand */}
          <g className={isDetecting ? '' : ''}>
            <circle cx="30" cy="78" r="6" fill="var(--color-accent-secondary)" fillOpacity="0.25" stroke="var(--color-accent-secondary)" strokeWidth="1">
              {isDetecting && (
                <>
                  <animate attributeName="cx" values="30;26;30;34;30" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="cy" values="78;72;68;72;78" dur="2s" repeatCount="indefinite"/>
                </>
              )}
            </circle>
            {/* Fingers */}
            <line x1="30" y1="72" x2="28" y2="68" stroke="var(--color-accent-secondary)" strokeWidth="0.8" strokeLinecap="round">
              {isDetecting && (
                <>
                  <animate attributeName="x1" values="30;26;30;34;30" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="y1" values="72;66;62;66;72" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="x2" values="28;24;28;32;28" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="y2" values="68;62;58;62;68" dur="2s" repeatCount="indefinite"/>
                </>
              )}
            </line>
          </g>

          {/* Right Hand */}
          <g>
            <circle cx="90" cy="78" r="6" fill="var(--color-accent-success)" fillOpacity="0.25" stroke="var(--color-accent-success)" strokeWidth="1">
              {isDetecting && (
                <>
                  <animate attributeName="cx" values="90;94;90;86;90" dur="1.8s" repeatCount="indefinite"/>
                  <animate attributeName="cy" values="78;72;66;72;78" dur="1.8s" repeatCount="indefinite"/>
                </>
              )}
            </circle>
            <line x1="90" y1="72" x2="92" y2="68" stroke="var(--color-accent-success)" strokeWidth="0.8" strokeLinecap="round">
              {isDetecting && (
                <>
                  <animate attributeName="x1" values="90;94;90;86;90" dur="1.8s" repeatCount="indefinite"/>
                  <animate attributeName="y1" values="72;66;60;66;72" dur="1.8s" repeatCount="indefinite"/>
                  <animate attributeName="x2" values="92;96;92;88;92" dur="1.8s" repeatCount="indefinite"/>
                  <animate attributeName="y2" values="68;62;56;62;68" dur="1.8s" repeatCount="indefinite"/>
                </>
              )}
            </line>
          </g>

          {/* Arms connecting body to hands */}
          <line x1="38" y1="75" x2="30" y2="78" stroke="var(--color-accent-primary)" strokeWidth="0.8" strokeLinecap="round" opacity="0.5">
            {isDetecting && (
              <>
                <animate attributeName="x2" values="30;26;30;34;30" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="y2" values="78;72;68;72;78" dur="2s" repeatCount="indefinite"/>
              </>
            )}
          </line>
          <line x1="82" y1="75" x2="90" y2="78" stroke="var(--color-accent-primary)" strokeWidth="0.8" strokeLinecap="round" opacity="0.5">
            {isDetecting && (
              <>
                <animate attributeName="x2" values="90;94;90;86;90" dur="1.8s" repeatCount="indefinite"/>
                <animate attributeName="y2" values="78;72;66;72;78" dur="1.8s" repeatCount="indefinite"/>
              </>
            )}
          </line>

          <defs>
            <radialGradient id="avatar-bg" cx="0.5" cy="0.4" r="0.6">
              <stop offset="0" stopColor="var(--color-accent-primary)" stopOpacity="0.08"/>
              <stop offset="1" stopColor="var(--color-bg-card)" stopOpacity="0.95"/>
            </radialGradient>
            <linearGradient id="avatar-border" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--color-accent-primary)" stopOpacity="0.3"/>
              <stop offset="1" stopColor="var(--color-accent-success)" stopOpacity="0.3"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Current Sign Label */}
      <div className="text-center">
        {currentSign ? (
          <div className="animate-[fade-in_0.3s_ease-out]">
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">Signing</p>
            <p className="text-lg font-bold text-gradient">{currentSign}</p>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)]">
            {isDetecting ? 'Waiting for signs...' : 'Idle'}
          </p>
        )}
      </div>
    </div>
  );
}
