// vaani/lib/vaani/voiceStateController.ts

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { playAudioChime } from "@/services/audioSoundService";

/* ======================================================
   🎙️ MIC FSM (AUTHORITATIVE)
   ====================================================== */

type MicState = "IDLE" | "LISTENING" | "PAUSED_BY_REASON";

export type PauseReason =
  | "TTS"
  | "FACE_CAPTURE"
  | "PIN_ENTRY"
  | "ERROR"
  | "GLOBAL_EXIT";

let recognition: any | null = null;
let micState: MicState = "IDLE";
const pauseReasons = new Set<PauseReason>();
let restartInProgress = false;
let isStarting = false; // Lock to prevent overlapping .start() calls

// 🔄 Re-initialization Hook
let reinitCallback: (() => void) | null = null;
export const setVoiceReinitCallback = (cb: () => void) => {
  reinitCallback = cb;
};

// Deadlock prevention
const DEADLOCK_TIMEOUT_MS = 12000;
let deadlockTimer: ReturnType<typeof setTimeout> | null = null;

const resetDeadlockTimer = () => {
  if (deadlockTimer) clearTimeout(deadlockTimer);
  deadlockTimer = setTimeout(() => {
    if (pauseReasons.size > 0 || restartInProgress || isStarting) {
      console.warn("[VOICE] Deadlock watchdog triggered — forcing recovery");
      pauseReasons.clear();
      restartInProgress = false;
      isStarting = false;
      safeStart("deadlock-recovery");
    }
  }, DEADLOCK_TIMEOUT_MS);
};

export const forceUnlockMic = () => {
  console.warn("[VOICE] forceUnlockMic — clearing all locks");
  pauseReasons.clear();
  restartInProgress = false;
  isStarting = false;
  if (deadlockTimer) clearTimeout(deadlockTimer);
  safeStart("force-unlock");
};

/* ======================================================
   🔌 INIT (ONCE ONLY)
   ====================================================== */

let lastErrorType = "";
let lastErrorTime = 0;
let lastStartTime = 0;
let errorBackoffCount = 0;
let currentRestartTimer: ReturnType<typeof setTimeout> | null = null;

const safeStart = (source: string) => {
  if (!recognition) return;
  if (micState === "LISTENING" || isStarting) {
    console.log(`[VOICE] ${source} — start ignored (state: ${micState}, starting: ${isStarting})`);
    return;
  }
  if (pauseReasons.size > 0) {
    console.log(`[VOICE] ${source} — start blocked by`, Array.from(pauseReasons));
    return;
  }

  const now = Date.now();
  // Fast restart interval (min 200ms apart)
  if (now - lastStartTime < 200) {
    return;
  }

  // If we had an aborted error, brief cooling delay (400ms)
  if (lastErrorType === 'aborted' && now - lastErrorTime < 500) {
    console.log(`[VOICE] ${source} — backing off (brief abort cooling)`);
    if (currentRestartTimer) clearTimeout(currentRestartTimer);
    currentRestartTimer = setTimeout(() => safeStart(`${source}-retry`), 300);
    return;
  }

  try {
    if (currentRestartTimer) clearTimeout(currentRestartTimer);
    isStarting = true;
    lastStartTime = Date.now();
    recognition.start();
    console.log(`[VOICE] ${source} — mic started successfully`);
  } catch (err: any) {
    isStarting = false;
    console.warn(`[VOICE] ${source} — start exception:`, err?.message || err);
    if (err?.name === "InvalidStateError") {
      micState = "LISTENING";
    }
  }
};

