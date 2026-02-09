import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to avoid TypeScript errors regarding the Process type definition
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Prioritize system environment variable (process.env.API_KEY) if available, otherwise use loaded env
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY)
    }
  };
});