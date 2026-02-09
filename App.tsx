
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
  const [showLogs, setShowLogs] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleConnection = () => {
    if (status === ConnectionState.CONNECTED || status === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      connect(config);
    }
  };

  const isConnected = status === ConnectionState.CONNECTED;
  const isConnecting = status === ConnectionState.CONNECTING;
  const isError = status === ConnectionState.ERROR;

  if (!mounted) return null;

  return (
    <div className="relative h-screen w-full bg-slate-950 flex flex-col overflow-hidden selection:bg-cyan-500/30 text-slate-200">
      
      {/* HUD Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_70%)] pointer-events-none"></div>
      
      {/* Header */}
      <header className="relative z-20 flex justify-between items-center px-6 py-4 border-b border-slate-800/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]' : isError ? 'bg-red-500' : 'bg-slate-700'}`}></div>
            {isConnected && <div className="absolute -inset-1 border border-cyan-400/50 rounded-full animate-ping"></div>}
          </div>
          <div>
            <h1 className="font-tech text-xl tracking-[0.3em] text-slate-100 uppercase">James</h1>
            <p className="text-[9px] font-mono text-cyan-500/70 tracking-tighter uppercase leading-none">Advanced Tactical Assistant</p>
          </div>
        </div>
        
        {/* Buttons removed as requested (was marked in red) */}
      </header>

      {/* Main Interface */}
      <main className="flex-1 flex flex-col relative z-10 items-center justify-center p-6 pb-20 overflow-hidden">
        
        {/* Decorative corner borders */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500/30 pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500/30 pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500/30 pointer-events-none"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30 pointer-events-none"></div>

        {/* Core Visualization */}
        <div className="relative group w-full max-w-[500px] aspect-square flex items-center justify-center">
          <div className={`absolute inset-0 border border-slate-800/50 rounded-full transition-all duration-1000 ${isConnected ? 'scale-110 opacity-100 border-cyan-500/20' : 'opacity-20'}`}></div>
          <div className={`absolute inset-0 border border-slate-800/30 rounded-full scale-125 transition-all duration-1000 delay-100 ${isConnected ? 'opacity-50' : 'opacity-0'}`}></div>
          
          <div className="relative z-10 w-full h-full p-4">
            <Visualizer analyser={outputAnalyser} isActive={isConnected} accentColor={isError ? '#ef4444' : '#06b6d4'} />
          </div>

          {/* Center Glow */}
          <div className={`absolute w-40 h-40 bg-cyan-500/10 rounded-full blur-[100px] transition-all duration-700 ${isConnected ? 'scale-150 opacity-100' : 'scale-50 opacity-0'}`}></div>
        </div>

        {/* Status Text */}
        <div className="mt-8 flex flex-col items-center gap-1">
          <span className={`font-tech text-sm tracking-[0.2em] uppercase ${isError ? 'text-red-500' : isConnected ? 'text-cyan-400' : 'text-slate-500'}`}>
            {isConnecting ? 'Linking Neural Net...' : isConnected ? 'Uplink Established' : isError ? 'Core Failure' : 'System Hibernating'}
          </span>
          <div className="h-0.5 w-32 bg-slate-800 relative overflow-hidden">
             {(isConnecting || isConnected) && (
               <div className={`absolute h-full ${isConnecting ? 'w-1/2 animate-[shimmer_2s_infinite]' : 'w-full'} bg-cyan-500`}></div>
             )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-12">
          <button
            onClick={handleToggleConnection}
            disabled={isConnecting}
            className={`relative overflow-hidden group px-12 py-4 font-tech text-sm font-bold tracking-[0.2em] transition-all duration-300 rounded-sm
              ${isConnected 
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
              } active:scale-95 disabled:opacity-50`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="relative uppercase">
              {isConnecting ? 'Initializing...' : isConnected ? 'Deactivate' : 'Establish Protocol'}
            </span>
          </button>
        </div>
      </main>

      {/* Terminal Overlay */}
      <div className={`fixed bottom-0 left-0 w-full transition-all duration-500 z-30 ${showLogs ? 'h-1/3 opacity-100' : 'h-0 opacity-0 pointer-events-none'}`}>
        <Logger logs={logs} />
      </div>

      {/* Footer info removed as requested (was marked in red) */}

      {/* Modals - Kept in background to allow configuration if needed through code/other methods, but UI triggers are gone */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        config={config}
        onConfigChange={setConfig}
      />

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default App;
