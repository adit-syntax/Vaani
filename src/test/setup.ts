import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock HTMLMediaElement play/pause
window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = vi.fn();

// Mock Web Speech API
const MockSpeechRecognition = vi.fn().mockImplementation(() => ({
  continuous: false,
  interimResults: false,
  lang: "en-US",
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onresult: null,
  onerror: null,
  onend: null,
}));

Object.defineProperty(window, "SpeechRecognition", {
  writable: true,
  value: MockSpeechRecognition,
});

Object.defineProperty(window, "webkitSpeechRecognition", {
  writable: true,
  value: MockSpeechRecognition,
});

Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockReturnValue([]),
  },
});

