
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, LogEntry, AIConfig } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audioUtils';

const SAMPLE_RATE_INPUT = 16000;
const SAMPLE_RATE_OUTPUT = 24000;

export const useGeminiLive = () => {
  const [status, setStatus] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [outputAnalyser, setOutputAnalyser] = useState<AnalyserNode | null>(null);

  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const activeSessionRef = useRef<Promise<any> | null>(null); 
  
  const currentInputRef = useRef<string>('');
  const currentOutputRef = useRef<string>('');

  const addLog = useCallback((sender: LogEntry['sender'], message: string) => {
    setLogs((prev) => [...prev, { timestamp: new Date(), sender, message }]);
    console.log(`[${sender.toUpperCase()}] ${message}`);
  }, []);

  const cleanup = useCallback((keepErrorStatus = false) => {
    sourcesRef.current.forEach((source) => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();

    if (inputContextRef.current) {
      inputContextRef.current.close().catch(() => {});
    }
    if (outputContextRef.current) {
      outputContextRef.current.close().catch(() => {});
    }
    
    inputContextRef.current = null;
    outputContextRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (activeSessionRef.current) {
      activeSessionRef.current.then((session) => {
        try { session.close(); } catch (e) {}
      }).catch(() => {});
    }
    activeSessionRef.current = null;

    setOutputAnalyser(null);
    if (!keepErrorStatus) {
      setStatus(ConnectionState.DISCONNECTED);
    }
    nextStartTimeRef.current = 0;
  }, []);

  const connectGemini = async (config: AIConfig) => {
    try {
      setStatus(ConnectionState.CONNECTING);
      addLog('system', 'Initializing James Core...');

      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      inputContextRef.current = new AudioContextClass({ sampleRate: SAMPLE_RATE_INPUT });
      outputContextRef.current = new AudioContextClass({ sampleRate: SAMPLE_RATE_OUTPUT });

      const analyser = outputContextRef.current.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      setOutputAnalyser(analyser);

      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        throw new Error("Neural link failed: Microphone access denied.");
      }

      // Re-create AI instance to ensure fresh key from process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: config.modelId,
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } },
          },
          systemInstruction: config.systemInstruction,
        },
        callbacks: {
          onopen: () => {
            addLog('system', 'Neural Link established. Systems online.');
            setStatus(ConnectionState.CONNECTED);
            
            if (!inputContextRef.current || !streamRef.current) return;
            
            const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
            const scriptProcessor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(() => {});
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription?.text) {
                currentInputRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription?.text) {
                currentOutputRef.current += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
                if (currentInputRef.current.trim()) {
                    addLog('user', currentInputRef.current.trim());
                    currentInputRef.current = '';
                }
                if (currentOutputRef.current.trim()) {
                    addLog('ai', currentOutputRef.current.trim());
                    currentOutputRef.current = '';
                }
            }

            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data && outputContextRef.current) {
                const ctx = outputContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                try {
                  const audioBuffer = await decodeAudioData(decode(part.inlineData.data), ctx, SAMPLE_RATE_OUTPUT, 1);
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  
                  source.connect(analyser);
                  analyser.connect(ctx.destination);

                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
                  source.onended = () => sourcesRef.current.delete(source);
                } catch (err) {
                  console.error("Audio decode error:", err);
                }
              }
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: (e) => {
            if (e.reason) addLog('system', `Uplink terminated: ${e.reason}`);
            setStatus(ConnectionState.DISCONNECTED);
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            addLog('system', 'Neural Link failure.');
            setStatus(ConnectionState.ERROR);
          }
        }
      });
      activeSessionRef.current = sessionPromise;
    } catch (error: any) {
      console.error("Connection error:", error);
      addLog('system', `System Error: ${error.message}`);
      setStatus(ConnectionState.ERROR);
      cleanup(true); // Keep error status visible
    }
  };

  const connect = useCallback(async (config: AIConfig) => {
    await connectGemini(config);
  }, [addLog, cleanup]);

  const disconnect = useCallback(() => {
    addLog('system', 'Shutting down protocols...');
    cleanup();
  }, [addLog, cleanup]);

  return { status, connect, disconnect, logs, outputAnalyser };
};
