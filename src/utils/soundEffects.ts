// Futuristic Audio Synthesizer using Web Audio API
// Generates sci-fi tones and interface feedback without external audio files

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public play(type: 'click' | 'listen-start' | 'listen-stop' | 'message-sent' | 'message-received' | 'alert' | 'mode-switch') {
    if (!this.enabled) return;

    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      switch (type) {
        case 'click': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);
          
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'listen-start': {
          // Futuristic ascending cyber chime
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';

          osc1.frequency.setValueAtTime(440, now);
          osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          osc2.frequency.setValueAtTime(880, now);
          osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.15);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);

          osc1.start(now);
          osc2.start(now + 0.05);
          osc1.stop(now + 0.22);
          osc2.stop(now + 0.22);
          break;
        }

        case 'listen-stop': {
          // Descending tone
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(700, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);

          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }

        case 'message-sent': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(920, now + 0.09);

          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }

        case 'message-received': {
          // Double harmonic chime
          [587.33, 880, 1174.66].forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const delay = idx * 0.05;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);

            gain.gain.setValueAtTime(0.06, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.25);
          });
          break;
        }

        case 'mode-switch': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.14);

          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'alert': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.setValueAtTime(300, now + 0.08);

          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.18);
          break;
        }
      }
    } catch {
      // Audio autoplay policy or failure - ignore gracefully
    }
  }
}

export const soundFx = new SoundSynthesizer();
