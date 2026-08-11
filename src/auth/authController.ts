import React from "react";
import { normalizeEmail } from "@/services/emailNormalizer";
import { parseVoicePin } from "@/services/voicePinService";
import { RegisterStep, LoginStep } from "./authTypes";

/* ================= REGISTRATION SESSION ================= */

export interface RegistrationSession {
  email: string;
  password?: string;
  appPassword?: string;
  voicePin?: string;
  faceImage?: File;
}

/* ================= CONFIRMATION PARSER ================= */

/**
 * Robustly parses affirmative ("YES") vs negative ("NO") speech confirmation.
 * Negative phrasing is checked FIRST to prevent phrases like "not correct" or "it's incorrect"
 * from matching positive keywords like "correct".
 */
export const parseConfirmationIntent = (text: string): "YES" | "NO" | "AMBIGUOUS" => {
  const norm = text.toLowerCase().trim();

  // 1. Check negative patterns FIRST
  const negativePatterns = [
    /\bnot\s+correct\b/,
    /\bno\b/,
    /\bincorrect\b/,
    /\bwrong\b/,
    /\bfalse\b/,
    /\bretry\b/,
    /\bchange\b/,
    /\bfix\b/,
    /\bnope\b/,
    /\bnah\b/,
    /\bdon'?t\b/,
    /\bain'?t\b/,
    /\bcancel\b/,
    /\bstop\b/,
    /\bbad\b/,
    /\bdifferent\b/
  ];

  for (const pattern of negativePatterns) {
    if (pattern.test(norm)) return "NO";
  }

  // Soft fallback for negative modifiers
  if (norm.includes("not") || norm.includes("n't") || norm.includes("no ") || norm.includes("incorrect") || norm.includes("wrong")) {
    return "NO";
  }

  // 2. Check affirmative patterns SECOND
  const affirmativePatterns = [
    /\byes\b/,
    /\byeah\b/,
    /\byep\b/,
    /\byup\b/,
    /\bcorrect\b/,
    /\bright\b/,
    /\bconfirm\b/,
    /\btrue\b/,
    /\bsure\b/,
    /\bperfect\b/,
    /\bgreat\b/,
    /\ball\s+right\b/,
    /\balright\b/
  ];

  for (const pattern of affirmativePatterns) {
    if (pattern.test(norm)) return "YES";
  }

  return "AMBIGUOUS";
};

/* ================= SPEECH HANDLERS (SP1) ================= */

/**
 * VOICE-FIRST REGISTRATION STATE MACHINE
 */
export const handleRegisterSpeech = (
  text: string,
  session: RegistrationSession,
  setSession: React.Dispatch<React.SetStateAction<RegistrationSession>>,
  step: RegisterStep,
  setStep: (step: RegisterStep) => void,
  speak: (msg: string) => void
): void => {

  // 👂 GLOBAL CONFIRMATION HANDLING
  if (step.startsWith("CONFIRM_")) {
    const confirmation = parseConfirmationIntent(text);

    if (confirmation === "YES") {
      if (step === "CONFIRM_EMAIL") {
        setStep("PASSWORD");
        speak("Great. Now, please say your password.");
      } else if (step === "CONFIRM_PASSWORD") {
        setStep("FACE");
        speak("Got it. Now I need to capture your face for biometric identity. Please look at the camera to begin.");
      } else if (step === "CONFIRM_VOICE_PIN") {
        setStep("COMPLETE");
        speak("Finalizing your secure registration.");
      }
      return;
    }

    if (confirmation === "NO") {
      if (step === "CONFIRM_EMAIL") {
        setStep("EMAIL");
        speak("My apologies. Please say your email address again.");
      } else if (step === "CONFIRM_PASSWORD") {
        setStep("PASSWORD");
        speak("No problem. Please say your password again.");
      } else if (step === "CONFIRM_VOICE_PIN") {
        setStep("VOICE_PIN");
        speak("Please say your four digit voice PIN again.");
      }
      return;
    }

    speak("I didn't catch that. Please say yes to confirm or no to try again.");
    return;
  }

  // ✍️ CAPTURE STEPS
  switch (step) {
    case "EMAIL": {
      const email = normalizeEmail(text);
      if (!email || !email.includes("@")) {
        speak("That does not sound like a valid email. Please say it again.");
        return;
      }
      setSession((prev) => ({ ...prev, email }));
      setStep("CONFIRM_EMAIL");
      speak(`Email set to ${email}. Is that correct?`);
      return;
    }

    case "PASSWORD": {
      const cleanPassword = text.trim().replace(/\s+/g, "");
      if (!cleanPassword || cleanPassword.length < 6) {
        speak("Password must be at least 6 characters long for security. Please say a password with at least 6 characters.");
        return;
      }
      setSession((prev) => ({ ...prev, password: cleanPassword }));
      setStep("CONFIRM_PASSWORD");
      speak(`I captured your password. Is that correct?`);
      return;
    }



    case "VOICE_PIN": {
      const result = parseVoicePin(text);
      if (!result.isValid || !result.pin) {
        speak("That does not sound like a four digit PIN. Please say each digit clearly, like 1 2 3 4.");
        return;
      }

      setSession((prev) => ({ ...prev, voicePin: result.pin }));
      setStep("CONFIRM_VOICE_PIN");
      speak(`I heard your PIN as ${result.pin.split("").join(" ")}. Is that correct?`);
      return;
    }


    case "FACE":
      // Camera service advances this via vaani:face event
      return;

    default:
      return;
  }
};

