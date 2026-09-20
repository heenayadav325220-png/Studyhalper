export interface CustomVoiceConfig {
  voiceURI: string;
  voiceName: string;
  lang: string;
  pitch: number;      // 0.6 (deep) to 1.4 (high) - Optimal default: 1.02
  rate: number;       // 0.75 (slow) to 1.35 (fast) - Optimal default: 0.96
  volume: number;     // 0.1 to 1.0 - Optimal default: 1.0
  persona: 'friendly' | 'mentor' | 'energetic' | 'calm' | 'custom';
  customInstructions?: string;
  autoSelectBestQuality?: boolean;
}

/**
 * Acoustically perfected default configuration for AI Tutor:
 * - pitch: 1.02 (Warm, inviting, crystal-clear timbre without robotic drone or tinny sharpness)
 * - rate: 0.96 (Slightly measured academic cadence: articulate, clear, and perfectly spaced)
 * - volume: 1.0 (Full dynamic range)
 */
export const DEFAULT_VOICE_CONFIG: CustomVoiceConfig = {
  voiceURI: '',
  voiceName: 'Studio Quality AI Voice',
  lang: 'en-US',
  pitch: 1.02,
  rate: 0.96,
  volume: 1.0,
  persona: 'friendly',
  customInstructions: '',
  autoSelectBestQuality: true
};

const STORAGE_KEY = 'ascend_tutor_custom_voice';

export function getCustomVoiceConfig(): CustomVoiceConfig {
  if (typeof window === 'undefined') return DEFAULT_VOICE_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_VOICE_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load voice config from localStorage', err);
  }
  return DEFAULT_VOICE_CONFIG;
}

export function saveCustomVoiceConfig(config: CustomVoiceConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('tutor_voice_config_updated', { detail: config }));
  } catch (err) {
    console.warn('Failed to save voice config to localStorage', err);
  }
}

/**
 * Evaluates and scores browser voices to pick the absolute highest-fidelity,
 * most human-like neural/natural voice available on the user's OS & browser.
 */
export function scoreVoiceQuality(
  voice: SpeechSynthesisVoice,
  isHindiContext: boolean = false
): number {
  let score = 0;
  const name = (voice.name || '').toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();
  const lang = (voice.lang || '').toLowerCase().replace('_', '-');

  // 1. Language Relevance
  if (isHindiContext) {
    if (lang.startsWith('hi')) score += 1200;
    else if (lang.includes('in')) score += 300; // Indian English fallback
    else if (lang.startsWith('en')) score += 100;
  } else {
    // English / Hinglish context
    if (lang.startsWith('en-in')) score += 900;
    else if (lang.startsWith('en-us') || lang.startsWith('en-gb')) score += 800;
    else if (lang.startsWith('en')) score += 600;
    else if (lang.startsWith('hi')) score += 350;
  }

  // 2. High-Definition Natural / Neural Engine Recognition
  if (name.includes('natural') || uri.includes('natural')) score += 700;
  if (name.includes('neural') || uri.includes('neural')) score += 700;
  if (name.includes('google') || uri.includes('google')) score += 550;
  if (name.includes('enhanced') || uri.includes('enhanced')) score += 450;
  if (name.includes('premium') || uri.includes('premium')) score += 400;
  if (name.includes('online') || uri.includes('online')) score += 300;

  // 3. Top-Tier Known Natural Voice Identifiers (Android, Edge, Chrome, Apple, Windows)
  // Google हिन्दी is the #1 neural voice on Android devices
  if (name.includes('google हिन्दी') || name.includes('google hindi')) score += 600;
  if (name.includes('swara') || name.includes('madhur')) score += 550;
  if (name.includes('neerja') || name.includes('prabhat')) score += 500;
  if (name.includes('lekha') || name.includes('rishi')) score += 450;
  if (name.includes('jenny') || name.includes('guy') || name.includes('aria')) score += 400;
  if (name.includes('samantha') || name.includes('karen') || name.includes('daniel')) score += 350;

  // 4. Penalize low-quality / robotic / metallic fallback engines
  if (name.includes('espeak') || uri.includes('espeak')) score -= 600;
  if (name.includes('compact') || uri.includes('compact')) score -= 200;
  if (name.toLowerCase() === 'default') score -= 150;

  return score;
}

/**
 * Returns the best possible studio-grade voice from the available list.
 */
export function findBestQualityVoice(
  voices: SpeechSynthesisVoice[],
  text?: string,
  preferredLang?: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const hasDevanagari = text ? /[\u0900-\u097F]/.test(text) : false;
  const isHindiContext = hasDevanagari || (preferredLang && preferredLang.startsWith('hi')) || false;

  const scored = voices.map((v) => ({ voice: v, score: scoreVoiceQuality(v, isHindiContext) }));
  scored.sort((a, b) => b.score - a.score);

  return scored[0]?.voice || voices[0] || null;
}

