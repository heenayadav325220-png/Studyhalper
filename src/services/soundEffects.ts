// Ultra-Refined Web Audio API Synthesizer & Haptic Engine for Professional-Grade UI Feel
import { AudioFeedback } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Browser autoplay policy
    });
  }
  return audioCtx;
}

/**
 * High-precision tactile vibration feedback for mobile & touchscreen devices
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof window === 'undefined' || !('navigator' in window) || !navigator.vibrate) return;
  try {
    if (type === 'light') {
      navigator.vibrate(8);
    } else if (type === 'medium') {
      navigator.vibrate(16);
    } else if (type === 'success') {
      navigator.vibrate([10, 30, 14]);
    } else if (type === 'warning') {
      navigator.vibrate([25, 40, 25]);
    }
  } catch {
    // Ignore if vibration is restricted
  }
}

/**
 * Plays ultra-smooth, micro-tuned tactile audio feedback.
 * Crafted with zero distortion or harsh buzzes, giving an Apple/Linear luxury feel.
 */
export function playUiSound(mode: AudioFeedback = 'cyber_synth') {
  if (mode === 'silent') return;

  // Always trigger subtle haptic pulse alongside audio on mobile
  triggerHaptic('light');

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (mode === 'cyber_synth') {
      // Sleek luxury micro-pop (like iPhone Dynamic Island / Apple Watch Crown)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.045);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.055);
    } else if (mode === 'tactile_click') {
      // Studio mechanical switch click (tactile damper like a luxury camera dial)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.025);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } else if (mode === 'zen_water') {
      // Gentle harmonic chime (soft acoustic marimba drop)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.03); // D6

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.13);
      osc2.stop(now + 0.13);
    }
  } catch (e) {
    console.debug('Sound synthesis skipped', e);
  }
}

/**
 * Level up or achievement celebration sound
 */
export function playSuccessChime() {
  triggerHaptic('success');
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.05, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.24);
    });
  } catch (e) {
    console.debug('Success chime skipped', e);
  }
}