/**
 * VOICE-FIRST LOGIN STATE MACHINE
 */
export const handleLoginSpeech = (
  text: string,
  step: LoginStep,
  setStep: (step: LoginStep) => void,
  speak: (msg: string) => void,
  loginDataRef: React.MutableRefObject<any>
): void => {
  switch (step) {
    case "EMAIL": {
      const email = normalizeEmail(text);
      if (!email || !email.includes("@")) {
        speak("That does not sound like a valid email. Please say it again.");
        return;
      }
      loginDataRef.current.email = email;
      setStep("PASSWORD");
      speak(`Email set to ${email}. Now, please say your password.`);
      return;
    }

    case "PASSWORD": {
      loginDataRef.current.password = text;
      setStep("CONFIRM_LOGIN_PASSWORD");
      speak("I captured your password. Is that correct?");
      return;
    }

    case "CONFIRM_LOGIN_PASSWORD": {
      const confirmation = parseConfirmationIntent(text);

      if (confirmation === "YES") {
        setStep("FACE");
        speak("Password confirmed. Looking for your face now.");
      } else if (confirmation === "NO") {
        setStep("PASSWORD");
        speak("No problem. Please say your password again.");
      } else {
        speak("Please say yes to confirm or no to try again.");
      }
      return;
    }

    case "FACE":
      return;

    case "VOICE_PIN": {
      const result = parseVoicePin(text);
      if (!result.isValid || !result.pin) {
        speak("Invalid PIN. Please say your four digit voice PIN.");
        return;
      }
      loginDataRef.current.spokenPin = result.pin;
      setStep("SUCCESS");
      return;
    }
  }
};

/* ================= BIOMETRIC LOGIN EXECUTION ================= */

import bcrypt from "bcryptjs";

export const authState = {
  isAuthenticated: false,
  userId: undefined as string | undefined,
  canPerformSensitiveAction(): boolean {
    return this.isAuthenticated;
  },
};

export const logout = (): void => {
  authState.isAuthenticated = false;
  authState.userId = undefined;
};

export interface BiometricLoginParams {
  inputFace: any;
  storedFace: Blob;
  inputPin: string;
  storedPinHash: string;
  userId: string;
}

export const loginWithBiometrics = async (
  params: BiometricLoginParams
): Promise<{ ok: boolean; reason?: "NO_FACE" | "BAD_PIN" }> => {
  if (!params.inputFace) {
    authState.isAuthenticated = false;
    return { ok: false, reason: "NO_FACE" };
  }

  let isPinValid = false;
  try {
    isPinValid = await bcrypt.compare(params.inputPin, params.storedPinHash);
  } catch (err) {
    isPinValid = false;
  }

  if (!isPinValid) {
    authState.isAuthenticated = false;
    return { ok: false, reason: "BAD_PIN" };
  }

  authState.isAuthenticated = true;
  authState.userId = params.userId;
  return { ok: true };
};
