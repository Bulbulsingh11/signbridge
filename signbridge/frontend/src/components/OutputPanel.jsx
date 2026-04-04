import { useRef, useEffect, useState } from 'react';
import AvatarDisplay from './AvatarDisplay';
import SignDictionary from './SignDictionary';
import { SIGN_LIBRARY, ISL_ALPHABET } from '../data/signData';

// ── Mini finger bar chart ──
const FINGER_MAX_H = [22, 32, 36, 32, 28];

function MiniHand({ fingers }) {
  return (
    <div className="flex gap-[3px] items-end justify-center mt-1">
      {fingers.map((extended, i) => (
        <div key={i} style={{
          width: 7,
          height: extended ? FINGER_MAX_H[i] : 9,
          borderRadius: 4,
          background: extended
            ? 'linear-gradient(to top, var(--color-accent-primary), var(--color-accent-secondary))'
            : 'rgba(255,255,255,0.15)',
          transition: 'height 0.3s ease',
        }} />
      ))}
    </div>
  );
}

// ── Sentence Builder ──
// Accumulates detected signs into a readable sentence strip
function SentenceBuilder({ predictions }) {
  const sentenceRef = useRef(null);
  // Build a de-duplicated sentence from consecutive unique signs
  const sentence = [];
  let lastSign = null;
  for (const p of [...predictions].reverse()) {
    const sign = p.sign?.toLowerCase();
    if (sign && sign !== lastSign && sign !== 'unknown') {
      sentence.push(p.sign);
      lastSign = sign;
    }
  }

  useEffect(() => {
    if (sentenceRef.current) {
      sentenceRef.current.scrollLeft = sentenceRef.current.scrollWidth;
    }
  }, [sentence.length]);

  if (sentence.length === 0) return null;

  return (
    <div className="glass rounded-xl px-3 py-2 flex-shrink-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-[var(--color-accent-success)] font-bold uppercase tracking-wider">Sentence</span>
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-[10px] text-[var(--color-text-muted)]">{sentence.length} words</span>
      </div>
      <div 
        ref={sentenceRef}
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {sentence.map((word, i) => (
          <span 
            key={i}
            className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-secondary)] text-xs font-medium animate-[fade-in_0.3s_ease-out]"
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Text/Speech to Sign ──
function TextToSign({ onSignTrigger }) {
  const [text, setText] = useState('');
  const [signs, setSigns] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [spellingChar, setSpellingChar] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
      };
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [SpeechRecognition]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setText('');
      recognitionRef.current?.start();
    }
  };

  const handleLookup = () => {
    if (!text.trim()) return;
    const words = text.trim().toLowerCase().replace(/[^a-z0-9_\s]/g, '').split(/\s+/);
    const results = words.map(word => ({
      word,
      sign: SIGN_LIBRARY[word] || null,
    }));
    setSigns(results);
    setHasSearched(true);
    setActiveIndex(-1);
    setSpellingChar(null);
  };

  // Plays known signs normally, and fingerspells unknown words letter-by-letter
  const playSequence = async () => {
    if (isPlaying || signs.length === 0) return;
    setIsPlaying(true);
    
    for (let i = 0; i < signs.length; i++) {
      setActiveIndex(i);
      
      if (signs[i].sign) {
        // Known sign — show it on avatar
        onSignTrigger(signs[i].word);
        setSpellingChar(null);
        await new Promise(r => setTimeout(r, 1500));
      } else {
        // Unknown word — fingerspell it letter by letter
        const letters = signs[i].word.split('');
        for (const letter of letters) {
          if (ISL_ALPHABET[letter]) {
            setSpellingChar(letter.toUpperCase());
            // Trigger a special sign that AvatarDisplay can interpret
            onSignTrigger(`__spell_${letter}`);
            await new Promise(r => setTimeout(r, 800));
          }
        }
        setSpellingChar(null);
      }
    }
    
    setActiveIndex(-1);
    setSpellingChar(null);
    setIsPlaying(false);
    onSignTrigger(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLookup();
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Type or speak words (e.g. Hello Maya)..."}
            className="w-full pl-4 pr-20 py-2.5 rounded-xl glass text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none border border-white/10 focus:border-[var(--color-accent-primary)]/50 transition-all duration-200"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {text && (
              <button 
                onClick={() => setText('')}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Clear"
              >✕</button>
            )}
            {SpeechRecognition && (
              <button
                onClick={toggleListening}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-red-500/20 text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10'
                }`}
                title={isListening ? "Stop Listening" : "Speech to Gestures"}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <button
          onClick={handleLookup}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white font-semibold text-sm cursor-pointer hover:opacity-90 transition-all duration-200 active:scale-95 whitespace-nowrap"
        >
          Check Signs
        </button>
      </div>

      {/* Play Controls + Spelling indicator */}
      {hasSearched && signs.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={playSequence}
            disabled={isPlaying}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${
              isPlaying 
                ? 'bg-[var(--color-accent-success)]/20 text-[var(--color-accent-success)] cursor-wait'
                : 'bg-white/5 hover:bg-white/10 text-white cursor-pointer active:bg-white/20'
            }`}
          >
            {isPlaying ? (
              <>
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent-success)] animate-pulse" />
                {spellingChar 
                  ? <span>Spelling: <span className="text-[var(--color-accent-primary)] font-mono text-sm">{spellingChar}</span></span>
                  : 'Maya is Signing...'
                }
              </>
            ) : (
              <>▶ Play Sequence</>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="flex-1 overflow-y-auto pr-1">
          {signs.length === 0 ? (
            <p className="text-center text-[var(--color-text-muted)] text-sm py-8">
              No words to look up.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {signs.map(({ word, sign }, idx) => (
                <div
                  key={idx}
                  onClick={() => sign ? onSignTrigger(word) : null}
                  className={`rounded-xl p-3 flex flex-col items-center gap-2 glass transition-all duration-300 ${
                    sign 
                      ? activeIndex === idx 
                        ? 'border-2 border-[var(--color-accent-success)] shadow-[0_0_15px_rgba(0,206,201,0.3)] bg-[var(--color-accent-success)]/5 cursor-pointer' 
                        : 'border border-[var(--color-accent-primary)]/20 hover:border-[var(--color-accent-primary)]/50 cursor-pointer' 
                      : activeIndex === idx
                        ? 'border-2 border-[var(--color-accent-warning)] bg-[var(--color-accent-warning)]/5'
                        : 'opacity-50 border-dashed border-white/10'
                  }`}
                >
                  {sign ? (
                    <>
                      <div style={{ fontSize: 28 }} className={activeIndex === idx ? 'animate-bounce' : ''}>{sign.emoji}</div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-[var(--color-text-primary)] capitalize">{word}</p>
                        <p className="text-[10px] text-[var(--color-accent-secondary)]">{sign.hindi}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-[var(--color-accent-warning)]">
                        {activeIndex === idx && spellingChar ? spellingChar : '🔤'}
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] capitalize">{word}</p>
                        <p className="text-[9px] text-[var(--color-accent-warning)]">Fingerspell</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-4 opacity-80">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl">🤟</div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">Text & Speech → Sign</p>
          <p className="text-xs text-[var(--color-text-muted)] max-w-[220px] leading-relaxed">
            Convert English text or <span className="text-[var(--color-accent-primary)] font-medium">speech</span> into ISL signs.
            Unknown words are <span className="text-[var(--color-accent-warning)] font-medium">fingerspelled</span> automatically.
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center mt-3">
            {['Hello', 'Thank you', 'Love', 'Water', 'Peace', 'Call me'].map(w => (
              <button
                key={w}
                onClick={() => { setText(w.toLowerCase().replace(' ', '_')); }}
                className="px-3 py-1.5 rounded-lg glass text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] hover:border-[var(--color-accent-primary)] transition-all duration-200 cursor-pointer"
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Output Panel ──
export default function OutputPanel({ predictions, currentPrediction, selectedLang, isDetecting }) {
  const scrollRef = useRef(null);
  const [tab, setTab] = useState('detection');
  const [copiedId, setCopiedId] = useState(null);
  const [playbackSign, setPlaybackSign] = useState(null);
  const [isDictOpen, setIsDictOpen] = useState(false);

  useEffect(() => {
    if (scrollRef.current && tab === 'detection') {
      const container = scrollRef.current;
      if (container.scrollTop < 50) {
        container.scrollTop = 0;
      }
    }
  }, [predictions, tab]);

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

  const isRealDetection = (entry) => !entry.isMock;

  // Determine what the avatar should show
  const avatarSign = tab === 'text-sign' ? playbackSign : currentPrediction?.sign;
  const avatarIsMock = tab === 'text-sign' ? true : currentPrediction?.isMock;

  return (
    <div className="flex flex-col h-full gap-3" id="output-panel">
      {/* Avatar */}
      <div className="glass rounded-2xl flex-shrink-0">
        <AvatarDisplay
          currentSign={avatarSign}
          isDetecting={isDetecting && tab === 'detection'}
          isMock={avatarIsMock}
        />
      </div>

      {/* Tabs + Dictionary button */}
      <div className="flex gap-1 p-1 glass rounded-xl flex-shrink-0">
        <button
          onClick={() => { setTab('detection'); setPlaybackSign(null); }}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            tab === 'detection'
              ? 'bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          🎥 Live
          {predictions.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
              {predictions.filter(isRealDetection).length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setTab('text-sign'); setPlaybackSign(null); }}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            tab === 'text-sign'
              ? 'bg-[var(--color-accent-secondary)]/20 text-[var(--color-accent-secondary)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          ✍️ Text → Sign
        </button>
        <button
          onClick={() => setIsDictOpen(true)}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-accent-success)] hover:bg-[var(--color-accent-success)]/10 transition-all duration-200 cursor-pointer"
          title="Sign Dictionary"
        >
          📖
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {tab === 'detection' ? (
          <div className="flex flex-col h-full gap-2">
            {/* Sentence Builder */}
            {predictions.length > 0 && (
              <SentenceBuilder predictions={predictions.filter(isRealDetection)} />
            )}

            {predictions.length === 0 ? (
              <div className="flex-1 glass rounded-2xl flex flex-col items-center justify-center gap-3 text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">No signs detected yet</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Start camera and show a hand sign</p>
                </div>
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto rounded-2xl glass p-3 space-y-2 min-h-0"
                id="transcript-container"
              >
                {predictions.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-white/5 ${
                      idx === 0
                        ? 'animate-[slide-up_0.3s_ease-out] bg-[var(--color-accent-primary)]/5 glow-border'
                        : 'border border-transparent'
                    }`}
                  >
                    {/* Sign emoji */}
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-lg">
                      {SIGN_LIBRARY[entry.sign?.toLowerCase().replace(/ /g,'_')]?.emoji || '✋'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {entry.sign}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          entry.isMock
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : entry.confidence > 0.9
                            ? 'bg-[var(--color-accent-success)]/20 text-[var(--color-accent-success)]'
                            : entry.confidence > 0.7
                            ? 'bg-[var(--color-accent-warning)]/20 text-[var(--color-accent-warning)]'
                            : 'bg-[var(--color-accent-danger)]/20 text-[var(--color-accent-danger)]'
                        }`}>
                          {entry.isMock ? '🔄 Demo' : `${Math.round(entry.confidence * 100)}%`}
                        </span>
                      </div>

                      {selectedLang !== 'english' && (
                        <p className="text-xs text-[var(--color-accent-secondary)] mt-0.5">
                          → {getTranslation(entry)}
                        </p>
                      )}

                      <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                        {entry.timestamp.toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Copy */}
                    <button
                      onClick={() => copyToClipboard(getTranslation(entry), entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 transition-all duration-150 cursor-pointer"
                      title="Copy"
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
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full glass rounded-2xl p-3">
             <TextToSign onSignTrigger={setPlaybackSign} />
          </div>
        )}
      </div>

      {/* Sign Dictionary Modal */}
      <SignDictionary isOpen={isDictOpen} onClose={() => setIsDictOpen(false)} />
    </div>
  );
}
