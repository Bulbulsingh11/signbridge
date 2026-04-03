import { useRef, useEffect, useState } from 'react';
import AvatarDisplay from './AvatarDisplay';

export default function OutputPanel({ predictions, currentPrediction, selectedLang, isDetecting }) {
  const scrollRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  // Auto-scroll to latest
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [predictions]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getTranslation = (entry) => {
    if (!entry.translations) return entry.sign;
    return entry.translations[selectedLang] || entry.sign;
  };

  const getLangLabel = (code) => {
    const labels = { english: 'EN', hindi: 'HI', spanish: 'ES' };
    return labels[code] || 'EN';
  };

  return (
    <div className="flex flex-col h-full gap-4" id="output-panel">
      {/* Avatar Section */}
      <div className="glass rounded-2xl p-2 flex-shrink-0">
        <AvatarDisplay 
          currentSign={currentPrediction?.sign} 
          isDetecting={isDetecting} 
        />
      </div>

      {/* Transcript Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-primary)]"></div>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Transcript
          </h2>
          <span className="text-[10px] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded-full bg-white/5">
            {predictions.length}
          </span>
        </div>
        <span className="text-[10px] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full glass">
          {getLangLabel(selectedLang)}
        </span>
      </div>

      {/* Transcript Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl glass p-3 space-y-2 min-h-[200px] max-h-[400px]"
        id="transcript-container"
      >
        {predictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">No signs detected yet</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Start the camera and begin signing</p>
            </div>
          </div>
        ) : (
          predictions.map((entry, idx) => (
            <div
              key={entry.id}
              className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-white/5 ${idx === 0 ? 'animate-[slide-up_0.3s_ease-out] bg-[var(--color-accent-primary)]/5 glow-border' : 'border border-transparent'}`}
            >
              {/* Sign Icon */}
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold ${idx === 0
                ? 'bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-success)] text-white'
                : 'bg-white/5 text-[var(--color-text-muted)]'
              }`}>
                ✋
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {entry.sign}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    entry.confidence > 0.9 ? 'bg-[var(--color-accent-success)]/20 text-[var(--color-accent-success)]'
                    : entry.confidence > 0.8 ? 'bg-[var(--color-accent-warning)]/20 text-[var(--color-accent-warning)]'
                    : 'bg-[var(--color-accent-danger)]/20 text-[var(--color-accent-danger)]'
                  }`}>
                    {Math.round(entry.confidence * 100)}%
                  </span>
                </div>

                {/* Translation */}
                {selectedLang !== 'english' && (
                  <p className="text-xs text-[var(--color-accent-secondary)] mt-0.5">
                    → {getTranslation(entry)}
                  </p>
                )}

                {/* Timestamp */}
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  {entry.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {/* Copy Button */}
              <button
                onClick={() => copyToClipboard(getTranslation(entry), entry.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 transition-all duration-150 cursor-pointer"
                title="Copy translation"
              >
                {copiedId === entry.id ? (
                  <svg className="w-3.5 h-3.5 text-[var(--color-accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
