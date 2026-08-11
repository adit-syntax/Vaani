import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVaani } from "@/contexts/VaaniContext";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { AssistantPanel } from "./AssistantPanel";
import { FloatingVoiceBar } from "@/components/voice/VoiceTurnIndicator";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export const Layout = ({ children, fullWidth = false }: LayoutProps) => {
  const navigate = useNavigate();
  const { routeIntent, setRouteIntent } = useVaani();

  useEffect(() => {
    if (routeIntent) {
      navigate(routeIntent);
      setRouteIntent(null);
    }
  }, [routeIntent, navigate, setRouteIntent]);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />

      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          "ml-16 lg:ml-64",
          fullWidth && "mr-0"
        )}
      >
        {children}
      </main>

      {/* Floating Voice Turn Indicator & Assistant */}
      <FloatingVoiceBar />
      <AssistantPanel />
    </div>
  );
};
