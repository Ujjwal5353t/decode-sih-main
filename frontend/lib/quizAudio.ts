// Lightweight, dependency-free sound + haptic feedback for gamified quiz
// interactions. Tones are synthesized with the Web Audio API (no audio
// files to host/load), so this stays cheap enough to reuse anywhere in the
// app that wants the same feedback later (learning modules, other
// assessments) without pulling in an asset pipeline.

const MUTE_KEY = "quiz_sound_muted";

let audioCtx: AudioContext | null = null;

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // ignore — storage unavailable (private mode etc.)
  }
}

function playTone(freq: number, startOffset: number, duration: number, ctx: AudioContext, gain: number) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const startAt = ctx.currentTime + startOffset;
  gainNode.gain.setValueAtTime(0, startAt);
  gainNode.gain.linearRampToValueAtTime(gain, startAt + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function playSequence(notes: { freq: number; at: number; duration: number }[], gain = 0.08) {
  if (isSoundMuted()) return;
  const ctx = getContext();
  if (!ctx) return;
  for (const note of notes) {
    playTone(note.freq, note.at, note.duration, ctx, gain);
  }
}

export function playCorrectSound(): void {
  // short bright two-note "ding-ding" — C6 -> E6
  playSequence([
    { freq: 1046.5, at: 0, duration: 0.12 },
    { freq: 1318.5, at: 0.09, duration: 0.18 },
  ]);
}

export function playIncorrectSound(): void {
  // soft, non-punishing low descending tone — never harsh for young kids
  playSequence([{ freq: 330, at: 0, duration: 0.22 }], 0.05);
}

export function playStreakSound(streak: number): void {
  // ascending arpeggio that gets slightly brighter with a longer streak
  const base = 523.25 + Math.min(streak, 6) * 20;
  playSequence([
    { freq: base, at: 0, duration: 0.1 },
    { freq: base * 1.25, at: 0.08, duration: 0.1 },
    { freq: base * 1.5, at: 0.16, duration: 0.16 },
  ]);
}

export function playCelebrationSound(): void {
  // bigger fanfare for finishing the quiz
  playSequence([
    { freq: 523.25, at: 0, duration: 0.12 },
    { freq: 659.25, at: 0.1, duration: 0.12 },
    { freq: 783.99, at: 0.2, duration: 0.12 },
    { freq: 1046.5, at: 0.3, duration: 0.3 },
  ], 0.09);
}

export function triggerHaptic(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // unsupported/blocked — ignore
  }
}
