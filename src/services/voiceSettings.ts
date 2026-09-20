export interface CustomVoiceConfig {
  voiceURI: string;
  voiceName: string;
  lang: string;
  pitch: number;      // 0.5 (deep) to 1.5 (high)
  rate: number;       // 0.75 (slow) to 1.35 (fast)
  volume: number;     // 0.1 to 1.0
  persona: 'friendly' | 'mentor' | 'energetic' | 'calm' | 'custom';
  customInstructions?: string;
}

export const DEFAULT_VOICE_CONFIG: CustomVoiceConfig = {
  voiceURI: '',
  voiceName: 'Default System Voice',
  lang: 'en-US',
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
  persona: 'friendly',
  customInstructions: ''
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
    // Fallback timeout in case voiceschanged does not trigger
    setTimeout(() => {
      resolve(dedupeVoices(window.speechSynthesis.getVoices()));
    }, 400);
  });
}

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

  window.speechSynthesis.cancel();

  const activeConfig = {
    ...getCustomVoiceConfig(),
    ...(preferredConfig || {})
  };

  const cleanText = text
    .replace(/[#*`_~]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.pitch = Math.max(0.5, Math.min(2.0, activeConfig.pitch));
  utterance.rate = Math.max(0.6, Math.min(1.6, activeConfig.rate));
  utterance.volume = Math.max(0.1, Math.min(1.0, activeConfig.volume));

  const voices = window.speechSynthesis.getVoices();
  if (activeConfig.voiceURI && voices.length > 0) {
    const matchedVoice = voices.find(
      (v) => v.voiceURI === activeConfig.voiceURI || v.name === activeConfig.voiceName
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    }
  }

  if (!utterance.voice && activeConfig.lang) {
    utterance.lang = activeConfig.lang;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
}
