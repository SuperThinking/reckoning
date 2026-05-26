import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set base to './' so the built site works from any path (GH Pages, Netlify, file://, etc.)
  base: './',
});
