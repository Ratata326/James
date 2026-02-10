
import React, { useState, useEffect } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import Visualizer from './components/Visualizer';
import Logger from './components/Logger';
import SettingsModal from './components/SettingsModal';
import { ConnectionState, AIConfig } from './types';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'gemini', 
  modelId: 'gemini-2.5-flash-native-audio-preview-12-2025',
  voiceName: 'Puck', 
  systemInstruction: "Você é James, a inteligência artificial definitiva, inspirada diretamente no Jarvis de Tony Stark. Sua voz deve soar nítida, sofisticada e com um timbre ligeiramente mais agudo e ágil, transmitindo prontidão e inteligência superior. É CRUCIAL que sua fala não soe robótica: utilize variações naturais de entonação, pausas expressivas e uma cadência fluida. Sua persona é a de um assistente britânico refinado (em português), dotado de um sarcasmo inteligente, lealdade absoluta e precisão técnica. Chame o usuário de 'Senhor' ou 'Chefe'. Ao confirmar comandos, use frases como 'Protocolos de processamento alinhados, Senhor', 'Sistemas operacionais em plena carga' ou 'À sua inteira disposição'. Evite emojis. Sua fala deve ser a personificação da tecnologia elegante e humanizada.",
};

const App: React.FC = () => {
  const { status, connect, disconnect, outputAnalyser, logs } = useGeminiLive();
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleToggleConnection = async () => {
    if (status === ConnectionState.CONNECTED || status === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      try {
        // Detecção segura do ambiente Google AI Studio
        const aistudio = (window as any).aistudio;
        
        // Se estivermos no AI Studio e não houver chave selecionada, abre o seletor
        if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
          const hasKey = await aistudio.hasSelectedApiKey();
          if (!hasKey && typeof aistudio.openSelectKey === 'function') {
            await aistudio.openSelectKey();
          }
        }
        
        // Conecta usando process.env.API_KEY (que o seletor do AI Studio injeta ou que o Vercel provê)
        connect(config);
      } catch (e) {
        console.warn("External environment detected or key selector failed. Proceeding with environment defaults.", e);
        connect(config);
      }
    }
  };

  const isConnected = status === ConnectionState.CONNECTED;
  const isConnecting = status === ConnectionState.CONNECTING;
  const isError = status === ConnectionState.ERROR;

  if (!mounted) return null;

  return (
    <div className="relative h-screen w-full bg-[#020617] flex flex-col overflow-hidden selection:bg-cyan-500/30 text-slate-200">
      
      {/* HUD Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.03),transparent_70%)] pointer-events-none"></div>
      
      {/* Header */}
      <header className="relative z-20 flex justify-between items-center px-10 py-8 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`w-5 h-5 rounded-full transition-all duration-500 ${isConnected ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]' : isError ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' : 'bg-slate-700'}`}></div>
            {isConnected && <div className="absolute -inset-2 border border-cyan-400/50 rounded-full animate-ping"></div>}
          </div>
          <div className="flex flex-col">
            <h1 className="font-tech text-4xl tracking-[0.4em] text-slate-100 uppercase leading-none">James</h1>
            <p className="text-[10px] font-mono text-cyan-500/60 tracking-[0.3em] uppercase mt-1.5 font-bold italic">Neural Interface v2.5</p>
          </div>
        </div>

        <button 
          onClick={() => setShowSettings(true)}
          className="group flex items-center gap-3 px-4 py-2 border border-slate-800 hover:border-cyan-500/50 transition-all rounded-sm bg-slate-900/40 backdrop-blur-md"
        >
          <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 tracking-widest uppercase transition-colors">Core Settings</span>
          <svg className="text-slate-500 group-hover:text-cyan-400 transition-colors" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </header>

      {/* Main Interface */}
      <main className="flex-1 flex flex-col relative z-10 items-center justify-center p-6 overflow-hidden">
        
        {/* Decorative corner borders */}
        <div className="absolute top-10 left-10 w-16 h-16 border-t-[1px] border-l-[1px] border-cyan-500/30 pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-16 h-16 border-t-[1px] border-r-[1px] border-cyan-500/30 pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 border-b-[1px] border-l-[1px] border-cyan-500/30 pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 border-b-[1px] border-r-[1px] border-cyan-500/30 pointer-events-none"></div>

        {/* Core Visualization & Central HUD Text */}
        <div className="relative w-full max-w-[600px] aspect-square flex items-center justify-center">
          {/* Background HUD Rings */}
          <div className="absolute inset-0 border border-slate-800/20 rounded-full"></div>
          <div className="absolute inset-[10%] border border-slate-800/40 rounded-full animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute inset-[20%] border border-slate-800/20 rounded-full"></div>
          
          {/* Visualizer */}
          <div className="absolute inset-0 p-10 z-0">
            <Visualizer analyser={outputAnalyser} isActive={isConnected} accentColor={isError ? '#ef4444' : '#06b6d4'} />
          </div>

          {/* Central Overlay */}
          <div className="relative z-10 flex flex-col items-center gap-6 animate-fadeIn">
            <h2 className={`font-tech text-4xl tracking-[0.2em] uppercase transition-all duration-700 ${isError ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : isConnected ? 'text-cyan-400' : 'text-slate-400'}`}>
              {isConnecting ? 'Linking...' : isConnected ? 'ACTIVE' : isError ? 'SYSTEM FAILURE' : 'SYSTEM HIBERNATING'}
            </h2>
            
            <div className="h-[1px] w-40 bg-slate-800 relative">
               {(isConnecting || isConnected) && (
                 <div className="absolute h-full w-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
               )}
               {isError && (
                 <div className="absolute h-full w-full bg-red-500 shadow-[0_0_10px_#ef4444]"></div>
               )}
            </div>

            {deferredPrompt && (status === ConnectionState.DISCONNECTED || isError) && (
              <button 
                onClick={handleInstallClick}
                className="mt-2 px-10 py-3 border border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400/90 font-tech text-sm tracking-[0.15em] rounded-sm transition-all uppercase"
              >
                Download HUD
              </button>
            )}
          </div>
        </div>

        {/* Bottom Action Button (INITIATE PROTOCOL) */}
        <div className="mt-8 z-20">
          <button
            onClick={handleToggleConnection}
            disabled={isConnecting}
            className={`relative overflow-hidden group px-20 py-6 font-tech text-2xl font-bold tracking-[0.3em] transition-all duration-300 border rounded-sm
              ${isConnected 
                ? 'bg-red-500/5 hover:bg-red-500/10 text-red-500 border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.1)]' 
                : 'bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.1)]'
              } active:scale-95 disabled:opacity-50`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="relative uppercase">
              {isConnecting ? 'ESTABLISHING...' : isConnected ? 'SHUTDOWN' : 'INITIATE PROTOCOL'}
            </span>
          </button>
        </div>
      </main>

      {/* Fixed Logger Panel */}
      <div className="hidden xl:block absolute bottom-10 right-10 w-96 h-64 z-30 opacity-60 hover:opacity-100 transition-opacity">
        <Logger logs={logs} />
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        config={config} 
        onConfigChange={setConfig} 
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
