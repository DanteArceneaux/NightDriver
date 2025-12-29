import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { splitVendorChunkPlugin } from 'vite';

// Bundle optimization configuration
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-leaflet'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          'map-vendor': ['leaflet'],
          'state-vendor': ['zustand'],
          'socket-vendor': ['socket.io-client'],
        },
        
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Enable chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Generate sourcemaps for production debugging
    sourcemap: true,
  },
  
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-leaflet',
      'leaflet',
      'framer-motion',
      'lucide-react',
      'zustand',
      'socket.io-client',
    ],
    
    // Exclude heavy dependencies from pre-bundling
    exclude: ['canvas-confetti'],
  },
});






