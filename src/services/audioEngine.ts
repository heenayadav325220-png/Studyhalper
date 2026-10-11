// Robust Upbeat Study Music Engine with Rich Web Audio Synthesis & Progress Tracking
export interface Track {
  id: string;
  title: string;
  subtitle: string;
  duration: number; // in seconds
  durationFormatted: string;
  coverEmoji: string;
}

export const STUDY_TRACKS: Track[] = [
  {
    id: 'track_1',
    title: 'Sapnon Tak Pahunch',
    subtitle: 'Ascend Study Upbeat Anthem & Focus Beats',
    duration: 165,
    durationFormatted: '2:45',
    coverEmoji: '🚀'
  },
  {
    id: 'track_2',
    title: 'Sapnon Ki Nai Udaan',
    subtitle: 'Study Smarter & Grow Faster Lofi',
    duration: 190,
    durationFormatted: '3:10',
    coverEmoji: '✨'
  },
  {
    id: 'track_3',
    title: 'Kitabein Band, Gehri Saans',
    subtitle: 'Deep Breathing & High-Energy Focus',
    duration: 170,
    durationFormatted: '2:50',
    coverEmoji: '🧘'
  }
];

class AudioEngine {
  private currentTrackIndex = 0;
  private isPlayingState = false;
  private volumeState = 0.9;
  private currentTimeState = 0;
  private isShuffle = false;
  private sleepTimerTimeout: any = null;
  private listeners: Set<() => void> = new Set();
  
