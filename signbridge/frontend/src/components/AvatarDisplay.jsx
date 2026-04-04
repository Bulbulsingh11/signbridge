
import { useState, useEffect } from 'react';
import { SIGN_LIBRARY, ISL_ALPHABET } from '../data/signData';

/**
 * Maya Avatar - A premium, animated SVG assistant for SignBridge.
 * Features:
 * - Procedural hand poses based on finger states
 * - Ambient animations (blinking, breathing)
 * - Reactive expressions
 * - ISL fingerspelling support
 */

/**
 * Animated Hand Component
 * Renders a stylized hand where fingers fold/unfold based on state.
 */
function AnimatedHand({ fingers, position = 'right' }) {
  const isLeft = position === 'left';
  
  // Finger heights: [Thumb, Index, Middle, Ring, Pinky]
  const FINGER_X = [12, 28, 44, 60, 76];
  const FINGER_BASE_Y = 60;
  const FINGER_MAX_LEN = [24, 40, 48, 42, 34];
  
  return (
    <svg 
      width="100" 
      height="120" 
      viewBox="0 0 100 120" 
      style={{ 
        transform: isLeft ? 'scaleX(-1)' : 'none',
        filter: 'drop-shadow(0 0 8px var(--color-accent-glow))' 
      }}
    >
      {/* Palm Base */}
      <path 
        d="M20,60 Q20,100 50,110 Q80,100 80,60 L80,50 Q80,45 75,45 Q70,45 70,50 L70,60 Q70,65 65,65 Q60,65 60,60 L60,50 Q60,45 55,45 Q50,45 50,50 L50,60 Q50,65 45,65 Q40,65 40,60 L40,50 Q40,45 35,45 Q30,45 30,50 L30,60 Q30,65 25,65 Q20,65 20,60 Z" 
        fill="var(--color-bg-secondary)"
        stroke="var(--color-accent-primary)"
        strokeWidth="2"
      />
      
      {/* Fingers */}
      {fingers.map((isExtended, i) => {
        const height = isExtended ? FINGER_MAX_LEN[i] : 8;
        const color = isExtended ? 'var(--color-accent-primary)' : 'var(--color-bg-card)';
        
        return (
          <rect
            key={i}
            x={FINGER_X[i] - 6}
            y={FINGER_BASE_Y - height}
            width="12"
            height={height + 5}
            rx="6"
            fill={color}
            stroke="var(--color-accent-secondary)"
            strokeWidth={isExtended ? "1.5" : "0.5"}
            style={{ 
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: isExtended ? 1 : 0.6 
            }}
          />
        );
      })}
      
      {/* Hand Details / Palm lines */}
      <path d="M35,80 Q50,95 65,80" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
    </svg>
  );
}

/**
 * Maya Avatar Component
 */
