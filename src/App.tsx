// src/App.tsx

import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { VaaniProvider, useVaani } from "@/contexts/VaaniContext";
import { GmailProvider } from "@/contexts/GmailContext";
import { TelegramProvider } from "@/contexts/TelegramContext";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { auth } from "@/lib/firebase/firebase";
import {
  initVoiceRecognition,
  startListening,
  stopListening,
  setVoiceReinitCallback,
} from "@/lib/vaani/voiceStateController";
import { initPlatforms } from "@/lib/platforms/init";
import { bindVoiceLifecycle } from "@/lib/vaani/voiceLifecycle";
import { messagingPlatformService } from "@/services/messagingPlatformService";
// Initialize all platform adapters (Gmail, Telegram, WhatsApp)
initPlatforms();

// Initialize messaging platforms from environment
messagingPlatformService.initialize().then((status) => {
  console.log('[APP] Platform initialization complete:', status);
  if (status.telegram) console.log('[APP] ✅ Telegram ready');
}).catch((err) => {
  console.error('[APP] Platform initialization error:', err);
});

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Gmail from "./pages/Gmail";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Docs from "./pages/Docs";
import { Outlook, WhatsApp } from "./pages/Platforms";
import Telegram from "./pages/Telegram";
import NotFound from "./pages/NotFound";
import GmailOAuth from "./pages/GmailOAuth";

/* ======================================================
   🔍 FIREBASE AUTH DEBUG (SAFE)
   ====================================================== */

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

auth.onAuthStateChanged((user) => {
  console.log("[FIREBASE AUTH]", user ? user.email : "NOT LOGGED IN");
});

const queryClient = new QueryClient();

/* ======================================================
   🎙️ VOICE BOOTSTRAP (SINGLE ENTRY POINT)
   ====================================================== */

const VoiceBootstrap = () => {
  const { state, assistantEnabled, handleIntent } = useVaani();
  const { continuousListening, wakeWordSensitivity } = useSettings();

  const recognitionRef = useRef<any>(null);
  const stateRef = useRef(state);

  // Keep latest state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const init = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("[VOICE] SpeechRecognition not supported");
      return;
    }

    console.log("[VOICE] Creating fresh SpeechRecognition instance...");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognitionRef.current = recognition;

    // Init mic controller
    initVoiceRecognition(recognition);

    // Bind voice → Vaani pipeline
    bindVoiceLifecycle(
      recognition,
      () => stateRef.current,
      handleIntent,
      () => {
        console.log("[VOICE] Reset requested");
      },
      () => wakeWordSensitivity
    );
  };

  useEffect(() => {
    init();
    setVoiceReinitCallback(init);
    console.log("[VOICE] Ready — waiting for user gesture");
  }, []);

  // 🔄 React to Continuous Listening Setting
  useEffect(() => {
    if (assistantEnabled) {
      if (continuousListening) {
        console.log("[VOICE] Continuous listening enabled — starting mic");
        startListening();
      } else {
        console.log("[VOICE] Continuous listening disabled — stopping mic");
        stopListening();
      }
    }
  }, [continuousListening, assistantEnabled]);

  return null;
};

/* ======================================================
   🚀 APP ROOT
   ====================================================== */
const RouteDebugger = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("[ROUTE DEBUG] Current path:", location.pathname);
  }, [location.pathname]);

  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <BrowserRouter>

            {/* 🔐 Gmail must wrap Vaani */}
            <TelegramProvider>
              <GmailProvider>
                <VaaniProvider>
                  {/* 🎙️ VOICE SYSTEM (GLOBAL, ONCE) */}
                  <VoiceBootstrap />
                  {/* 🌐 ROUTER */}
                  <Routes>
                    {/* Public */}
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    {/* Core */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

{/* Platforms */}
<Route path="/gmail-oauth" element={<ProtectedRoute><GmailOAuth /></ProtectedRoute>} />
<Route path="/gmail" element={<ProtectedRoute><Gmail /></ProtectedRoute>} />
<Route path="/outlook" element={<ProtectedRoute><Outlook /></ProtectedRoute>} />
<Route path="/telegram" element={<ProtectedRoute><Telegram /></ProtectedRoute>} />
<Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />

{/* User */}
<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
<Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
<Route path="/docs" element={<Docs />} />

{/* Fallback */}
<Route path="*" element={<NotFound />} />
                  </Routes>
                  {/* 🔔 GLOBAL UI */}
                  <Toaster />
                  <Sonner />
                </VaaniProvider>
              </GmailProvider>
            </TelegramProvider>

          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};


export default App;