export function getBrowserVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    const dedupeVoices = (rawVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] => {
      const seen = new Set<string>();
      return rawVoices.filter((v) => {
        const id = `${v.voiceURI || v.name}__${v.lang}`;
        if (seen.has(id)) {
          return false;
        }
        seen.add(id);
        return true;
      });
    };

    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(dedupeVoices(voices));
      return;
    }

    const handler = () => {
      voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(dedupeVoices(voices));
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      resolve(dedupeVoices(window.speechSynthesis.getVoices()));
    }, 400);
  });
}

/**
 * Cleans text for human-like natural pronunciation:
 * - Strips Markdown code blocks, asterisks, URLs, and noisy symbols
 * - Phonetically converts math symbols and operators
 * - Paces bullet points for human breath rhythm
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';

  return raw
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, ' [code block omitted] ')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [text](url) -> text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove image tags
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove Markdown headers (e.g. ### Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers
    .replace(/[*_~]{1,3}/g, '')
    // Expand mathematical & scientific symbols into clear spoken words
    .replace(/\s*\+\s*/g, ' plus ')
    .replace(/\s*=\s*/g, ' equals ')
    .replace(/\s*[×*]\s*/g, ' multiplied by ')
    .replace(/\s*[÷/]\s*/g, ' divided by ')
    .replace(/\s*%\s*/g, ' percent ')
    .replace(/\s*[≈~]\s*/g, ' approximately ')
    .replace(/\s*->\s*|\s*→\s*/g, ' leads to ')
    .replace(/\s*<=\s*|\s*≤\s*/g, ' is less than or equal to ')
    .replace(/\s*>=\s*|\s*≥\s*/g, ' is greater than or equal to ')
    .replace(/\s*<\s*/g, ' is less than ')
    .replace(/\s*>\s*/g, ' is greater than ')
    // Replace bullet points with brief breath pauses
    .replace(/^\s*[-*•]\s+/gm, '. ')
    // Replace multiple newlines or spaces with a single pause
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Plays tutor speech with studio-grade natural quality:
 * - Auto-detects Hindi vs English text and matches the highest quality voice
 * - Defaults to pitch: 1.02 and rate: 0.96 for peak clarity and warmth
 * - Includes Chrome Android speech keep-alive to prevent premature cut-offs
 */
export function playTutorSpeech(
  text: string,
  preferredConfig?: Partial<CustomVoiceConfig>,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onError?.('Speech synthesis not supported');
    return;
  }

  // Cancel any currently running speech
  window.speechSynthesis.cancel();

  const savedConfig = getCustomVoiceConfig();
  const activeConfig = {
    ...DEFAULT_VOICE_CONFIG,
    ...savedConfig,
    ...(preferredConfig || {})
  };

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Apply perfected acoustic parameters (pitch: 1.02, rate: 0.96 by default)
  utterance.pitch = Math.max(0.6, Math.min(1.4, activeConfig.pitch || 1.02));
  utterance.rate = Math.max(0.75, Math.min(1.35, activeConfig.rate || 0.96));
  utterance.volume = Math.max(0.1, Math.min(1.0, activeConfig.volume || 1.0));

  const voices = window.speechSynthesis.getVoices();
  const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);

  let selectedVoice: SpeechSynthesisVoice | null = null;

  // 1. If text is in Hindi (Devanagari), prioritize the best Hindi voice even if user was on English
  if (hasDevanagari) {
    selectedVoice = findBestQualityVoice(voices, cleanText, 'hi');
  }

  // 2. Otherwise, if user has an explicitly saved voice URI, try to use it
  if (!selectedVoice && activeConfig.voiceURI && voices.length > 0) {
    selectedVoice = voices.find(
      (v) => v.voiceURI === activeConfig.voiceURI || v.name === activeConfig.voiceName
    ) || null;
  }

  // 3. If no voice explicitly selected or autoSelectBestQuality is true, pick the best studio voice
  if (!selectedVoice && voices.length > 0) {
    selectedVoice = findBestQualityVoice(voices, cleanText, activeConfig.lang);
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else if (activeConfig.lang) {
    utterance.lang = hasDevanagari ? 'hi-IN' : activeConfig.lang;
  }

  // Chrome / Android keep-alive timer for uninterrupted long playback
  let keepAliveInterval: any = null;

  const cleanupKeepAlive = () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  };

  utterance.onstart = () => {
    // Keep Chrome / Android TTS engine active on longer texts
    cleanupKeepAlive();
    keepAliveInterval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        cleanupKeepAlive();
      }
    }, 12000);

    onStart?.();
  };

  utterance.onend = () => {
    cleanupKeepAlive();
    onEnd?.();
  };

  utterance.onerror = (err) => {
    cleanupKeepAlive();
    onError?.(err);
  };

  window.speechSynthesis.speak(utterance);
}
