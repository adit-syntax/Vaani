// src/pages/Index.tsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVaani } from "@/contexts/VaaniContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Mic,
  Shield,
  Fingerprint,
  Sparkles,
  ArrowRight,
  Mail,
  MessageSquare,
  Zap,
  Lock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  HelpCircle,
  ChevronDown,
  Volume2,
  CheckCircle2,
  Cpu,
  Layers,
  Key,
  Radio,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { startListening } from "@/lib/vaani/voiceStateController";
import { warmUpTTS, speakText } from "@/services/ttsService";
import { playAudioChime } from "@/services/audioSoundService";

/* ================= CAROUSEL SLIDES ================= */

const carouselSlides = [
  {
    id: "voice-engine",
    title: "Voice-First Command Engine",
    subtitle: "Zero Typing Needed",
    description: "Speak in natural conversational English. Vaani parses complex intents, extracts recipient names, sanitizes private data, and executes tasks silently.",
    icon: Mic,
    color: "from-blue-500/20 via-cyan-500/10 to-indigo-500/20",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    stats: [
      { label: "Speech Accuracy", value: "99.4%" },
      { label: "Intent Latency", value: "<150ms" },
    ],
    samplePhrase: '"Hey Vaani, read unread Gmail messages from Alex and summarize them."',
  },
  {
    id: "biometrics",
    title: "Face & Voice Biometric 2FA",
    subtitle: "Zero-Knowledge Authentication",
    description: "Multi-factor hands-free security combining real-time liveness camera detection with 4-digit bcrypt-hashed voice PIN confirmation.",
    icon: Fingerprint,
    color: "from-emerald-500/20 via-teal-500/10 to-green-500/20",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    stats: [
      { label: "Liveness Check", value: "Real-time" },
      { label: "PIN Encryption", value: "Bcrypt 10 rounds" },
    ],
    samplePhrase: '"I want to login with face and PIN 1 2 3 4."',
  },
  {
    id: "ai-mail",
    title: "AI Email Summarizer & Compose",
    subtitle: "Privacy-Preserving Intelligence",
    description: "Automatically mask emails, phone numbers, and SSNs before sending drafts to Gemini. Get brief audio summaries spoken straight to your ear.",
    icon: Mail,
    color: "from-red-500/20 via-orange-500/10 to-amber-500/20",
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
    stats: [
      { label: "Privacy Masking", value: "Automatic" },
      { label: "OAuth Integration", value: "Gmail API" },
    ],
    samplePhrase: '"Compose an email to Sarah asking for project update."',
  },
  {
    id: "messaging",
    title: "Telegram & WhatsApp Messaging",
    subtitle: "Cross-Platform Orchestration",
    description: "Connect Telegram bots and WebSockets to listen to incoming chat messages and reply using voice intent routing.",
    icon: Globe,
    color: "from-sky-500/20 via-blue-500/10 to-cyan-500/20",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    stats: [
      { label: "Platform Adapters", value: "Telegram / Gmail / WhatsApp" },
      { label: "Sync Engine", value: "WebSockets" },
    ],
    samplePhrase: '"Reply to Telegram message from Sarah saying I am on my way."',
  },
  {
    id: "edge-privacy",
    title: "Local Device Privacy Anchor",
    subtitle: "Built with Privacy-First Ethos",
    description: "Your camera stream and voice recordings are processed locally in your browser context. No raw biometric video is ever uploaded.",
    icon: Shield,
    color: "from-purple-500/20 via-violet-500/10 to-fuchsia-500/20",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    stats: [
      { label: "Cloud Storage", value: "Zero Biometrics" },
      { label: "Session Security", value: "Strict Isolation" },
    ],
    samplePhrase: '"Show my security & privacy settings."',
  },
];

/* ================= FAQ ITEMS ================= */

const faqItems = [
  {
    question: "How does Vaani know when it's my turn to speak?",
    answer: "Vaani uses state-aware turn-taking indicators. When Vaani finishes speaking, a dual-tone audio chime ('DING-DONG') plays and a green visual status ('🟢 YOUR TURN — SPEAK NOW') displays while the microphone actively listens.",
  },
  {
    question: "Is my face or voice data uploaded to cloud servers?",
    answer: "No. Facial liveness checks and voice PIN comparisons run inside your local browser instance. Only anonymized intent parameters are processed to execute email or messaging commands.",
  },
  {
    question: "What platforms are currently supported?",
    answer: "Vaani currently integrates with Gmail (OAuth2), Telegram (Bot API & WebSockets), WhatsApp Web API, and Outlook. More integrations are added regularly.",
  },
  {
    question: "Can I use Vaani without touching my keyboard?",
    answer: "Yes! Vaani is built from the ground up to be 100% voice-first. Registration, Login, Mail reading, drafting, sending, and logout can all be done purely using voice commands.",
  },
];

