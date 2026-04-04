import { useState } from 'react';
import { SIGN_LIBRARY, ISL_ALPHABET } from '../data/signData';

/**
 * SignDictionary — A modal reference panel showing all supported ISL signs + alphabet.
 */
export default function SignDictionary({ isOpen, onClose }) {
  const [dictTab, setDictTab] = useState('signs');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // De-duplicate aliases (hi, thanks, thank, call are aliases)
  const uniqueSigns = Object.entries(SIGN_LIBRARY).filter(([key]) => 
    !['hi', 'thanks', 'thank', 'call'].includes(key)
  );

  const filteredSigns = uniqueSigns.filter(([key, data]) =>
    key.includes(search.toLowerCase()) || (data.hindi && data.hindi.includes(search))
  );

  const filteredAlpha = Object.entries(ISL_ALPHABET).filter(([letter]) =>
    letter.includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl glass glow-border animate-[slide-up_0.3s_ease-out] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-gradient">ISL Sign Dictionary</h2>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              {uniqueSigns.length} signs · 26 letters
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search + Tabs */}
        <div className="px-5 pt-3 pb-2 space-y-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search signs or letters..."
            className="w-full px-4 py-2 rounded-xl bg-white/5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none border border-white/10 focus:border-[var(--color-accent-primary)]/50 transition-all"
          />
          <div className="flex gap-1 p-0.5 rounded-lg bg-white/5">
            <button
              onClick={() => setDictTab('signs')}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                dictTab === 'signs' 
                  ? 'bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)]' 
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              🤟 Signs ({filteredSigns.length})
            </button>
            <button
              onClick={() => setDictTab('alphabet')}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                dictTab === 'alphabet' 
                  ? 'bg-[var(--color-accent-secondary)]/20 text-[var(--color-accent-secondary)]' 
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              🔤 Alphabet ({filteredAlpha.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {dictTab === 'signs' ? (
            <div className="grid grid-cols-2 gap-2">
              {filteredSigns.map(([key, data]) => (
                <div key={key} className="glass rounded-xl p-3 flex items-start gap-3 hover:bg-white/5 transition-all">
                  <div className="text-2xl flex-shrink-0">{data.emoji}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--color-text-primary)] capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-[var(--color-accent-secondary)]">{data.hindi}</p>
                    <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5 leading-tight">{data.desc}</p>
                    {/* Mini finger diagram */}
                    <div className="flex gap-px items-end mt-1.5">
                      {data.fingers.map((f, i) => (
                        <div key={i} style={{
                          width: 4, height: f ? 12 : 5, borderRadius: 2,
                          background: f 
                            ? 'linear-gradient(to top, var(--color-accent-primary), var(--color-accent-secondary))' 
                            : 'rgba(255,255,255,0.15)',
                          transition: 'height 0.2s',
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredAlpha.map(([letter, data]) => (
                <div key={letter} className="glass rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-white/5 transition-all">
                  <div className="text-xl font-bold text-gradient uppercase">{letter}</div>
                  {/* Mini finger diagram */}
                  <div className="flex gap-px items-end">
                    {data.fingers.map((f, i) => (
                      <div key={i} style={{
                        width: 5, height: f ? 16 : 6, borderRadius: 2,
                        background: f 
                          ? 'linear-gradient(to top, var(--color-accent-primary), var(--color-accent-secondary))' 
                          : 'rgba(255,255,255,0.15)',
                        transition: 'height 0.2s',
                      }} />
                    ))}
                  </div>
                  <p className="text-[8px] text-[var(--color-text-muted)] text-center leading-tight">{data.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
