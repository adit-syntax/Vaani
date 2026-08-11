// src/lib/firebase/auth.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User,
} from "firebase/auth";

import { auth } from "./firebase";
import {
  getAuthSecurityState,
  verifyVoicePin,
} from "./users";

export { getAuthSecurityState, verifyVoicePin };

/* ======================================================
   🔐 AUTH PERSISTENCE (CRITICAL — SET ONCE)
   ====================================================== */

// Persist session across refreshes (REQUIRED for Gmail restore later)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("[AUTH] Persistence set to LOCAL");
  })
  .catch((err) => {
    console.error("[AUTH] Failed to set persistence", err);
  });

/* ======================================================
   AUTH OPERATIONS (RAW)
   ====================================================== */

/**
 * Register user with email & password
 * (NO security checks here — registration flow handles that)
 */
export const registerWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
};

/**
 * Login user with email & password
 * ⚠️ AUTH ONLY — does NOT imply secure login
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

/**
 * Logout current user
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Listen to auth state (session persistence)
 */
export const onAuthChange = (cb: (user: User | null) => void) => {
  return onAuthStateChanged(auth, cb);
};

/* ======================================================
   🔒 AUTHORITATIVE LOGIN SECURITY CHECK
   ====================================================== */

/**
 * FULL Firebase login security verification
 *
 * 🔐 SINGLE SOURCE OF TRUTH
 * Vaani MUST NOT treat user as logged-in until this returns "OK"
 *
 * Order (LOCKED):
 * 1. Face must be registered
 * 2. Voice PIN must match
 */
import { getFaceImageUrl } from "./storage";

export const verifyFirebaseLoginSecurity = async (
  user: User,
  spokenPin: string
): Promise<{ status: "OK" | "NO_FACE" | "BAD_PIN"; faceImageUrl?: string }> => {
  const uid = user.uid;

  const security = await getAuthSecurityState(uid);

  // 🚫 Face not registered → block login
  if (!security.faceRegistered) {
    return { status: "NO_FACE" };
  }

  // 📍 RESOLVE FACE IMAGE (LOCAL VS REMOTE)
  let faceImageUrl = security.faceImageUrl;
  if (faceImageUrl === "LOCAL") {
    try {
      faceImageUrl = await getFaceImageUrl(uid);
    } catch (err) {
      console.warn("[AUTH] Failed to fetch local face image", err);
      // Fallback or keep as "LOCAL"
    }
  }

  // 🔐 Verify voice PIN
  const pinValid = await verifyVoicePin(uid, spokenPin);

  if (!pinValid) {
    return { status: "BAD_PIN", faceImageUrl };
  }

  // ✅ Fully authenticated & verified
  return { status: "OK", faceImageUrl };
};


