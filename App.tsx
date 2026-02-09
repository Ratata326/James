import React, { useState, useEffect } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import Visualizer from './components/Visualizer';
import { ConnectionState, AIConfig } from './types';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'gemini', 
  apiKey: process.env.API_KEY || '', 
  modelId: 'gemini-2.5-flash-native-audio-preview-12-2025',
  voiceName: 'Fenrir', 
  systemInstruction: "Você é James, um assistente de IA avançado inspirado no Jarvis. Seu tom é calmo, profissional, eficiente e levemente sarcástico. Não use emojis. Fale fluentemente em Português do Brasil. Chame o usuário de 'Senhor' ou 'Chefe'. Ao confirmar comandos, use frases como 'Processando', 'Protocolos iniciados' ou 'Como desejar'.",
};

const App: React.FC = () => {
  const { status, connect, disconnect, outputAnalyser, logs } = useGeminiLive();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleConnection = () => {
    if (status === ConnectionState.CONNECTED || status === ConnectionState.CONNECTING) {
      disconnect();
    } else {
      // Verificação de segurança para a chave de API
      if (!DEFAULT_CONFIG.apiKey && !process.env.API_KEY) {
        alert("ERRO CRÍTICO: Chave de API não encontrada. Adicione API_KEY nas variáveis de ambiente do Vercel.");
        return;
      }
      connect(DEFAULT_CONFIG);
    }
  };

  const isConnected = status === ConnectionState.CONNECTED;
  const isConnecting = status === ConnectionState.CONNECTING;
  const isError = status === ConnectionState.ERROR;

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col overflow-hidden selection:bg-cyan-500/30">
      
      {/* HUD Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>
      
      <header className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-slate-800/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_10px] ${isConnected ? 'bg-cyan-400 shadow-cyan-400' : isError ? 'bg-red-500 shadow-red-500' : 'bg-slate-600'}`}></div>
          <h1 className="font-tech text-2xl tracking-[0.2em] text-slate-100">JAMES</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10 overflow-hidden items-center justify-center">
        <section className="flex flex-col items-center justify-center relative p-6 w-full h-full">
          
          <div className="absolute top-10 text-center flex flex-col items-center gap-2">
             <h2 className={`font-tech tracking-widest text-lg animate-pulse ${isError ? 'text-red-500' : 'text-cyan-400'}`}>
               {isConnecting ? 'INICIALIZANDO...' : isConnected ? 'SISTEMA ONLINE' : isError ? 'FALHA NO SISTEMA' : 'EM ESPERA'}
             </h2>
             {isError && (
               <div className="bg-red-500/10 border border-red-500/20 p-4 rounded mt-4 max-w-md">
                 <p className="text-red-400 text-xs font-mono">
                    Verifique se a variável <strong>API_KEY</strong> foi adicionada nas configurações do Vercel e se você deu permissão ao microfone.
                 </p>
               </div>
             )}
          </div>

          <div className="relative w-full max-w-[450px] aspect-square flex items-center justify-center">
            <div className={`absolute inset-0 border border-slate-800 rounded-full scale-110 transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-20'}`}></div>
            <div className="relative z-10 w-full h-full">
              <Visualizer analyser={outputAnalyser} isActive={isConnected} accentColor={isError ? '#ef4444' : '#22d3ee'} />
            </div>
            <div className={`absolute w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl transition-all duration-500 ${isConnected ? 'scale-150 opacity-100' : 'scale-50 opacity-0'}`}></div>
          </div>
          
          <div className="mt-12 z-20">
            <button
              onClick={handleToggleConnection}
              disabled={isConnecting}
              className={`group relative px-10 py-4 overflow-hidden rounded-sm font-tech font-bold tracking-wider transition-all duration-300
                ${isConnected 
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50' 
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                } disabled:opacity-50`}
            >
              <span className="relative z-10">
                {isConnecting ? 'CONECTANDO...' : isConnected ? 'TERMINAR UPLINK' : 'INICIAR PROTOCOLO'}
              </span>
            </button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 p-4 border-t border-slate-900 bg-slate-950 text-center flex justify-between items-center text-[10px] text-slate-600 font-mono tracking-widest uppercase">
        <div>MODO: LIVE_AUDIO // SIR_IDENTIFIED</div>
        <div className="flex gap-4">
          <span>MIC: {isConnected ? 'ON' : 'OFF'}</span>
          <span>SESS: {status.toUpperCase()}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;