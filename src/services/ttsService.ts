// src/services/ttsService.ts

import {
  pauseListening,
  resumeListening,
} from "@/lib/vaani/voiceStateController";
import { playAudioChime } from "@/services/audioSoundService";

/* ======================================================
   🔊 TEXT-TO-SPEECH (SAFE & AUTHORITATIVE)
   ====================================================== */

let isSpeaking = false;

const notifyTTSState = (active: boolean) => {
  isSpeaking = active;
  document.body.dataset.ttsActive = active ? "true" : "false";
  window.dispatchEvent(
    new CustomEvent("vaani:tts_state", {
      detail: { isSpeaking: active },
    })
  );
};

const finalizeTTS = (resolve?: () => void) => {
  notifyTTSState(false);

  // Fast 300ms transition before listening resumes
  setTimeout(() => {
    resumeListening("TTS");
  }, 300);

  if (resolve) resolve();
};

/**
 * HARD INTERRUPT — stop speech immediately
 * Used when user speaks during TTS
 */
export const interruptTTS = (shouldResume = true) => {
  console.log("[TTS] Interrupted. Should Resume Mic:", shouldResume);
  window.speechSynthesis.cancel();
  notifyTTSState(false);

  if (shouldResume) {
    setTimeout(() => {
      resumeListening("TTS");
    }, 100);
  }
};

/**
 * WARM UP — unlock speech synthesis on user gesture
 */
export const warmUpTTS = () => {
  try {
    const utterance = new SpeechSynthesisUtterance("");
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    console.log("[TTS] System warmed up");
  } catch (e) {
    console.error("[TTS] Warm up failed:", e);
  }
};

let currentSafetyTimeout: any = null;

export const speakText = (text: string, options?: { cancelPrevious?: boolean, volume?: number, rate?: number }): Promise<void> => {
  return new Promise((resolve) => {
    if (!text || !text.trim()) {
      resolve();
      return;
    }

    // Always cancel previous speech so new text speaks cleanly without deadlock
    if (isSpeaking || window.speechSynthesis.speaking) {
      console.log("[TTS] Interrupting previous speech for new request:", text);
      window.speechSynthesis.cancel();
      if (currentSafetyTimeout) clearTimeout(currentSafetyTimeout);
      notifyTTSState(false);
    }

    notifyTTSState(true);

    try {
      console.log("[TTS] Speaking:", text, "Volume:", options?.volume, "Rate:", options?.rate);

      // 🔒 Pause mic ONLY during active speech lifecycle
      pauseListening("TTS");

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";

      if (options?.volume !== undefined) utterance.volume = options.volume;
      if (options?.rate !== undefined) utterance.rate = options.rate;

      utterance.onstart = () => {
        console.log("[TTS] Speech started");
        notifyTTSState(true);
      };

      utterance.onend = () => {
        console.log("[TTS] Speech ended");
        if (currentSafetyTimeout) clearTimeout(currentSafetyTimeout);
        finalizeTTS(resolve);
      };

      utterance.onerror = (err: any) => {
        console.error("[TTS] Speech error:", err);
        // 🔒 If error is 'interrupted' from a previous cancelled speech, DO NOT reset active state for new utterance
        if (err?.error === "interrupted") {
          return;
        }
        if (currentSafetyTimeout) clearTimeout(currentSafetyTimeout);
        finalizeTTS(resolve);
      };

      // 🧯 HARD FAILSAFE — prevent mic deadlock if browser speech fails to fire onend
      currentSafetyTimeout = setTimeout(() => {
        console.warn("[TTS] Safety timeout triggered — forcing speech cleanup & mic unlock");
        window.speechSynthesis.cancel();
        finalizeTTS(resolve);
      }, 10000); // 10s max speech per utterance

      window.speechSynthesis.speak(utterance);

    } catch (err) {
      console.error("[TTS] Fatal error:", err);
      if (currentSafetyTimeout) clearTimeout(currentSafetyTimeout);
      finalizeTTS(resolve);
    }
  });
};
