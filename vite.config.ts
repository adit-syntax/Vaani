/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 8080,
        hmr: {
            overlay: false,
        },
    },
    plugins: [
        react(),
        mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('@tensorflow') || id.includes('@mediapipe')) {
                            return 'vendor-tfjs-mediapipe';
                        }
                        if (id.includes('firebase')) {
                            return 'vendor-firebase';
                        }
                        if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                            return 'vendor-ui';
                        }
                        if (id.includes('recharts') || id.includes('d3-')) {
                            return 'vendor-charts';
                        }
                        if (id.includes('@google/generative-ai')) {
                            return 'vendor-ai';
                        }
                    }
                },
            },
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
    },
}));
