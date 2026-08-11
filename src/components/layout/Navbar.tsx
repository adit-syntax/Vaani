import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVaani } from '@/contexts/VaaniContext';
import { useGmail } from '@/contexts/GmailContext';
import { useTelegram } from '@/contexts/TelegramContext';
import { Mic, MicOff, User, LogOut, Settings, Bell, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar = () => {
  const { state, isAuthenticated, userName, wakeUp, sleep, setIsAuthenticated, clearMessages, addMessage, speak, performLogout } = useVaani();
  const { unreadCount: gmailUnread } = useGmail();
  const { unreadChats } = useTelegram();
  const navigate = useNavigate();
  const [isTTSActive, setIsTTSActive] = useState(false);

  useEffect(() => {
    const handleTTSState = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.isSpeaking === 'boolean') {
        setIsTTSActive(detail.isSpeaking);
      }
    };

    window.addEventListener('vaani:tts_state', handleTTSState);
    return () => window.removeEventListener('vaani:tts_state', handleTTSState);
  }, []);

  const telegramUnread = unreadChats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
  const totalUnread = gmailUnread + telegramUnread;

  const isResponding = isTTSActive || state === 'RESPONDING';
  const isListening = !isResponding && ['LISTENING', 'AWAKE', 'AUTH_REGISTER', 'AUTH_LOGIN', 'WAITING_FOR_PIN'].includes(state);
  const isProcessing = !isResponding && ['PROCESSING', 'REGISTERING', 'AUTHENTICATING'].includes(state);
  const isDormant = !isResponding && !isListening && !isProcessing && (state === 'DORMANT' || state === 'SLEEPING');

  const handleMicToggle = () => {
    if (state === 'DORMANT') {
      wakeUp();
    } else {
      sleep();
    }
  };

  const handleLogout = async () => {
    speak("Goodbye! See you soon.");
    setTimeout(async () => {
      await performLogout();
      clearMessages();
      addMessage('system', 'Say "Hey Vaani" to wake me up');
    }, 1500);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 glass border-b border-border/50 z-50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg transition-transform group-hover:scale-105">
            <img src="/vaani.svg" alt="Vaani Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-display font-semibold gradient-text hidden sm:block">
            Vaani
          </span>
        </Link>

        {/* Center: Brand Badge / Title */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-card/40 border border-border/30 backdrop-blur-md">
          <span className="text-xs font-medium text-muted-foreground">Voice-First Assistant</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Mic Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMicToggle}
            className={`relative ${state !== 'DORMANT' ? 'text-vaani-listening' : 'text-muted-foreground'}`}
          >
            {state !== 'DORMANT' ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
            {state !== 'DORMANT' && (
              <span className="absolute inset-0 rounded-md border-2 border-vaani-listening animate-pulse-ring" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="w-5 h-5" />
                {totalUnread > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <p className="px-3 py-2 text-sm font-semibold border-b border-border/50">Notifications</p>

              {gmailUnread > 0 && (
                <DropdownMenuItem onClick={() => navigate('/gmail')} className="flex justify-between items-center py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>Unread Emails</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">{gmailUnread}</Badge>
                </DropdownMenuItem>
              )}

              {telegramUnread > 0 && (
                <DropdownMenuItem onClick={() => navigate('/telegram')} className="flex justify-between items-center py-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary" />
                    <span>Unread Messages</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">{telegramUnread}</Badge>
                </DropdownMenuItem>
              )}

              {totalUnread === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>Everything is up to date!</p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="hidden sm:inline text-sm">{userName || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
