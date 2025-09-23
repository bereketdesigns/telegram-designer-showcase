import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite'; // NEW: Import tailwindcss directly as a Vite plugin

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    // OLD: tailwind(), // REMOVED: No longer added as an Astro integration this way
  ],
  // NEW: Tailwind CSS is now configured via Vite plugins
  vite: {
    plugins: [tailwindcss()],
  },
  // For a client-side Telegram Mini App, 'static' output is generally sufficient.
  // Astro will often intelligently pick the best output for Vercel anyway.
  // If you explicitly want a static build:
  // output: 'static',
});