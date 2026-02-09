import React, { useState, useEffect } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import Visualizer from './components/Visualizer';
import { ConnectionState, AIConfig } from './types';

// Default Configuration - Fixed and Secure
const DEFAULT_CONFIG: AIConfig = {
  // STRICTLY ENFORCING GEMINI PROVIDER FOR HIGH QUALITY VOICE
  provider: 'gemini', 
  // SECURITY: Key loaded from Environment Variables
  apiKey: process.env.API_KEY || '', 
  // Using gemini-2.0-flash-exp as it is currently the most stable model for Live API interactions
  modelId: 'gemini-2.0-flash-exp',
  // 'Fenrir' is the deep, authoritative voice closest to Jarvis
  voiceName: 'Fenrir', 
  systemInstruction: "You are James, an advanced AI assistant inspired by Jarvis from Iron Man. Your voice is Fenrir. Your tone is calm, professional, slightly dry, and extremely efficient. You do not use emojis. You speak fluently in Portuguese (Brazil) and English. If the user speaks Portuguese, reply in Portuguese. If English, reply in English. Keep responses concise and to the point. Address the user as 'Sir' or 'Boss' occasionally. When acknowledging commands, use phrases like 'Processing', 'Protocols initiated', or 'As you wish'.",
};

const App: React.FC = () => {
  const { status, connect, disconnect, outputAnalyser } = useGeminiLive();
  const [mounted, setMounted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  useEffect(() => {
    setMounted(true);

    // Listen for the 'beforeinstallprompt' event to enable native Android installation
    const handleInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const handleToggleConnection = () => {
    if (status === ConnectionState.CONNECTED || status === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      // Always connect using the fixed configuration
      connect(DEFAULT_CONFIG);
    }
  };

  const handleInstallClick = () => {
    if (!installPrompt) return;
    // Show the install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  const isConnected = status === ConnectionState.CONNECTED;
  const isConnecting = status === ConnectionState.CONNECTING;
  const isError = status === ConnectionState.ERROR;

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col overflow-hidden selection:bg-cyan-500/30">
      
      {/* Background Grids/Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>
      
      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-slate-800/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_10px] ${isConnected ? 'bg-cyan-400 shadow-cyan-400' : isError ? 'bg-red-500 shadow-red-500' : 'bg-slate-600'}`}></div>
          <h1 className="font-tech text-2xl tracking-[0.2em] text-slate-100">
            JAMES
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
            {/* Install Button - Only appears on Android/Chrome when installable */}
            {installPrompt && (
              <button 
                onClick={handleInstallClick}
                className="hidden md:block px-4 py-1 border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 text-xs font-tech tracking-widest hover:bg-cyan-500/20 transition-all animate-pulse"
              >
                DEPLOY SYSTEM
              </button>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden items-center justify-center">
        
        {/* Visualizer & Core */}
        <section className="flex flex-col items-center justify-center relative p-6 w-full h-full">
          
          {/* Status Text Overlay */}
          <div className="absolute top-10 text-center flex flex-col items-center gap-2">
             <h2 className="text-cyan-400 font-tech tracking-widest text-lg animate-pulse">
               {isConnecting ? 'INITIALIZING LINK...' : isConnected ? 'ONLINE' : isError ? 'SYSTEM FAILURE' : 'STANDBY'}
             </h2>
             {isConnected && <p className="text-slate-500 text-xs font-mono mt-1">LISTENING ON SECURE CHANNEL</p>}
             
             {/* Mobile Install Button */}
             {installPrompt && (
               <button 
                  onClick={handleInstallClick}
                  className="md:hidden mt-2 px-6 py-2 border border-cyan-500/50 bg-cyan-900/40 text-cyan-400 text-xs font-tech tracking-widest hover:bg-cyan-500/20 transition-all"
                >
                  Download Application
                </button>
             )}
          </div>

          {/* The Visualizer Core */}
          <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
            {/* Decorative concentric rings */}
            <div className={`absolute inset-0 border border-slate-800 rounded-full scale-110 transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-20'}`}></div>
            <div className={`absolute inset-0 border border-slate-800/50 rounded-full scale-125 transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-10'}`}></div>
            
            {/* Canvas Visualizer */}
            <div className="relative z-10 w-full h-full">
              <Visualizer analyser={outputAnalyser} isActive={isConnected} />
            </div>

            {/* Central Hologram Effect */}
            <div className={`absolute w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl transition-all duration-500 ${isConnected ? 'scale-150 opacity-100' : 'scale-50 opacity-0'}`}></div>
          </div>
          
          {/* Controls */}
          <div className="mt-8 z-20">
            <button
              onClick={handleToggleConnection}
              disabled={isConnecting}
              className={`group relative px-8 py-3 overflow-hidden rounded-sm font-tech font-bold tracking-wider transition-all duration-300
                ${isConnected 
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50' 
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="relative z-10">
                {isConnecting ? 'ESTABLISHING...' : isConnected ? 'TERMINATE UPLINK' : 'INITIATE PROTOCOL'}
              </span>
              {/* Button Glitch Effect */}
              <div className="absolute inset-0 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-cyan-500/10 to-transparent"></div>
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 border-t border-slate-900 bg-slate-950 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-xs text-slate-600 font-mono">
        <div>
           SECURE CONNECTION // PROTOCOL {DEFAULT_CONFIG.provider.toUpperCase()} // MODEL: {DEFAULT_CONFIG.modelId.split('-')[1] || 'UNKNOWN'}
        </div>
        <div className="mt-2 md:mt-0 flex gap-4">
          <span>MIC: {isConnected ? 'ACTIVE' : 'OFF'}</span>
          <span>AUDIO: {isConnected ? 'ACTIVE' : 'OFF'}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;