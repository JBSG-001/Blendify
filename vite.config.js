import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Use relative base path so assets resolve correctly on GitHub Pages, Vercel, Netlify, or subpaths
  base: './',
  server: {
    port: 5173,
    host: true,
    allowedHosts: true
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        createCourse: resolve(__dirname, 'create-course.html'),
        login: resolve(__dirname, 'login.html'),
        notFound: resolve(__dirname, '404.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/sql.js')) {
            return 'vendor-sql';
          }
        }
      }
    }
  }
});
