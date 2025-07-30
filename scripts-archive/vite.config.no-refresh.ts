import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      fastRefresh: false, // 🔥 DÉSACTIVER FastRefresh pour éviter les reloads
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@contexts': resolve(__dirname, './src/contexts')
    }
  },
  server: {
    port: 3031,
    host: '127.0.0.1',
    strictPort: false,
    
    // 🔥 CONFIGURATION ANTI-REFRESH AGGRESSIVE
    hmr: false, // DÉSACTIVER complètement HMR
    
    // 🔥 SURVEILLANCE FICHIERS ULTRA-RESTRICTIVE
    watch: {
      // Ignorer TOUT ce qui peut causer des reloads
      ignored: [
        '**/node_modules/**',
        '**/dist/**', 
        '**/.git/**',
        '**/coverage/**',
        '**/public/**',
        '**/.vscode/**',
        '**/*.log',
        '**/tmp/**',
        '**/temp/**',
        '**/backup/**',            // 🔥 Ignorer les dossiers backup
        '**/*.backup',             // 🔥 Ignorer les fichiers .backup
        '**/*.backup.*',           // 🔥 Ignorer les fichiers .backup.xxx
        '**/backup-*/**',          // 🔥 Ignorer backup-xxx/
        '**/scripts/**',           // 🔥 Ignorer scripts/
        '**/*.md',                 // 🔥 Ignorer tous les MD
        '**/*.txt',                // 🔥 Ignorer tous les TXT
        '**/fix-*.js',             // 🔥 Ignorer nos scripts de debug
        '**/test-*.js',            // 🔥 Ignorer scripts de test
        '**/setup-*.js',           // 🔥 Ignorer scripts setup
        '**/debug-*.js'            // 🔥 Ignorer scripts debug
      ],
      
      // 🔥 RÉDUIRE LA SENSIBILITÉ AU MAXIMUM
      usePolling: false,
      interval: 5000,     // Vérifier toutes les 5 secondes max
      binaryInterval: 10000, // Binaires toutes les 10 secondes
      ignorePermissionErrors: true
    },
    
    // 🔥 AUTRES OPTIMISATIONS ANTI-REFRESH
    fs: {
      strict: false,
      allow: ['..'] // Permettre l'accès parent pour éviter erreurs
    }
  },
  
  // 🔥 DÉSACTIVER L'OPTIMISATION DES DEPS QUI CAUSE DES RELOADS
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // 🔥 RÉDUIRE LES LOGS AU MINIMUM
  logLevel: 'error', // Seulement les erreurs
  
  // 🔥 DÉSACTIVER LE CLEARING
  clearScreen: false
})
