// src/services/audioSoundService.ts

/**
 * Web Audio API Sound Chime System for Vaani Turn Taking
 * Lightweight, zero external audio asset dependency.
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn("[AUDIO CHIME] AudioContext init failed:", e);
    return null;
  }
};

export const unlockAudio = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().then(() => {
      console.log("[AUDIO CHIME] AudioContext unlocked successfully");
    }).catch(e => console.warn("[AUDIO CHIME] Resume failed:", e));
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("click", unlockAudio);
  window.addEventListener("touchstart", unlockAudio);
  window.addEventListener("keydown", unlockAudio);
}

export type ChimeType = "turn_start" | "speech_heard" | "processing";

export const playAudioChime = (type: ChimeType) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case "turn_start": {
        // 🔔 Turn Start: Vibrant 2-note bell chime (D5 -> A5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.22);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain2.gain.setValueAtTime(0, now + 0.08);
        gain2.gain.linearRampToValueAtTime(0.35, now + 0.09);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.38);
        break;
      }

      case "speech_heard": {
        // 🎙️ Speech Heard: Short soft blip (A5)
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case "processing": {
        // 🟡 Processing: Soft descending tone (E5 -> C5)
        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.12);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
    }
  } catch (err) {
    console.warn("[AUDIO CHIME] Error playing chime:", err);
  }
};
