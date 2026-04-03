import { useState } from 'react';

const LANGUAGES = [
  { code: 'english', label: 'English', flag: '🇬🇧' },
  { code: 'hindi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'spanish', label: 'Español', flag: '🇪🇸' },
];

export default function Navbar({ isConnected, selectedLang, onLangChange }) {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const currentLang = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-3 flex items-center justify-between" id="navbar">
      {/* Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-success)] opacity-20 animate-[pulse-glow_2s_ease-in-out_infinite]"></div>
          <svg className="relative w-7 h-7" viewBox="0 0 32 32" fill="none">
            <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z" fill="url(#logo-grad)" fillOpacity="0.15" stroke="url(#logo-grad)" strokeWidth="1.5"/>
            <path d="M11 20c0-2.5 2-4 5-4s5 1.5 5 4" stroke="var(--color-accent-secondary)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M13 11v3M19 11v3" stroke="var(--color-accent-primary)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 6v2M10 8l1 1.5M22 8l-1 1.5" stroke="var(--color-accent-success)" strokeWidth="1.2" strokeLinecap="round"/>
            <defs>
              <linearGradient id="logo-grad" x1="2" y1="2" x2="30" y2="30">
                <stop stopColor="var(--color-accent-primary)"/>
                <stop offset="1" stopColor="var(--color-accent-success)"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gradient leading-tight">SignBridge</h1>
          <p className="text-[10px] text-[var(--color-text-muted)] tracking-widest uppercase">ISL Assistant</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs" id="connection-status">
          <span className={`w-2 h-2 rounded-full ${isConnected 
            ? 'bg-[var(--color-accent-success)] shadow-[0_0_6px_var(--color-accent-success)]' 
            : 'bg-[var(--color-accent-danger)] shadow-[0_0_6px_var(--color-accent-danger)]'
          }`}></span>
          <span className="text-[var(--color-text-secondary)]">
            {isConnected ? 'API Connected' : 'Mock Mode'}
          </span>
        </div>

        {/* Language Selector */}
        <div className="relative" id="language-selector">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass glass-hover text-sm cursor-pointer transition-all duration-200"
          >
            <span>{currentLang.flag}</span>
            <span className="text-[var(--color-text-secondary)]">{currentLang.label}</span>
            <svg className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isLangOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 rounded-xl glass glow-border p-1 animate-[fade-in_0.2s_ease-out] overflow-hidden">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { onLangChange(lang.code); setIsLangOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-150
                    ${selectedLang === lang.code 
                      ? 'bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-secondary)]' 
                      : 'text-[var(--color-text-secondary)] hover:bg-white/5'
                    }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
