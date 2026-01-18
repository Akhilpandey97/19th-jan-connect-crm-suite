import { registerPlugin } from '@capacitor/core';

export interface CallLogEntry {
  id: string;
  phone: string;
  name: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'unknown';
  timestamp: string;
  duration: number;
}

export interface CallLogPlugin {
  getCallLogs(options?: { limit?: number }): Promise<{ logs: CallLogEntry[] }>;
  requestPermissions(): Promise<{ callLog: 'granted' | 'denied' }>;
  checkPermissions(): Promise<{ callLog: 'granted' | 'denied' }>;
}

export interface RecordingResult {
  status: 'recording' | 'stopped';
  filePath: string;
  duration?: number;
}

export interface AudioRecorderPlugin {
  startRecording(options?: { filename?: string }): Promise<RecordingResult>;
  stopRecording(): Promise<RecordingResult>;
  isRecording(): Promise<{ isRecording: boolean; duration?: number }>;
  requestPermissions(): Promise<{ microphone: 'granted' | 'denied' }>;
  checkPermissions(): Promise<{ microphone: 'granted' | 'denied' }>;
}

export interface CallStateEvent {
  phone: string;
  direction: 'incoming' | 'outgoing';
}

export interface CallStatePlugin {
  addListener(
    eventName: 'callStarted' | 'callEnded',
    listenerFunc: (event: CallStateEvent) => void
  ): Promise<{ remove: () => void }>;
  removeAllListeners(): Promise<void>;
}

// Register native plugins
export const CallLogPlugin = registerPlugin<CallLogPlugin>('CallLogPlugin');
export const AudioRecorderPlugin = registerPlugin<AudioRecorderPlugin>('AudioRecorderPlugin');
export const CallStatePlugin = registerPlugin<CallStatePlugin>('CallStatePlugin');

// Helper to check if running in native app
export const isNativeApp = (): boolean => {
  return typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor !== 'undefined' && 
         (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform();
};
