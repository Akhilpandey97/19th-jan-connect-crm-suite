import { useEffect, useRef } from 'react';
import { useNativeAudioRecorder } from '@/hooks/useNativeAudioRecorder';
import { uploadRecordingToSupabase } from '@/utils/uploadRecordingToSupabase';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Event names emitted by native CallStatePlugin
const CALL_STARTED_EVENT = 'callStarted';
const CALL_ENDED_EVENT = 'callEnded';

export const useAutoCallRecorder = () => {
  const { startRecording, stopRecording, isNative } = useNativeAudioRecorder();
  const { user } = useAuth();
  const { toast } = useToast();
  const recordingRef = useRef<{ filePath?: string; duration?: number; phone?: string } | null>(null);

  useEffect(() => {
    if (!isNative) return;

    const callStartedHandler = async (event: any) => {
      try {
        const { phone, direction } = event.detail || {};
        const filename = `auto_${Date.now()}.m4a`;
        await startRecording(filename);
        recordingRef.current = { phone };
        toast?.({ title: 'Auto Recording', description: `Started recording ${phone}` });
      } catch (err) {
        console.error('Failed to start recording on callStarted:', err);
      }
    };

    const callEndedHandler = async (event: any) => {
      try {
        const result = await stopRecording();
        if (!result || !result.filePath) return;
        const { filePath, duration } = result;
        const destFilename = `call_${Date.now()}.m4a`;
        toast?.({ title: 'Uploading', description: 'Uploading call recording...' });

        const publicUrl = await uploadRecordingToSupabase(filePath, destFilename);

        // Try to match lead by phone (simple lookup)
        let leadId = null;
        const phone = recordingRef.current?.phone;
        if (phone) {
          const normalized = phone.replace(/\s+/g, '').replace(/-/g, '');
          const { data: leads } = await supabase
            .from('leads')
            .select('id')
            .ilike('phone', `%${normalized}%`)
            .limit(1);
          if (leads && leads.length > 0) {
            leadId = leads[0].id;
          }
        }

        // Create activity
        if (user) {
          await supabase.from('lead_activities').insert({
            lead_id: leadId,
            type: 'call',
            title: phone ? `Call ${phone}` : 'Call recording',
            description: null,
            metadata: {
              recording: {
                url: publicUrl,
                duration,
                fileName: destFilename,
              },
            },
            user_id: user.id,
          });

          toast?.({ title: 'Saved', description: 'Call recording saved to activity' });
        }
      } catch (err) {
        console.error('Error on callEnded handler:', err);
        toast?.({ title: 'Error', description: 'Failed to upload/create activity', variant: 'destructive' });
      } finally {
        recordingRef.current = null;
      }
    };

    // Subscribe to Capacitor events from native plugin
    (Capacitor as any).Plugins?.CallStatePlugin?.addListener?.(CALL_STARTED_EVENT, callStartedHandler);
    (Capacitor as any).Plugins?.CallStatePlugin?.addListener?.(CALL_ENDED_EVENT, callEndedHandler);

    // fallback: also listen to window events (if plugin uses notifyListeners -> JS listeners)
    window.addEventListener(CALL_STARTED_EVENT, (e: any) => callStartedHandler(e));
    window.addEventListener(CALL_ENDED_EVENT, (e: any) => callEndedHandler(e));

    return () => {
      try {
        (Capacitor as any).Plugins?.CallStatePlugin?.removeAllListeners?.(CALL_STARTED_EVENT);
        (Capacitor as any).Plugins?.CallStatePlugin?.removeAllListeners?.(CALL_ENDED_EVENT);
      } catch {}
      window.removeEventListener(CALL_STARTED_EVENT, (e: any) => callStartedHandler(e));
      window.removeEventListener(CALL_ENDED_EVENT, (e: any) => callEndedHandler(e));
    };
  }, [isNative, startRecording, stopRecording, user, toast]);
};