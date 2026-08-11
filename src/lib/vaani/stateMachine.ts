// src/lib/vaani/stateMachine.ts

/**
 * Vaani assistant finite states
 * SINGLE SOURCE OF TRUTH
 */
export type VaaniState =
  | "DORMANT"      // initial boot only
  | "SLEEPING"     // explicit exit / sleep
  | "AWAKE"
  | "LISTENING"
  | "AUTH_REGISTER"
  | "AUTH_LOGIN"
  | "WAITING_FOR_FACE"
  | "WAITING_FOR_LIVENESS"
  | "WAITING_FOR_PIN"
  | "PROCESSING"
  | "RESPONDING"
  | "AUTHENTICATED"
  | "REGISTERING"
  | "AUTHENTICATING"
  | "AUTH_FAILED"
  | "ERROR";




const AUTH_STATES: VaaniState[] = [
  "AUTH_REGISTER",
  "AUTH_LOGIN",
  "REGISTERING",
  "AUTHENTICATING",
  "WAITING_FOR_LIVENESS",
  "AUTH_FAILED",
];


/* ======================================================
   🛑 HARD MIC STOP STATES
   ====================================================== */

/**
 * In these states:
 * - Mic must NOT auto-restart
 * - Exit / sleep enforced
 */
const MIC_HARD_STOP_STATES: VaaniState[] = [
  "SLEEPING",
  "DORMANT",
  "RESPONDING",
];


/* ======================================================
   🚫 HARD BLOCK STATES
   ====================================================== */

/**
 * In these states:
 * - NO voice input
 */

// NOTE: ERROR state must allow voice for recovery
const VOICE_BLOCKED_STATES: VaaniState[] = [
  "PROCESSING",
  "RESPONDING",
  "WAITING_FOR_FACE",
  "WAITING_FOR_LIVENESS",
  "SLEEPING",
  "DORMANT",
];



/**
 * In these states:
 * - ONLY PIN input is allowed
 */
const PIN_ONLY_STATES: VaaniState[] = [
  "WAITING_FOR_PIN",
];

/* ======================================================
   🎙️ VOICE PERMISSION RULES
   ====================================================== */

/**
 * Can Vaani accept ANY voice input?
 */

export const canAcceptVoice = (state: VaaniState): boolean => {
  if (state === "LISTENING" || state === "AWAKE") return true;

  // 🔒 AUTH FLOWS MUST ALWAYS ACCEPT VOICE
  if (AUTH_STATES.includes(state)) return true;

  // 🚫 Hard-blocked states
  if (VOICE_BLOCKED_STATES.includes(state)) return false;

  return true;
};

/* ======================================================
   🎤 MIC RESTART RULES
   ====================================================== */

/**
 * Can mic auto-restart in this state?
 */


export const canRestartMic = (state: VaaniState) => {
  return (
    state === "LISTENING" ||
    state === "AWAKE" ||
    state === "SLEEPING" ||   // ✅ ADD THIS
    state === "AUTH_LOGIN" ||
    state === "AUTH_REGISTER"
  );
};


/**
 * Is assistant expecting ONLY PIN input?
 */
export const isPinOnlyState = (state: VaaniState): boolean => {
  return PIN_ONLY_STATES.includes(state);
};

/**
 * Is voice completely blocked?
 */
export const isVoiceBlockedState = (state: VaaniState): boolean => {
  return VOICE_BLOCKED_STATES.includes(state);
};

/* ======================================================
   🔊 SPEAKING PERMISSION RULES
   ====================================================== */

/**
 * Can Vaani speak in this state?
 */
export const canSpeak = (state: VaaniState): boolean => {
  switch (state) {
    case "AWAKE":
    case "LISTENING":
    case "AUTH_REGISTER":
    case "AUTH_LOGIN":
    case "ERROR":
    case "REGISTERING":
    case "AUTHENTICATING":
    case "AUTH_FAILED":
      return true;


    default:
      return false;
  }
};
