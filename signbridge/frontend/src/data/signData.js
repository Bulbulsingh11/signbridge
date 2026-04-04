/**
 * ISL Fingerspelling Alphabet
 * Maps each letter to a finger state: [Thumb, Index, Middle, Ring, Pinky]
 * Based on simplified ISL one-hand alphabet representations.
 */
export const ISL_ALPHABET = {
  a: { fingers: [0,0,0,0,0], desc: 'Fist, thumb beside' },
  b: { fingers: [0,1,1,1,1], desc: 'Four fingers up, thumb tucked' },
  c: { fingers: [1,1,0,0,0], desc: 'Curved C shape' },
  d: { fingers: [0,1,0,0,0], desc: 'Index up, others circle thumb' },
  e: { fingers: [0,0,0,0,0], desc: 'Fingers curled, thumb across' },
  f: { fingers: [1,0,1,1,1], desc: 'Index+thumb circle, others up' },
  g: { fingers: [1,1,0,0,0], desc: 'Index pointing sideways' },
  h: { fingers: [0,1,1,0,0], desc: 'Index+middle pointing sideways' },
  i: { fingers: [0,0,0,0,1], desc: 'Pinky extended' },
  j: { fingers: [0,0,0,0,1], desc: 'Pinky extended, arc motion' },
  k: { fingers: [1,1,1,0,0], desc: 'Index+middle up, thumb between' },
  l: { fingers: [1,1,0,0,0], desc: 'L shape — thumb+index' },
  m: { fingers: [0,0,0,0,0], desc: 'Three fingers over thumb' },
  n: { fingers: [0,0,0,0,0], desc: 'Two fingers over thumb' },
  o: { fingers: [1,1,0,0,0], desc: 'O shape — fingers curled to thumb' },
  p: { fingers: [1,1,1,0,0], desc: 'K shape pointing down' },
  q: { fingers: [1,1,0,0,0], desc: 'G shape pointing down' },
  r: { fingers: [0,1,1,0,0], desc: 'Index+middle crossed' },
  s: { fingers: [0,0,0,0,0], desc: 'Fist, thumb over fingers' },
  t: { fingers: [0,0,0,0,0], desc: 'Thumb between index+middle' },
  u: { fingers: [0,1,1,0,0], desc: 'Index+middle up together' },
  v: { fingers: [0,1,1,0,0], desc: 'V shape — index+middle apart' },
  w: { fingers: [0,1,1,1,0], desc: 'Three fingers up' },
  x: { fingers: [0,1,0,0,0], desc: 'Index bent/hooked' },
  y: { fingers: [1,0,0,0,1], desc: 'Thumb+pinky extended' },
  z: { fingers: [0,1,0,0,0], desc: 'Index draws Z in air' },
};

/**
 * Full Sign Library — shared source of truth for ISL word signs
 */
export const SIGN_LIBRARY = {
  hello:     { emoji: '👋', fingers: [1,1,1,1,1], hindi: 'नमस्ते',        desc: 'Open palm wave' },
  hi:        { emoji: '👋', fingers: [1,1,1,1,1], hindi: 'नमस्ते',        desc: 'Open palm wave' },
  thank_you: { emoji: '🙏', fingers: [1,1,1,1,1], hindi: 'धन्यवाद',       desc: 'Flat hand from chin forward' },
  thanks:    { emoji: '🙏', fingers: [1,1,1,1,1], hindi: 'धन्यवाद',       desc: 'Flat hand from chin forward' },
  thank:     { emoji: '🙏', fingers: [1,1,1,1,1], hindi: 'धन्यवाद',       desc: 'Flat hand from chin forward' },
  yes:       { emoji: '✊', fingers: [0,0,0,0,0], hindi: 'हाँ',            desc: 'Fist with nodding motion' },
  no:        { emoji: '🚫', fingers: [0,1,1,0,0], hindi: 'नहीं',           desc: 'Index + middle, wave side to side' },
  please:    { emoji: '🤲', fingers: [1,1,1,1,1], hindi: 'कृपया',          desc: 'Flat hand on chest, circle' },
  sorry:     { emoji: '✊', fingers: [0,0,0,0,0], hindi: 'माफ़ी',          desc: 'Fist on chest, circular motion' },
  help:      { emoji: '👍', fingers: [1,0,0,0,0], hindi: 'मदद',            desc: 'Thumbs up on open palm' },
  good:      { emoji: '👍', fingers: [1,0,0,0,0], hindi: 'अच्छा',          desc: 'Thumbs up gesture' },
  bad:       { emoji: '👎', fingers: [1,0,0,0,0], hindi: 'बुरा',           desc: 'Thumbs down gesture' },
  love:      { emoji: '🤟', fingers: [1,1,0,0,1], hindi: 'प्यार',          desc: 'ILY — thumb, index, pinky extended' },
  stop:      { emoji: '✋', fingers: [1,1,1,1,1], hindi: 'रुको',           desc: 'Open palm facing outward' },
  one:       { emoji: '☝️', fingers: [0,1,0,0,0], hindi: 'एक',             desc: 'Index finger extended' },
  two:       { emoji: '✌️', fingers: [0,1,1,0,0], hindi: 'दो',             desc: 'Peace / V sign' },
  three:     { emoji: '🤞', fingers: [0,1,1,1,0], hindi: 'तीन',            desc: 'Three fingers extended' },
  four:      { emoji: '🖖', fingers: [0,1,1,1,1], hindi: 'चार',            desc: 'Four fingers extended' },
  five:      { emoji: '🖐️', fingers: [1,1,1,1,1], hindi: 'पाँच',           desc: 'All five fingers open' },
  ok:        { emoji: '👌', fingers: [1,1,0,0,0], hindi: 'ठीक है',         desc: 'Thumb + index circle' },
  peace:     { emoji: '✌️', fingers: [0,1,1,0,0], hindi: 'शांति',          desc: 'Index + middle V shape' },
  call_me:   { emoji: '🤙', fingers: [1,0,0,0,1], hindi: 'मुझे फ़ोन करो', desc: 'Thumb + pinky (phone shape)' },
  call:      { emoji: '🤙', fingers: [1,0,0,0,1], hindi: 'मुझे फ़ोन करो', desc: 'Thumb + pinky (phone shape)' },
  water:     { emoji: '💧', fingers: [0,1,1,1,0], hindi: 'पानी',           desc: 'W shape, touch chin' },
};