/* ================= MAIN INDEX COMPONENT ================= */

const Index = () => {
  const navigate = useNavigate();
  const { wakeUp, speak, addMessage } = useVaani();

  // Carousel State
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Demo Overlay Modal State
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoCommand, setDemoCommand] = useState("");
  const [demoResponse, setDemoResponse] = useState("Click a command below or type to simulate Vaani.");
  const [isSimulatingSpeech, setIsSimulatingSpeech] = useState(false);

  // Drawer Sheet State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // FAQ Open State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Auto-rotate carousel
  useEffect(() => {
    if (isAutoplay) {
      autoplayRef.current = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
      }, 5000);
    }
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isAutoplay]);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const unlockVoice = () => {
    warmUpTTS();
    startListening();
    wakeUp();
  };

  const handleVoiceLogin = () => {
    unlockVoice();
    addMessage("user", "I want to login");
    setTimeout(() => {
      speak("Let's get you logged in. Please look at your camera for face recognition.");
      navigate("/login");
    }, 500);
  };

  const handleVoiceRegister = () => {
    unlockVoice();
    addMessage("user", "I want to register");
    setTimeout(() => {
      speak("Great! Let's create your account. I'll guide you through each step.");
      navigate("/register");
    }, 500);
  };

  // Run interactive demo phrase
  const runDemoPhrase = (phrase: string, response: string) => {
    playAudioChime("speech_heard");
    setDemoCommand(phrase);
    setIsSimulatingSpeech(true);
    setDemoResponse("Vaani processing intent...");

    setTimeout(() => {
      setDemoResponse(response);
      setIsSimulatingSpeech(false);
      speakText(response, { cancelPrevious: true });
    }, 900);
  };

  return (
    <Layout fullWidth>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
        
        {/* ================= HERO SECTION ================= */}
        <section className="relative py-20 lg:py-32 px-4 lg:px-8 overflow-hidden bg-hero-pattern">
          {/* Background glowing ambient light */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-12">
              {/* Badge Header */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/25 mb-8 shadow-inner backdrop-blur-md animate-fade-in">
                <Zap className="w-4 h-4 text-primary animate-bounce" />
                <span className="text-sm font-semibold text-primary tracking-wide">
                  Voice-First Communication Platform
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight mb-6 animate-slide-up">
                Meet <span className="gradient-text text-glow">Vaani</span>
                <br />
                Hands-Free Digital Assistant
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
                Manage Gmail threads, reply to Telegram chats, and verify your biometric identity completely hands-free. Just say <span className="text-primary font-bold">"Hey Vaani"</span> to get started.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <Button
                  size="lg"
                  onClick={handleVoiceLogin}
                  className="text-base px-8 py-6 rounded-2xl glow-primary shadow-xl font-semibold transition-all hover:scale-105"
                >
                  <Mic className="w-5 h-5 mr-2 animate-pulse" />
                  Voice Login
                </Button>
                
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleVoiceRegister}
                  className="text-base px-8 py-6 rounded-2xl border border-border/60 hover:bg-accent/40 font-semibold transition-all hover:scale-105"
                >
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsDemoOpen(true)}
                  className="text-base px-6 py-6 rounded-2xl border-primary/40 bg-card/40 hover:bg-primary/10 text-primary font-semibold transition-all backdrop-blur-md"
                >
                  <Sparkles className="w-5 h-5 mr-2 text-primary" />
                  Try Live Demo
                </Button>
              </div>
            </div>

            {/* Visual Hero Card Simulator */}
            <div className="relative max-w-4xl mx-auto mt-12 group">
              <div className="aspect-video md:aspect-[21/9] rounded-3xl bg-card/60 border border-border/60 backdrop-blur-2xl overflow-hidden shadow-2xl p-6 flex flex-col justify-between transition-all group-hover:border-primary/40">
                
                {/* Header bar inside simulator */}
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="text-xs text-muted-foreground font-mono ml-2">vaani.ai // voice-session</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    🟢 Voice Active
                  </div>
                </div>

                {/* Orb & Audio Wave Visualizer */}
                <div className="flex flex-col items-center justify-center my-6">
                  <div className="relative flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                      <Mic className="w-10 h-10 text-white" />
                    </div>
                    {/* Ring waves */}
                    <div className="absolute inset-0 -m-4 rounded-full border border-primary/40 animate-ping opacity-75" />
                    <div className="absolute inset-0 -m-8 rounded-full border border-cyan-400/30 animate-ping" style={{ animationDelay: "0.5s" }} />
                  </div>

                  <div className="flex items-center gap-1.5 mt-6">
                    {[40, 70, 30, 90, 50, 80, 40, 60, 100, 40, 70, 30].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-primary/80 rounded-full animate-pulse"
                        style={{ height: `${h * 0.4}px`, animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Live Transcript Preview */}
                <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between gap-4">
                  <p className="text-sm text-foreground/90 font-medium">
                    <span className="text-primary font-bold">Hearing: </span>
                    "Hey Vaani, check my unread emails and summarize them."
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10 whitespace-nowrap"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                    Voice Docs
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= INTERACTIVE FEATURE CAROUSEL ================= */}
        <section className="py-20 px-4 lg:px-8 border-t border-border/40 bg-card/20 relative">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Interactive Feature Showcase
                </Badge>
                <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight">
                  Explore Vaani Capabilities
                </h2>
              </div>

              {/* Carousel Controls */}
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setIsAutoplay(!isAutoplay)}
                  className="rounded-full border-border/60 hover:bg-accent"
                  title={isAutoplay ? "Pause Autoplay" : "Start Autoplay"}
                >
                  {isAutoplay ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-muted-foreground" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handlePrevSlide}
                  className="rounded-full border-border/60 hover:bg-accent"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleNextSlide}
                  className="rounded-full border-border/60 hover:bg-accent"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Active Slide Card */}
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br transition-all duration-500 shadow-2xl p-8 lg:p-12 min-h-[380px] flex flex-col justify-between"
              style={{
                backgroundImage: `radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 60%)`,
              }}
            >
              {carouselSlides.map((slide, index) => {
                if (index !== activeSlide) return null;
                const IconComponent = slide.icon;

                return (
                  <div key={slide.id} className="animate-fade-in flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${slide.badgeColor}`}>
                          {slide.subtitle}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          Slide {index + 1} of {carouselSlides.length}
                        </span>
                      </div>

                      <h3 className="text-3xl lg:text-4xl font-display font-bold mb-4 flex items-center gap-3">
                        <IconComponent className="w-8 h-8 text-primary" />
                        {slide.title}
                      </h3>

                      <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
                        {slide.description}
                      </p>

                      {/* Sample Command */}
                      <div className="p-4 rounded-xl bg-card/60 border border-border/40 backdrop-blur-md mb-6">
                        <span className="text-xs font-semibold text-primary block mb-1">Example Voice Command:</span>
                        <p className="text-sm font-mono text-foreground italic">{slide.samplePhrase}</p>
                      </div>

                      {/* Slide Stats */}
                      <div className="flex items-center gap-6">
                        {slide.stats.map((stat) => (
                          <div key={stat.label}>
                            <p className="text-xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Visual Graphic */}
                    <div className="w-full lg:w-72 h-64 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 flex flex-col items-center justify-center p-6 text-center shadow-xl relative overflow-hidden group">
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-10 h-10 text-primary" />
                      </div>
                      <p className="text-sm font-bold text-foreground">{slide.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Voice-Native Module</p>
                    </div>
                  </div>
                );
              })}

              {/* Indicator Dots */}
              <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border/40">
                {carouselSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === activeSlide ? "w-8 bg-primary" : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= PLATFORMS SHOWCASE ================= */}
        <section className="py-20 px-4 lg:px-8 border-t border-border/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
                <Layers className="w-3.5 h-3.5 mr-1.5" />
                Supported Integrations
              </Badge>
              <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4">
                Unified Communication Hub
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Read emails out loud, compose Telegram replies, and verify security status without opening multiple apps.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Gmail", icon: Mail, color: "from-red-500 to-orange-500", desc: "Read, summarize & compose emails with AI privacy masking.", path: "/gmail" },
                { name: "Telegram", icon: Globe, color: "from-sky-400 to-blue-500", desc: "Listen to chat messages & reply using WebSocket sync.", path: "/telegram" },
                { name: "WhatsApp", icon: Lock, color: "from-emerald-500 to-green-500", desc: "Voice-driven message queueing & notification readout.", path: "/whatsapp" },
                { name: "Outlook", icon: MessageSquare, color: "from-blue-500 to-cyan-500", desc: "Corporate mail integration with instant voice actions.", path: "/outlook" },
              ].map((platform) => (
                <Card
                  key={platform.name}
                  onClick={() => navigate(platform.path)}
                  className="bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:-translate-y-1 shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                      <platform.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 flex items-center justify-between">
                      {platform.name}
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{platform.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ================= FAQ ACCORDION ================= */}
        <section className="py-20 px-4 lg:px-8 border-t border-border/40 bg-card/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
                <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                Frequently Asked Questions
              </Badge>
              <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">
                Everything You Need to Know
              </h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="border border-border/60 rounded-2xl bg-card/60 backdrop-blur-md overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-base md:text-lg hover:text-primary transition-colors"
                    >
                      <span>{item.question}</span>
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 text-muted-foreground ${isOpen ? "rotate-180 text-primary" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 text-muted-foreground text-sm leading-relaxed border-t border-border/40 pt-4 animate-fade-in">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= CTA FOOTER ================= */}
        <section className="py-20 px-4 lg:px-8 border-t border-border/40 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-6">
              Ready to Experience Hands-Free Computing?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join Vaani today to manage your digital communication effortlessly with full voice guidance and biometrics.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={handleVoiceRegister}
                className="text-base px-8 py-6 rounded-2xl glow-primary shadow-xl font-semibold hover:scale-105 transition-all"
              >
                Get Started for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsDrawerOpen(true)}
                className="text-base px-8 py-6 rounded-2xl border-border/60 hover:bg-accent font-semibold"
              >
                View Voice Cheat Sheet
              </Button>
            </div>
          </div>
        </section>

        {/* ================= INTERACTIVE DEMO OVERLAY (DIALOG) ================= */}
        <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
          <DialogContent className="sm:max-w-xl bg-card/95 border-border/80 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Interactive Vaani Simulator
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Click any phrase below to test how Vaani responds in real-time.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              {/* Simulated Audio Box */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>INPUT: {demoCommand || "Awaiting command..."}</span>
                  {isSimulatingSpeech && <span className="text-primary animate-pulse">PROCESSING...</span>}
                </div>

                <div className="p-3 rounded-xl bg-background/80 border border-border/40 text-sm font-medium text-foreground min-h-[60px] flex items-center">
                  {demoResponse}
                </div>
              </div>

              {/* Sample Trigger Chips */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Select a test command:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runDemoPhrase("Check Gmail", "You have 3 unread emails. 1 important message from Alex.")}
                    className="justify-start text-xs rounded-xl"
                  >
                    <Mail className="w-3.5 h-3.5 mr-2 text-red-400" />
                    "Check Gmail"
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runDemoPhrase("Login with face", "Opening face detection window. Please look at the camera.")}
                    className="justify-start text-xs rounded-xl"
                  >
                    <Fingerprint className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                    "Login with face"
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runDemoPhrase("Read Telegram message", "Sarah says: Are you coming to the meeting at 4 PM?")}
                    className="justify-start text-xs rounded-xl"
                  >
                    <Globe className="w-3.5 h-3.5 mr-2 text-sky-400" />
                    "Read Telegram message"
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runDemoPhrase("Register new user", "Starting registration. Please say your email address.")}
                    className="justify-start text-xs rounded-xl"
                  >
                    <Zap className="w-3.5 h-3.5 mr-2 text-amber-400" />
                    "Register new user"
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsDemoOpen(false)} className="rounded-xl">
                Close Simulator
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================= CAPABILITIES DRAWER (SHEET) ================= */}
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md bg-card/95 border-border/80 backdrop-blur-2xl p-6 overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-6 h-6 text-primary" />
                Voice Command Reference
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Complete list of voice triggers supported across all screens.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              {/* Category 1: Navigation & System */}
              <div>
                <h4 className="text-xs font-bold uppercase text-primary tracking-wider mb-3 flex items-center gap-1.5">
                  <Mic className="w-4 h-4" /> System & Navigation
                </h4>
                <div className="space-y-2">
                  {[
                    { cmd: '"Hey Vaani"', desc: 'Wakes up assistant from dormant state' },
                    { cmd: '"I want to login"', desc: 'Triggers face recognition login flow' },
                    { cmd: '"I want to register"', desc: 'Starts voice-guided 5-step registration' },
                    { cmd: '"Log me out"', desc: 'Destroys active session & returns home' },
                  ].map((c) => (
                    <div key={c.cmd} className="p-3 rounded-xl bg-muted/40 border border-border/40">
                      <p className="text-xs font-mono font-bold text-foreground">{c.cmd}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 2: Mail & Messaging */}
              <div>
                <h4 className="text-xs font-bold uppercase text-primary tracking-wider mb-3 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> Gmail & Telegram Commands
                </h4>
                <div className="space-y-2">
                  {[
                    { cmd: '"Read unread emails"', desc: 'Fetches inbox & speaks summaries' },
                    { cmd: '"Compose email to Sarah"', desc: 'Opens voice draft composer' },
                    { cmd: '"Read Telegram from John"', desc: 'Fetches recent Telegram chat' },
                    { cmd: '"Reply saying I will arrive soon"', desc: 'Sends message reply' },
                  ].map((c) => (
                    <div key={c.cmd} className="p-3 rounded-xl bg-muted/40 border border-border/40">
                      <p className="text-xs font-mono font-bold text-foreground">{c.cmd}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Banner */}
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground">Privacy Guaranteed: </span>
                  All biometrics remain strictly client-side. Voice commands are parsed using locally isolated regex & intent engines.
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

      </div>
    </Layout>
  );
};

export default Index;
