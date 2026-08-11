// src/components/voice/VoiceTurnIndicator.tsx

import React, { useState, useEffect, useRef } from "react";
import { useVaani } from "@/contexts/VaaniContext";
import { Mic, Volume2, Loader2, Radio, AlertCircle } from "lucide-react";
import { resumeListening, startListening, requestAudioPermission } from "@/lib/vaani/voiceStateController";
import { playAudioChime } from "@/services/audioSoundService";
import { cn } from "@/lib/utils";

export const VoiceTurnIndicator: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { state, setState, interimTranscript, assistantEnabled } = useVaani();
  const [isTTSActive, setIsTTSActive] = useState(false);
  const wasListeningRef = useRef(false);

  useEffect(() => {
    const handleTTSState = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.isSpeaking === "boolean") {
        setIsTTSActive(detail.isSpeaking);
      }
    };

    window.addEventListener("vaani:tts_state", handleTTSState);
    return () => window.removeEventListener("vaani:tts_state", handleTTSState);
  }, []);

  if (!assistantEnabled && state === "DORMANT") {
    return null;
  }

  const isResponding = isTTSActive || state === "RESPONDING";

  const isListening = !isResponding && (
    state === "LISTENING" ||
    state === "AWAKE" ||
    state === "AUTH_REGISTER" ||
    state === "AUTH_LOGIN" ||
    state === "WAITING_FOR_PIN"
  );

  // 🔔 Trigger audio chime on transition to user turn
  useEffect(() => {
    if (isListening && !wasListeningRef.current) {
      playAudioChime("turn_start");
    }
    wasListeningRef.current = isListening;
  }, [isListening]);

  const isProcessing = state === "PROCESSING" || state === "REGISTERING" || state === "AUTHENTICATING";
  const isError = state === "ERROR" || state === "AUTH_FAILED";

  const handleRetryMic = async () => {
    const granted = await requestAudioPermission();
    if (granted) {
      resumeListening("ERROR");
      startListening();
      setState("LISTENING");
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 rounded-2xl backdrop-blur-xl border shadow-2xl overflow-hidden",
        compact ? "p-3 bg-card/90" : "p-4 bg-background/95 border-border/60"
      )}
    >
      {/* 🔴 TURN TAKING STATUS HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Status Badge Icon */}
          <div
            onClick={isError ? handleRetryMic : undefined}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md",
              isError && "bg-destructive/20 text-destructive ring-2 ring-destructive/50 cursor-pointer hover:scale-105",
              isListening && "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/50 animate-pulse",
              isResponding && "bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/50 animate-pulse",
              isProcessing && "bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/50",
              !isListening && !isResponding && !isProcessing && !isError && "bg-muted text-muted-foreground"
            )}
          >
            {isError && <AlertCircle className="w-5 h-5 animate-bounce text-destructive" />}
            {isListening && <Mic className="w-5 h-5 animate-bounce" />}
            {isResponding && <Volume2 className="w-5 h-5 animate-pulse" />}
            {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
            {!isListening && !isResponding && !isProcessing && !isError && <Radio className="w-5 h-5" />}
          </div>

          {/* Turn Label & Instructions */}
          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  isError && "bg-destructive/10 border-destructive/30 text-destructive cursor-pointer",
                  isListening && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                  isResponding && "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
                  isProcessing && "bg-amber-500/10 border-amber-500/30 text-amber-400",
                  !isListening && !isResponding && !isProcessing && !isError && "bg-muted/50 border-border text-muted-foreground"
                )}
                onClick={isError ? handleRetryMic : undefined}
              >
                {isError && "🔴 MICROPHONE ERROR — CLICK TO RETRY"}
                {isListening && "🟢 YOUR TURN — SPEAK NOW"}
                {isResponding && "🔴 ASSISTANT SPEAKING — PLEASE WAIT"}
                {isProcessing && "🟡 PROCESSING — PLEASE WAIT"}
                {!isListening && !isResponding && !isProcessing && !isError && "⚪ DORMANT — SAY 'HEY VAANI'"}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              {isError && "Microphone hardware error. Click badge to retry permissions."}
              {isListening && (interimTranscript ? "Listening to your voice..." : "Speak into your microphone now...")}
              {isResponding && "Vaani is reading out the response..."}
              {isProcessing && "Understanding your prompt..."}
              {!isListening && !isResponding && !isProcessing && !isError && "Click mic or say 'Hey Vaani'"}
            </p>
          </div>
        </div>

        {/* 🌊 ANIMATED SOUND WAVE VISUALIZER */}
        {(isListening || isResponding) && (
          <div className="flex items-center gap-1 h-6 px-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-150",
                  isListening ? "bg-emerald-400 animate-sound-wave" : "bg-cyan-400 animate-sound-wave"
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  height: isListening && interimTranscript ? `${Math.floor(Math.random() * 16) + 8}px` : "12px",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 🎙️ REAL-TIME INTERIM SPEECH PREVIEW */}
      {isListening && interimTranscript && (
        <div className="mt-3 pt-2.5 border-t border-emerald-500/20 bg-emerald-950/30 rounded-lg p-2.5 flex items-start gap-2 animate-fade-in">
          <Mic className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs font-medium text-emerald-200 leading-relaxed">
            <span className="text-emerald-400 font-semibold mr-1">Hearing:</span>
            <span className="italic font-normal text-emerald-100">"{interimTranscript}"</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const FloatingVoiceBar: React.FC = () => {
  const { assistantEnabled, state, isAssistantOpen } = useVaani();

  // 🔑 Hide floating bar if panel is open, or if dormant/sleeping
  if (!assistantEnabled || state === "DORMANT" || state === "SLEEPING" || isAssistantOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990] w-11/12 max-w-md animate-slide-up pointer-events-auto">
      <VoiceTurnIndicator />
    </div>
  );
};
