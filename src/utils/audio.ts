// Web Audio API synthesizer for notification sounds and Retro Cyber Audio Cues
let audioCtx: AudioContext | null = null;

const STORAGE_KEY_AUDIO_MUTED = 'gigme_sound_muted';

export function isAudioMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_AUDIO_MUTED) === 'true';
  } catch {
    return false;
  }
}

export function setAudioMuted(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUDIO_MUTED, muted ? 'true' : 'false');
  } catch {
    // ignore
  }
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export type SoundEffectType =
  | 'DING_DEFAULT'
  | 'CASH_COUNT'
  | 'BANK_TING'
  | 'SOFT_VIBRATE'
  | 'RADAR_PING'
  | 'ESCROW_LOCK'
  | 'LEVEL_UP'
  | 'BUTTON_CLICK'
  | 'SUCCESS_CHIME';

export function playNotificationSound(type: SoundEffectType = 'DING_DEFAULT') {
  if (isAudioMuted()) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (type) {
      case 'RADAR_PING': {
        // Retro Cyber Radar Sonar Ping (High pulse with harmonic reverb decay)
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        subOsc.type = 'triangle';
        osc.frequency.setValueAtTime(1480, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

        subOsc.frequency.setValueAtTime(2960, now);
        subOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        subOsc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + 0.55);
        subOsc.stop(now + 0.55);
        break;
      }

      case 'ESCROW_LOCK': {
        // Futuristic Cyber Mechanical Lock (2 crisp clicks + resonant confirmation tone)
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(320, now);
        clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
        clickGain.gain.setValueAtTime(0.3, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.05);

        // Confirmation lock hum
        const lockOsc = ctx.createOscillator();
        const lockGain = ctx.createGain();
        lockOsc.type = 'sawtooth';
        lockOsc.frequency.setValueAtTime(587.33, now + 0.07); // D5
        lockOsc.frequency.exponentialRampToValueAtTime(880, now + 0.22); // A5
        lockGain.gain.setValueAtTime(0.2, now + 0.07);
        lockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        lockOsc.connect(lockGain);
        lockGain.connect(ctx.destination);
        lockOsc.start(now + 0.07);
        lockOsc.stop(now + 0.4);
        break;
      }

      case 'LEVEL_UP': {
        // Retro 8-bit / 16-bit Cyber Triad Fanfare (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteTime = now + idx * 0.08;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.25, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.3);
        });
        break;
      }

      case 'BUTTON_CLICK': {
        // Crisp tactile soft click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }

      case 'SUCCESS_CHIME': {
        // Sweet dual chord resolution
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc2.frequency.setValueAtTime(987.77, now + 0.06); // B5

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.06);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
        break;
      }

      case 'CASH_COUNT': {
        // Multi-frequency quick cash rustle/count clicks
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1200 + i * 150, now + i * 0.06);
          gain.gain.setValueAtTime(0.2, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.06);
        }
        break;
      }

      case 'BANK_TING': {
        // High crystalline harmonic bell ("Ting Ting" tiền về ví)
        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        overtone.type = 'sine';
        osc.frequency.setValueAtTime(1760, now); // A6
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);

        overtone.frequency.setValueAtTime(3520, now); // A7 harmonic
        overtone.frequency.exponentialRampToValueAtTime(1760, now + 0.3);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        overtone.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        overtone.start(now);
        osc.stop(now + 0.6);
        overtone.stop(now + 0.6);
        break;
      }

      case 'SOFT_VIBRATE': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'DING_DEFAULT':
      default: {
        // High sweet dual-chime Ding!
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now); // B5
        osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
        break;
      }
    }
  } catch {
    // Audio autoplay or permissions prevented
  }
}

// SOS Emergency Alarm Siren
let sirenOscillator: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let sirenInterval: any = null;

export function startSosSiren() {
  try {
    const ctx = getAudioContext();
    if (sirenOscillator) {
      stopSosSiren();
    }
    const now = ctx.currentTime;
    sirenOscillator = ctx.createOscillator();
    sirenGain = ctx.createGain();

    sirenOscillator.type = 'sawtooth';
    sirenOscillator.frequency.setValueAtTime(750, now);

    sirenGain.gain.setValueAtTime(0.5, now);
    sirenOscillator.connect(sirenGain);
    sirenGain.connect(ctx.destination);
    sirenOscillator.start(now);

    let high = false;
    sirenInterval = setInterval(() => {
      if (!sirenOscillator || !audioCtx) return;
      const t = audioCtx.currentTime;
      high = !high;
      sirenOscillator.frequency.cancelScheduledValues(t);
      sirenOscillator.frequency.linearRampToValueAtTime(high ? 1300 : 700, t + 0.35);
    }, 400);
  } catch (e) {
    console.warn('SOS Siren error:', e);
  }
}

export function stopSosSiren() {
  try {
    if (sirenInterval) {
      clearInterval(sirenInterval);
      sirenInterval = null;
    }
    if (sirenOscillator) {
      sirenOscillator.stop();
      sirenOscillator.disconnect();
      sirenOscillator = null;
    }
    if (sirenGain) {
      sirenGain.disconnect();
      sirenGain = null;
    }
  } catch {
    // ignore
  }
}
