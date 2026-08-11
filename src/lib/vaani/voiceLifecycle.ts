// src/lib/vaani/voiceLifecycle.ts

import { canAcceptVoice, canRestartMic } from "./stateMachine";
import type { VaaniState } from "./stateMachine";
import {
  resumeAfterWake,
  startListening,
} from "@/lib/vaani/voiceStateController";
import { VoiceEvent } from "@/voice/voiceTypes";

/**
 * Wires SpeechRecognition → Vaani logic
 * SINGLE transcript entry point
 *
 * This file owns:
 * - recognition.onresult
 * - global command preemption
 * - state-based voice gating
 * - safe auto-restart
 *
 * 🚫 No Firebase
 * 🚫 No UI
 * 🚫 No TTS
 */
let lastTranscript = "";
let lastTranscriptTime = 0;
let wakeListenerBound = false;

export const bindVoiceLifecycle = (
  recognition: any,
  getState: () => VaaniState,
  handleIntent: (text: string) => void,
  resetSystem: () => void,
  getSensitivity: () => number
) => {
  if (!recognition) {
    console.error("[VOICE] Recognition instance missing");
    return;
  }

  // 👂 Wake/Sleep Listeners (Wiring)
  if (!wakeListenerBound) {
    window.addEventListener("vaani:wake", () => {
      console.log("[VOICE] Wake received — clearing GLOBAL_EXIT");
      resumeAfterWake();
    });
    wakeListenerBound = true;
  }

  recognition.onresult = (event: any) => {
    console.log("[VOICE] onresult received. Count:", event.results.length, "Index:", event.resultIndex);
    try {
      const startIndex = typeof event.resultIndex === "number" ? event.resultIndex : 0;

      for (let i = startIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res || !res[0]) continue;
        if (!res.isFinal && i < event.results.length - 1) continue; // Skip non-final unless it's the latest

        const transcript = res[0].transcript ? res[0].transcript.trim() : "";
        if (!transcript) continue;

        // Skip processing if this is an interim result that hasn't finalized yet (unless it's a direct wake word)
        const isFinal = res.isFinal;
        const normalizedTranscript = transcript.toLowerCase();

        // 🟢 WAKE WORD CHECK
        const wakeWords = ["hey vaani", "hi vaani", "hello vaani", "ok vaani", "hey goven", "hey gobind", "vaani"];
        const isWakeWordMatch = wakeWords.some(w => normalizedTranscript.includes(w));

        if (isWakeWordMatch && !isFinal) {
          console.log("[VOICE] Instant wake word detected in interim transcript:", transcript);
          window.dispatchEvent(new CustomEvent("vaani:wake"));
          return;
        }

        // Emit interim transcript for real-time speech visualizer
        window.dispatchEvent(
          new CustomEvent("vaani:interim_transcript", {
            detail: { text: transcript, isFinal },
          })
        );

        if (!isFinal) continue; // Only process full utterances for commands

        // Clear interim transcript once finalized
        window.dispatchEvent(
          new CustomEvent("vaani:interim_transcript", {
            detail: { text: "", isFinal: true },
          })
        );

        console.log("[VOICE] Processing final transcript:", transcript);

      // 🔴 EXIT / SLEEP COMMAND (Internal Runtime Logic)
      const exitWords = ["exit", "sleep", "go to sleep", "stop listening", "goodnight vaani", "bye bye"];
      const isExitCommand = exitWords.some(w => normalizedTranscript === w);

      if (isExitCommand) {
        console.log("[VOICE] Exit command detected:", transcript);
        window.dispatchEvent(new CustomEvent("vaani:sleep"));
        return;
      }

      // 🔒 GROUND TRUTH: Every user utterance ALWAYS enters chat log via this event
      window.dispatchEvent(
        new CustomEvent("vaani:voice_event", {
          detail: {
            type: "TRANSCRIPT",
            text: transcript,
            timestamp: Date.now(),
          } as VoiceEvent,
        })
      );


      // 🔒 State-based gating for downstream processing (Intent Engine)
      if (!canAcceptVoice(getState())) {
        console.log("[VOICE] Input gated by state:", getState());
        return;
      }

      const now = Date.now();
      // 🔒 Duplicate guard (800ms)
      if (transcript === lastTranscript && now - lastTranscriptTime < 800) {
        return;
      }

      lastTranscript = transcript;
      lastTranscriptTime = now;

      console.log("[VOICE] Forwarding to Intent Engine:", transcript);
      handleIntent(transcript);
      }
    } catch (err) {
      console.error("[VOICE] onresult handler failed", err);
    }
  };


  // 🚫 NOTE: onend and onerror are handled by voiceStateController.ts

  console.log("[VOICE] Voice lifecycle bound");
};


