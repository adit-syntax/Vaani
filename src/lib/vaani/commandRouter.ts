// src/lib/vaani/commandRouter.ts

import { resetVoiceController } from "./voiceStateController";

/**
 * Handles global voice commands that must work
 * in ALL states (registering, face capture, errors, etc.)
 *
 * HARD RULES:
 * - Must preempt ALL other logic
 * - Must be safe in ANY state
 * - Must never throw
 *
 * @returns true if command was handled
 */
export const handleGlobalCommand = (
  transcript: string,
  resetSystem: () => void,
  state?: string,
  setVoiceMode?: (mode: "GLOBAL" | "GMAIL") => void
): boolean => {
  try {
    const cmd = transcript.toLowerCase().trim();
    //     // 🚫 BLOCK GMAIL COMMANDS IF NOT AUTHENTICATED
    // if (
    //   (cmd.includes("gmail") || cmd.includes("email")) &&
    //   state !== "AUTHENTICATED"
    // ) {
    //   console.warn("[COMMAND] Gmail command blocked — not authenticated");
    //   return true; // handled & blocked
    // }



    // 🔴 GLOBAL EXIT — ABSOLUTE INTERRUPT
    if (
      cmd === "exit" ||
      cmd.includes("exit vaani") ||
      cmd.includes("stop vaani") ||
      cmd.includes("close assistant")
    ) {
      console.log("[COMMAND] Global exit triggered");

      // 🧹 Kill mic lifecycle completely (single source of truth)
      resetVoiceController();

      // 🔇 Cancel any ongoing TTS safely
      try {
        window.speechSynthesis.cancel();
      } catch { }

      // 🔄 Reset app / assistant state (VaaniContext owns this)
      // 🔁 Force voice mode back to GLOBAL
      if (setVoiceMode) {
        setVoiceMode("GLOBAL");
      }
      resetSystem();

      return true;
    }

    return false;
  } catch (err) {
    console.error("[COMMAND] Global command handler failed", err);
    return false;
  }
};