  private audioCtx: AudioContext | null = null;
  private beatInterval: any = null;
  private timeTickerInterval: any = null;
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
      }
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getTrack(): Track {
    return STUDY_TRACKS[this.currentTrackIndex] || STUDY_TRACKS[0];
  }

  public getIsPlaying(): boolean {
    return this.isPlayingState;
  }

  public getVolume(): number {
    return this.volumeState;
  }

  public getProgress(): { currentTime: number; duration: number } {
    const track = this.getTrack();
    return {
      currentTime: this.currentTimeState,
      duration: track.duration
    };
  }

  public playTrack(index: number) {
    if (index < 0) index = STUDY_TRACKS.length - 1;
    if (index >= STUDY_TRACKS.length) index = 0;
    this.currentTrackIndex = index;
    this.currentTimeState = 0;
    this.play();
  }

  public play() {
    this.isPlayingState = true;
    this.initAudioContext();
    this.startUpbeatSynthLoop();
    this.startTimeTicker();
    this.updateMediaSession();
    this.notify();
  }

  public pause() {
    this.isPlayingState = false;
    this.stopSynthLoop();
    this.stopTimeTicker();
    this.notify();
  }

  public togglePlay() {
    if (this.isPlayingState) {
      this.pause();
    } else {
      this.play();
    }
  }

  public nextTrack() {
    if (this.isShuffle) {
      const nextIdx = Math.floor(Math.random() * STUDY_TRACKS.length);
      this.playTrack(nextIdx);
    } else {
      this.playTrack(this.currentTrackIndex + 1);
    }
  }

  public prevTrack() {
    this.playTrack(this.currentTrackIndex - 1);
  }

  public setVolume(vol: number) {
    this.volumeState = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volumeState * 0.35, this.audioCtx.currentTime);
    }
    this.notify();
  }

  public seek(timeInSeconds: number) {
    const track = this.getTrack();
    this.currentTimeState = Math.max(0, Math.min(track.duration, timeInSeconds));
    this.notify();
  }

  public setSleepTimer(minutes: number) {
    if (this.sleepTimerTimeout) {
      clearTimeout(this.sleepTimerTimeout);
      this.sleepTimerTimeout = null;
    }
    if (minutes > 0) {
      this.sleepTimerTimeout = setTimeout(() => {
        this.pause();
      }, minutes * 60 * 1000);
    }
  }

  private startTimeTicker() {
    if (this.timeTickerInterval) clearInterval(this.timeTickerInterval);
    this.timeTickerInterval = setInterval(() => {
      if (!this.isPlayingState) return;
      const track = this.getTrack();
      this.currentTimeState += 1;
      if (this.currentTimeState >= track.duration) {
        if (this.isLoopOne) {
          this.currentTimeState = 0;
        } else {
          this.nextTrack();
        }
      }
      this.notify();
    }, 1000);
  }

  private stopTimeTicker() {
    if (this.timeTickerInterval) {
      clearInterval(this.timeTickerInterval);
      this.timeTickerInterval = null;
    }
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (!this.masterGain && this.audioCtx) {
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.volumeState * 0.35, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
  }

  // Rich, high-energy energetic upbeat study beat generator with distinct melodies per track
  private startUpbeatSynthLoop() {
    this.stopSynthLoop();
    if (!this.audioCtx || !this.masterGain) return;

    // Distinct chord progressions & tempos per track index
    const trackConfigs = [
      {
        // Track 0: "Sapnon Tak Pahunch" - Bright & Upbeat C Major (125 BPM)
        chords: [
          [261.63, 329.63, 392.00], // C
          [220.00, 261.63, 329.63], // Am
          [174.61, 220.00, 261.63], // F
          [196.00, 246.94, 293.66]  // G
        ],
        tempo: 420,
        synthType: 'triangle' as OscillatorType,
        bassFreq: 120
      },
      {
        // Track 1: "Sapnon Ki Nai Udaan" - Inspiring & Melodic F Major Lofi (110 BPM)
        chords: [
          [174.61, 220.00, 261.63, 349.23], // F
          [220.00, 261.63, 329.63, 392.00], // Am
          [196.00, 246.94, 293.66, 370.00], // G
          [130.81, 164.81, 196.00, 246.94]  // C
        ],
        tempo: 480,
        synthType: 'sine' as OscillatorType,
        bassFreq: 98
      },
      {
        // Track 2: "Kitabein Band, Gehri Saans" - Calming & Deep Focus Ambient (100 BPM)
        chords: [
          [220.00, 277.18, 329.63, 440.00], // A minor 7
          [164.81, 207.65, 246.94, 329.63], // E minor 7
          [174.61, 220.00, 261.63, 349.23], // F major 7
          [146.83, 185.00, 220.00, 293.66]  // D minor 7
        ],
        tempo: 540,
        synthType: 'triangle' as OscillatorType,
        bassFreq: 82
      }
    ];

    const config = trackConfigs[this.currentTrackIndex % trackConfigs.length];
    let step = 0;

    this.beatInterval = setInterval(() => {
      if (!this.isPlayingState || !this.audioCtx || !this.masterGain) return;
      
      const now = this.audioCtx.currentTime;
      const chord = config.chords[Math.floor(step / 6) % config.chords.length];
      const note = chord[step % chord.length];

      // Play distinctive melodic synth note
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = config.synthType;
      osc.frequency.setValueAtTime(note * (step % 3 === 0 ? 1.5 : 1), now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.45);

      // Unique rhythmic bass / beat per track style
      if (step % 2 === 0) {
        const bass = this.audioCtx.createOscillator();
        const bassGain = this.audioCtx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(config.bassFreq, now);
        bass.frequency.exponentialRampToValueAtTime(config.bassFreq * 0.4, now + 0.15);

        bassGain.gain.setValueAtTime(0.3, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        bass.connect(bassGain);
        bassGain.connect(this.masterGain);
        bass.start(now);
        bass.stop(now + 0.15);
      }

      step++;
    }, config.tempo);
  }

  private stopSynthLoop() {
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
  }

  private updateMediaSession() {
    if ('mediaSession' in navigator) {
      const track = this.getTrack();
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: 'Ascend Study Music',
        album: track.subtitle,
        artwork: [
          { src: '/favicon.ico', sizes: '96x96', type: 'image/ico' }
        ]
      });
    }
  }
}

export const audioEngine = new AudioEngine();