export const initVoiceController = (rec: any) => {
  if (recognition) {
    try {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.stop();
    } catch (e) { }
  }

  recognition = rec;
  micState = "IDLE";
  isStarting = false;

  recognition.onstart = () => {
    micState = "LISTENING";
    isStarting = false;
    restartInProgress = false;
    lastErrorType = "";

    // 🔔 Play chime sound whenever mic hardware activates for user input
    playAudioChime("turn_start");

    // 🔥 Fast Stability Window: Reset backoff after 2 seconds of active listening
    setTimeout(() => {
      if (micState === "LISTENING") {
        errorBackoffCount = 0;
      }
    }, 2000);

    if (currentRestartTimer) clearTimeout(currentRestartTimer);
  };

  recognition.onend = () => {
    console.log("[VOICE] onend received. State:", micState, "Reasons:", Array.from(pauseReasons));

    isStarting = false;

    if (micState !== "PAUSED_BY_REASON") {
      micState = "IDLE";
    }

    if (pauseReasons.size > 0 || restartInProgress) {
      return;
    }

    // 🚀 INSTANT AUTO-RESTART — Keeps Vaani continuously listening
    restartInProgress = true;
    resetDeadlockTimer();

    // Fast recovery delay (100ms for normal end, max 2000ms on repeated errors)
    let delay = 100;
    if (errorBackoffCount > 0) {
      delay = Math.min(300 * Math.pow(1.3, errorBackoffCount), 2000);
    }

    if (currentRestartTimer) clearTimeout(currentRestartTimer);
    currentRestartTimer = setTimeout(() => {
      restartInProgress = false;
      safeStart("auto-restart");
    }, delay);
  };

  recognition.onerror = (event: any) => {
    isStarting = false;
    const err = event?.error || "unknown";
    console.log("[VOICE] onerror event:", err);

    // 🔇 1. Normal ambient silence (no-speech) — NEVER penalize
    if (err === 'no-speech') {
      micState = "IDLE";
      restartInProgress = false;
      if (currentRestartTimer) clearTimeout(currentRestartTimer);
      currentRestartTimer = setTimeout(() => {
        safeStart("no-speech-quick-restart");
      }, 50);
      return;
    }

    // 🌐 2. Network hiccup — transient retry without penalty
    if (err === 'network') {
      micState = "IDLE";
      restartInProgress = false;
      if (currentRestartTimer) clearTimeout(currentRestartTimer);
      currentRestartTimer = setTimeout(() => {
        safeStart("network-retry");
      }, 300);
      return;
    }

    const isPlannedAbort = err === 'aborted' && (micState === "PAUSED_BY_REASON" || pauseReasons.size > 0);

    if (!isPlannedAbort) {
      lastErrorType = err;
      lastErrorTime = Date.now();
      errorBackoffCount++;
    } else {
      console.log("[VOICE] Planned abort — skipping penalty backoff");
      lastErrorType = "SUCCESS_PAUSE";
      lastErrorTime = Date.now();
    }

    // 💣 RE-INITIALIZATION & HARDWARE ERROR TRIGGER
    if (err === 'audio-capture' || err === 'not-allowed' || err === 'service-not-allowed') {
      console.warn(`[VOICE] Hardware/permission error detected: ${err}`);
      
      if (errorBackoffCount >= 2) {
        console.warn(`[VOICE] Persistent ${err} error — pausing listening and notifying UI`);
        pauseListening("ERROR");
        
        window.dispatchEvent(
          new CustomEvent("vaani:voice_event", {
            detail: {
              type: "ERROR",
              reason: err,
              timestamp: Date.now(),
            },
          })
        );
      }
    } else if (errorBackoffCount >= 5 && reinitCallback) {
      console.warn("[VOICE] Persistent error — Triggering Re-initialization");
      reinitCallback();
      errorBackoffCount = 0;
      return;
    }

    micState = "IDLE";
    restartInProgress = false;
  };

  console.log("[VOICE] Recognition initialized");
};

/**
 * 🎙️ Request explicit microphone permissions & unlock audio input stream
 */
export const requestAudioPermission = async (): Promise<boolean> => {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("[VOICE] Requesting mic stream permission via getUserMedia...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      console.log("[VOICE] Mic stream permission granted successfully.");
      return true;
    }
  } catch (err) {
    console.warn("[VOICE] getUserMedia mic permission failed:", err);
  }
  return false;
};

/* ======================================================
   ▶️ START LISTENING (SAFE)
   ====================================================== */

export const startListening = () => {
  safeStart("manual-start");
};

/* ======================================================
   ⏸️ PAUSE (EXPLICIT)
   ====================================================== */

let ttsDeadlockWatchdog: ReturnType<typeof setTimeout> | null = null;

export const pauseListening = (reason: PauseReason) => {
  if (!recognition) return;

  pauseReasons.add(reason);
  resetDeadlockTimer();

  if (reason === "TTS") {
    if (ttsDeadlockWatchdog) clearTimeout(ttsDeadlockWatchdog);
    ttsDeadlockWatchdog = setTimeout(() => {
      if (pauseReasons.has("TTS")) {
        console.warn("[VOICE] TTS deadlock watchdog triggered — forcing TTS mic unlock");
        resumeListening("TTS");
      }
    }, 4000);
  }

  if (micState === "LISTENING") {
    try {
      // Use abort() for immediate halt to prevent 'onend' processing old data
      recognition.abort();
    } catch { }
    micState = "PAUSED_BY_REASON";
    console.log("[VOICE] Paused by", reason);
  }
};

/* ======================================================
   ▶️ RESUME (ONLY IF PAUSED)
   ====================================================== */

export const resumeListening = (reason: PauseReason) => {
  if (!pauseReasons.has(reason)) return;

  pauseReasons.delete(reason);

  if (pauseReasons.size > 0) return;
  if (!recognition) return;

  if (deadlockTimer) clearTimeout(deadlockTimer);
  safeStart("resume");
};

/**
 * Specifically for cleared the 'GLOBAL_EXIT' lock
 * triggered by wake word.
 */
export const resumeAfterWake = () => {
  resumeListening("GLOBAL_EXIT");
};

/* ======================================================
   🛑 STOP (HARD)
   ====================================================== */

export const stopListening = () => {
  if (!recognition) return;
  if (deadlockTimer) clearTimeout(deadlockTimer);

  try {
    pauseReasons.clear();
    restartInProgress = false;
    isStarting = false;
    recognition.abort();
  } catch { }

  micState = "IDLE";
  console.log("[VOICE] Listening stopped");
};

/* ======================================================
   🔍 STATE HELPERS
   ====================================================== */

export const isListening = () => micState === "LISTENING";
export const isPaused = () => micState === "PAUSED_BY_REASON";
export const getMicState = () => micState;

/* ======================================================
   💣 HARD RESET (RARE)
   ====================================================== */

export const resetVoiceController = () => {
  if (deadlockTimer) clearTimeout(deadlockTimer);
  try {
    recognition?.abort();
  } catch { }

  recognition = null;
  micState = "IDLE";
  pauseReasons.clear();
  restartInProgress = false;
  isStarting = false;

  console.log("[VOICE] Controller hard reset");
};

export const initVoiceRecognition = initVoiceController;