function MayaAvatar({ signData, isDetecting, signKey }) {
  const [blink, setBlink] = useState(false);
  
  // Random blinking effect
  useEffect(() => {
    const timer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, Math.random() * 4000 + 2000);
    return () => clearInterval(timer);
  }, []);

  const fingerState = signData?.fingers || [0,0,0,0,0];
  const isHappy = !!signData;

  return (
    <div className="relative w-full h-48 flex items-center justify-center overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--color-accent-glow)] to-transparent opacity-30 rounded-full blur-3xl transform translate-y-1/2" />
      
      <div className="relative flex items-end justify-center w-full max-w-[320px] h-full">
        {/* Left Hand (Mirror or Idle) */}
        <div className="absolute left-4 bottom-2 opacity-40 scale-75 transform -rotate-12">
          <AnimatedHand fingers={[0,0,0,0,0]} position="left" />
        </div>

        {/* Main Character Body (SVG) */}
        <svg width="200" height="200" viewBox="0 0 200 200" className="z-10 animate-[breathe_4s_ease-in-out_infinite]">
          {/* Shoulders / Torso */}
          <path 
            d="M40,200 Q40,160 100,160 Q160,160 160,200" 
            fill="var(--color-bg-secondary)" 
            stroke="var(--color-accent-primary)" 
            strokeWidth="3"
          />
          
          {/* Head */}
          <circle cx="100" cy="100" r="45" fill="var(--color-bg-card)" stroke="var(--color-accent-primary)" strokeWidth="3" />
          
          {/* Hair / Cap (Stylized) */}
          <path 
            d="M55,100 Q55,50 100,50 Q145,50 145,100 L145,90 Q145,40 100,40 Q55,40 55,90 Z" 
            fill="var(--color-accent-primary)"
            opacity="0.8"
          />

          {/* Eyes */}
          <g>
            {/* Left Eye */}
            <rect 
              x="82" y="95" 
              width="6" height={blink ? "1" : "8"} 
              rx="3" 
              fill={isHappy ? "var(--color-accent-success)" : "white"} 
              style={{ transition: 'all 0.1s ease' }}
            />
            {/* Right Eye */}
            <rect 
              x="112" y="95" 
              width="6" height={blink ? "1" : "8"} 
              rx="3" 
              fill={isHappy ? "var(--color-accent-success)" : "white"} 
              style={{ transition: 'all 0.1s ease' }}
            />
          </g>

          {/* Mouth */}
          <path 
            d={isHappy ? "M85,120 Q100,135 115,120" : "M92,125 Q100,125 108,125"} 
            fill="none" 
            stroke={isHappy ? "var(--color-accent-success)" : "var(--color-text-muted)"} 
            strokeWidth="2.5" 
            strokeLinecap="round"
            style={{ transition: 'all 0.3s ease' }}
          />

          {/* Cheeks (Blush when happy) */}
          {isHappy && (
            <g opacity="0.3">
              <circle cx="75" cy="115" r="5" fill="var(--color-accent-danger)" />
              <circle cx="125" cy="115" r="5" fill="var(--color-accent-danger)" />
            </g>
          )}
        </svg>

        {/* Right (Dominant) Hand - Actual Signs */}
        <div 
          className="absolute right-4 bottom-2 z-20"
          style={{ 
            animation: (signKey === 'hello' || signKey === 'hi') ? 'wave 1.5s ease-in-out infinite' : (signData ? 'none' : isDetecting ? 'float 3s ease-in-out infinite' : 'none'),
            transform: `rotate(${signData ? '-10deg' : '0deg'}) scale(${signData ? 1.1 : 0.9})`,
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <AnimatedHand fingers={fingerState} position="right" />
        </div>
      </div>
    </div>
  );
}

export default function AvatarDisplay({ currentSign, isDetecting, isMock }) {
  const key = currentSign?.toLowerCase().replace(/ /g, '_');
  
  // Check if this is a fingerspelling trigger: "__spell_a", "__spell_b", etc.
  const isSpelling = key?.startsWith('__spell_');
  const spelledLetter = isSpelling ? key.replace('__spell_', '') : null;
  
  // Resolve sign data: from library, from alphabet, or null
  const signData = isSpelling 
    ? (ISL_ALPHABET[spelledLetter] ? { ...ISL_ALPHABET[spelledLetter], emoji: spelledLetter?.toUpperCase(), hindi: '' } : null)
    : (SIGN_LIBRARY[key] || null);

  return (
    <div className="flex flex-col items-center gap-1 py-4 px-2" id="avatar-display">
      {/* The Avatar Section */}
      <MayaAvatar signData={signData} isDetecting={isDetecting} signKey={isSpelling ? null : key} />

      {/* Info Section */}
      <div className="text-center mt-2 min-h-[80px] flex flex-col justify-center">
        {isSpelling && signData ? (
          /* Fingerspelling mode */
          <div className="animate-[slide-up_0.3s_ease-out]">
            <p className="text-[10px] text-[var(--color-accent-warning)] uppercase tracking-[0.2em] mb-1 font-bold">
              ✨ Fingerspelling
            </p>
            <h3 className="text-4xl font-bold text-gradient leading-tight tracking-tight font-mono">
              {spelledLetter?.toUpperCase()}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 italic">
              {signData.desc}
            </p>
          </div>
        ) : signData ? (
          <div className="animate-[slide-up_0.4s_ease-out]">
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-1 font-bold">
              {isMock ? 'Demo Mode' : isDetecting ? 'Live Detection' : 'Recent Signal'}
            </p>
            <h3 className="text-2xl font-bold text-gradient leading-tight tracking-tight">
              {currentSign}
            </h3>
            <p className="text-lg font-medium text-[var(--color-accent-secondary)] mt-1">
              {signData.hindi}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-2 max-w-[200px] mx-auto leading-relaxed italic">
              — {signData.desc}
            </p>
          </div>
        ) : (
          <div className="opacity-60 transition-opacity duration-500">
            {currentSign ? (
              <div className="animate-pulse">
                <p className="text-2xl font-bold text-[var(--color-text-secondary)]">?</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">"{currentSign}"</p>
                <p className="text-[10px] text-[var(--color-accent-warning)] mt-1 uppercase font-bold tracking-wider">Unrecognized Sign</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                  {isDetecting ? 'Maya is watching...' : 'Maya is resting'}
                </p>
                {isDetecting && (
                  <div className="flex gap-1.5 mt-2">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-secondary)] opacity-40"
                        style={{ animation: `pulse-glow 1.5s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
