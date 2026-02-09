import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Fix: Property 'cwd' does not exist on type 'Process'. 
  // Using '.' points to the current working directory where the config and .env files are located.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || '')
    },
    build: {
      target: 'esnext'
    }
  };
});
