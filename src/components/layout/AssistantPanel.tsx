import { useEffect, useRef } from "react";
import { useVaani } from "@/contexts/VaaniContext";
import { cn } from "@/lib/utils";
import { Mic, X } from "lucide-react";
import { VoiceTurnIndicator } from "@/components/voice/VoiceTurnIndicator";

const VaaniOverlay = () => {
  const { enableAssistant } = useVaani();

  return (
    <div
      onClick={enableAssistant}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 text-white cursor-pointer"
    >
      <div className="text-center space-y-2">
        <h1 className="text-xl font-semibold">Vaani is Ready</h1>
        <p className="text-sm opacity-80">
          Click anywhere to start voice assistant
        </p>
      </div>
    </div>
  );
};

export const AssistantPanel = () => {
  const {
    state,
    messages,
    isAssistantOpen,
    setIsAssistantOpen,
    assistantEnabled, // 🔑 IMPORTANT
  } = useVaani();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, state]);

  const isListening = state === "LISTENING" || state === "AWAKE";
  const isResponding = state === "RESPONDING";
  const isProcessing = state === "PROCESSING";

  return (
    <>
      {/* 🔑 SHOW OVERLAY ONLY UNTIL ENABLED */}
      {!assistantEnabled && <VaaniOverlay />}

      <div
        className={cn(
          "fixed z-50 bg-background/95 backdrop-blur-xl border shadow-2xl transition-all duration-300",
          isAssistantOpen
            ? "top-16 right-0 bottom-0 w-80 md:w-96 rounded-l-2xl"
            : "right-4 bottom-4 w-14 h-14 rounded-full"
        )}
      >
        {!isAssistantOpen && (
          <button
            onClick={() => setIsAssistantOpen(true)}
            className={cn(
              "w-full h-full flex items-center justify-center rounded-full transition-all duration-300 relative shadow-lg",
              isListening && "bg-emerald-500 text-white shadow-emerald-500/40 animate-pulse",
              isResponding && "bg-cyan-500 text-white shadow-cyan-500/40 animate-pulse",
              isProcessing && "bg-amber-500 text-white shadow-amber-500/40",
              !isListening && !isResponding && !isProcessing && "bg-primary text-primary-foreground"
            )}
            title={
              isListening ? "Listening - Your turn to speak!" :
              isResponding ? "Assistant is speaking..." : "Open Assistant Panel"
            }
          >
            <Mic className="w-6 h-6" />
            {isListening && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
            )}
          </button>
        )}

        {isAssistantOpen && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between bg-card/50">
              <span className="text-sm font-semibold gradient-text flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                Vaani Assistant
              </span>
              <button
                onClick={() => setIsAssistantOpen(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Turn-Taking Visual Indicator */}
            <div className="p-2 border-b bg-muted/20">
              <VoiceTurnIndicator compact />
            </div>

            <div
              ref={scrollRef}
              className="flex-1 p-3 space-y-3 overflow-y-auto"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-sm max-w-[88%] shadow-sm transition-all",
                    m.role === "user" &&
                      "ml-auto bg-primary text-primary-foreground rounded-br-none font-medium",
                    m.role === "assistant" && "bg-secondary/80 border border-border/50 rounded-bl-none",
                    m.role === "system" && "mx-auto text-xs italic bg-muted/40 text-muted-foreground text-center rounded-xl"
                  )}
                >
                  {m.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
