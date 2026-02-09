export interface StreamConfig {
  sampleRate: number;
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  accentColor?: string;
}

export interface LogEntry {
  timestamp: Date;
  sender: 'user' | 'system' | 'ai';
  message: string;
}

export type AIProvider = 'gemini' | 'openai' | 'deep_psychology' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  modelId: string;
  voiceName: string;
  systemInstruction: string;
}