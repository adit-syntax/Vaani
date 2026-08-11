// src/pages/Register.tsx

import { useEffect, useRef, useState } from "react";
import { useVaani } from "@/contexts/VaaniContext";
import { Layout } from "@/components/layout/Layout";
import { CheckCircle2, AlertCircle, ShieldCheck, Activity } from "lucide-react";
import { biometricService } from "@/services/biometricService";
import { cn } from "@/lib/utils";

const Register = () => {
  const { authStep, setRegistrationFaceImage } = useVaani();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [livenessStatus, setLivenessStatus] = useState<string>("Initializing...");
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [livenessError, setLivenessError] = useState<string | null>(null);

  /* ================= CAMERA & BIOMETRIC SETUP ================= */

  useEffect(() => {
    const isFaceActive = authStep === "FACE";

    if (!isFaceActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    const startRegistrationBiometrics = async () => {
      try {
        console.log("[REGISTER] Initializing Biometric Hardware...");

        // 1. Initialize AI Models
        await biometricService.init();

        // 2. Request Camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: 640,
            height: 480,
            frameRate: { ideal: 30 }
          },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for metadata
          await new Promise((res) => {
            videoRef.current!.onloadedmetadata = res;
          });
          await videoRef.current.play();
          console.log("[REGISTER] Camera Active");
        }

        // 3. Start Liveness Scan after a brief delay
        setTimeout(() => {
          runLivenessAnchor();
        }, 1500);

      } catch (err) {
        console.error("[REGISTER] Initialization Error:", err);
        setLivenessError("Camera access or AI module failed. Please check permissions.");
      }
    };

    startRegistrationBiometrics();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [authStep]);

  const runLivenessAnchor = async () => {
    if (!videoRef.current) return;

    setLivenessStatus("Presence Verification...");
    setLivenessProgress(10);
    setLivenessError(null);

    try {
      // Perform a full liveness check to ensure the anchor is NOT a spoof
      const result = await biometricService.checkLiveness(
        videoRef.current,
        (progress, msg) => {
          setLivenessProgress(progress);
          setLivenessStatus(msg);
        }
      );

      if (result.success) {
        setLivenessStatus("Presence Verified!");
        setLivenessProgress(100);

        // Capture the "Anchor" frame
        captureAnchorFrame();
      } else {
        setLivenessStatus("Verification Failed");
        setLivenessError(result.reason || "Liveness check failed.");
      }
    } catch (err) {
      console.error("[REGISTER] Biometric Analysis Error:", err);
      setLivenessError("Secure analysis failed. Please ensure good lighting.");
    }
  };

  const captureAnchorFrame = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "face_anchor.jpg", { type: "image/jpeg" });
      setRegistrationFaceImage(file);

      // 🔐 Temporarily store base64 for local biometric anchor
      const base64 = canvas.toDataURL("image/jpeg", 0.95);
      sessionStorage.setItem("vaani_temp_anchor", base64);

      // 🔐 Advance flow
      window.dispatchEvent(new CustomEvent("vaani:face", {
        detail: { result: "FACE_OK" }
      }));

      console.log("[REGISTER] Secure face anchor captured");
    }, "image/jpeg", 0.95);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
        <div className="text-center space-y-8 w-full max-w-4xl">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">🎙️ Secure Registration</h1>
            <p className="text-muted-foreground">
              Establishing your <span className="text-primary font-semibold">Liveness-Aware Identity</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-center">

            {/* LEFT: STEP WIZARD OR LIVE BIOMETRIC CAMERA HUD */}
            <div className="space-y-4">
              {authStep === "FACE" ? (
                <div className="relative group mx-auto w-72 h-72">
                  <div className="absolute -inset-4 rounded-full border-2 border-dashed border-primary/20 animate-[spin_10s_linear_infinite]" />

                  <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-3xl">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                    <div className="absolute inset-x-0 h-1 bg-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-[scan_3s_ease-in-out_infinite]" />
                  </div>

                  <div className="relative w-72 h-72 bg-black shadow-2xl border-4 border-white/5 rounded-3xl overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* Status HUD */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-md p-4 text-left border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-xs font-mono text-white/80 uppercase tracking-widest">
                          {livenessStatus}
                        </span>
                      </div>
                      <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${livenessProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-secondary/30 rounded-3xl border border-white/10 space-y-6 text-left shadow-xl">
                  <h3 className="text-lg font-bold text-foreground">Registration Progress</h3>
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                      authStep === "EMAIL" || authStep === "CONFIRM_EMAIL"
                        ? "bg-primary/20 border-primary/50 text-foreground"
                        : ["PASSWORD", "CONFIRM_PASSWORD", "FACE", "VOICE_PIN", "CONFIRM_VOICE_PIN", "COMPLETE"].includes(authStep)
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-muted/30 border-transparent opacity-50"
                    )}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm bg-background/50">1</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Email Address</p>
                        <p className="text-xs text-muted-foreground">Voice email input & confirmation</p>
                      </div>
                      {["PASSWORD", "CONFIRM_PASSWORD", "FACE", "VOICE_PIN", "CONFIRM_VOICE_PIN", "COMPLETE"].includes(authStep) && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                    </div>

                    {/* Step 2 */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                      authStep === "PASSWORD" || authStep === "CONFIRM_PASSWORD"
                        ? "bg-primary/20 border-primary/50 text-foreground"
                        : ["FACE", "VOICE_PIN", "CONFIRM_VOICE_PIN", "COMPLETE"].includes(authStep)
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-muted/30 border-transparent opacity-50"
                    )}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm bg-background/50">2</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Account Password</p>
                        <p className="text-xs text-muted-foreground">Voice password entry & confirmation</p>
                      </div>
                      {["FACE", "VOICE_PIN", "CONFIRM_VOICE_PIN", "COMPLETE"].includes(authStep) && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                    </div>

                    {/* Step 3 */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                      authStep === "FACE"
                        ? "bg-primary/20 border-primary/50 text-foreground"
                        : ["VOICE_PIN", "CONFIRM_VOICE_PIN", "COMPLETE"].includes(authStep)
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-muted/30 border-transparent opacity-50"
                    )}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm bg-background/50">3</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Biometric Face Anchor</p>
                        <p className="text-xs text-muted-foreground">Camera activates for liveness verification</p>
                      </div>
                      {["VOICE_PIN", "CONFIRM_VOICE_PIN", "COMPLETE"].includes(authStep) && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                    </div>

                    {/* Step 4 */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                      authStep === "VOICE_PIN" || authStep === "CONFIRM_VOICE_PIN"
                        ? "bg-primary/20 border-primary/50 text-foreground"
                        : authStep === "COMPLETE"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-muted/30 border-transparent opacity-50"
                    )}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm bg-background/50">4</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Voice PIN 2FA</p>
                        <p className="text-xs text-muted-foreground">Four digit voice security PIN</p>
                      </div>
                      {authStep === "COMPLETE" && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: REGISTRATION STATUS & GUIDANCE */}
            <div className="space-y-6 text-left p-8 bg-secondary/20 rounded-3xl border border-white/5 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Registration Step</h2>
                  <p className="text-xs text-primary font-semibold uppercase tracking-wider">Step: {authStep}</p>
                </div>
              </div>

              {authStep === "FACE" ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We are creating a secure biometric anchor for your account. Look at the camera to establish your liveness-verified identity.
                  </p>

                  {livenessError ? (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-xs font-bold uppercase">Security Warning</p>
                      </div>
                      <p className="text-sm text-destructive/90">{livenessError}</p>
                      <button
                        onClick={runLivenessAnchor}
                        className="w-full py-2 bg-destructive text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                      <ul className="text-xs space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Look directly into the camera lens.
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Blink naturally when prompted.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : authStep === "COMPLETE" ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3 text-green-500">
                    <CheckCircle2 className="w-6 h-6" />
                    <p className="font-bold">Registration Complete!</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your account, voice PIN, and biometric identity anchor have been securely established.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Speak naturally into your microphone when Vaani asks for your input. If Vaani asks for confirmation, say <span className="text-primary font-semibold">"yes"</span> or <span className="text-destructive font-semibold">"no" / "incorrect"</span>.
                  </p>
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                    <p className="text-xs font-semibold text-primary mb-1">Voice Guidance</p>
                    <p className="text-xs text-muted-foreground">
                      Saying <i>"not correct"</i>, <i>"incorrect"</i>, or <i>"no"</i> will immediately return you to re-state your input.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0.1; }
          50% { top: 100%; opacity: 0.8; }
        }
      `}</style>
    </Layout>
  );
};

export default Register;
