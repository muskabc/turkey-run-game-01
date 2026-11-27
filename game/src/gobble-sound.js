// Gobble Dash sound: tiny WebAudio synths, no audio files. A gobble for the
// dash, a ding for corn, a whoosh for thrown knives, a sizzle near ovens,
// stings for caught and escaped. Everything is guarded so the game still
// runs where WebAudio is unavailable or blocked.

export function makeSound() {
  let ctx = null;
  let master = null;

  function ensure() {
    if (ctx) return true;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return false;
      ctx = new AudioCtor();
      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freqStart, freqEnd, seconds, type, volume, delay = 0) {
    if (!ensure()) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), start + seconds);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + seconds + 0.02);
    } catch {
      // Sound is decoration; never break the game for it.
    }
  }

  function noise(seconds, volume, delay = 0) {
    if (!ensure()) return;
    try {
      const start = ctx.currentTime + delay;
      const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(master);
      source.start(start);
    } catch {
      // Ignore: silent play is fine.
    }
  }

  return {
    unlock() {
      ensure();
    },
    gobble() {
      tone(520, 180, 0.14, 'square', 0.5);
      tone(640, 220, 0.12, 'square', 0.4, 0.09);
    },
    corn() {
      tone(880, 1320, 0.1, 'sine', 0.6);
      tone(1320, 1760, 0.12, 'sine', 0.5, 0.07);
    },
    golden() {
      tone(784, 784, 0.1, 'triangle', 0.6);
      tone(988, 988, 0.1, 'triangle', 0.6, 0.1);
      tone(1175, 1568, 0.18, 'triangle', 0.6, 0.2);
    },
    knifeThrow() {
      noise(0.16, 0.35);
      tone(1400, 500, 0.14, 'sawtooth', 0.18);
    },
    hurt() {
      tone(300, 90, 0.25, 'sawtooth', 0.7);
      noise(0.12, 0.3);
    },
    spotted() {
      tone(220, 440, 0.12, 'square', 0.45);
      tone(220, 440, 0.12, 'square', 0.45, 0.16);
    },
    sizzle() {
      noise(0.3, 0.22);
    },
    caught() {
      tone(392, 392, 0.18, 'triangle', 0.6);
      tone(330, 330, 0.18, 'triangle', 0.6, 0.18);
      tone(262, 196, 0.4, 'triangle', 0.6, 0.36);
    },
    escaped() {
      tone(523, 523, 0.12, 'triangle', 0.6);
      tone(659, 659, 0.12, 'triangle', 0.6, 0.12);
      tone(784, 784, 0.12, 'triangle', 0.6, 0.24);
      tone(1047, 1319, 0.3, 'triangle', 0.65, 0.36);
    },
    click() {
      tone(700, 900, 0.06, 'sine', 0.4);
    },
  };
}
