import { useEffect, useRef, useState } from 'react';
import { CallStatePlugin, isNativeApp, CallStateEvent } from '@/services/nativePlugins';
import { useNativeAudioRecorder } from '@/hooks/useNativeAudioRecorder';
import { uploadRecordingToSupabase } from '@/utils/uploadRecordingToSupabase';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for automatic call recording
 * Listens to native call events and orchestrates recording/upload/activity creation
 */
export const useAutoCallRecorder = () => {
  const { startRecording, stopRecording, isRecording } = useNativeAudioRecorder();
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const currentCallRef = useRef<{
    phone: string;
    direction: 'incoming' | 'outgoing';
    startTime: number;
  } | null>(null);

  useEffect(() => {
    // Only enable in native app
    if (!isNativeApp() || !isEnabled) {
      return;
    }

    let callStartedListener: { remove: () => void } | null = null;
    let callEndedListener: { remove: () => void } | null = null;

    const setupListeners = async () => {
      try {
        // Listen for call started events
        callStartedListener = await CallStatePlugin.addListener('callStarted', async (event: CallStateEvent) => {
          console.log('Call started:', event);
          
          toast({
            title: 'Call Recording',
            description: 'Recording started automatically',
          });

          // Store call info
          currentCallRef.current = {
            phone: event.phone,
            direction: event.direction,
            startTime: Date.now(),
          };

          // Start recording with custom filename
          const timestamp = Date.now();
          const filename = `call_${event.direction}_${timestamp}.m4a`;
          await startRecording(filename);
        });

        // Listen for call ended events
        callEndedListener = await CallStatePlugin.addListener('callEnded', async (event: CallStateEvent) => {
          console.log('Call ended:', event);

          if (!currentCallRef.current) {
            console.warn('Call ended but no current call tracked');
            return;
          }

          // Store call info before clearing ref
          const callInfo = { ...currentCallRef.current };

          try {
            // Stop recording
            const result = await stopRecording();
            
            if (!result || !result.filePath) {
              console.error('No recording file path returned');
              toast({
                title: 'Recording Error',
                description: 'Failed to save recording',
                variant: 'destructive',
              });
              return;
            }

            // Calculate duration - use nullish coalescing to handle 0 duration correctly
            const duration = result.duration ?? Math.floor((Date.now() - callInfo.startTime) / 1000);

            // Upload to Supabase
            toast({
              title: 'Uploading Recording',
              description: 'Please wait...',
            });

            const uploadResult = await uploadRecordingToSupabase(result.filePath);

            // Try to match phone number to a lead
            // Normalize phone number by removing all non-digits for better matching
            const normalizedPhone = event.phone.replace(/\D/g, '');
            
            // Use Supabase query builder with proper escaping
            const { data: leads } = await supabase
              .from('leads')
              .select('id, name, phone')
              .or(`phone.ilike.%${normalizedPhone.replace(/%/g, '\\%')}%,phone.ilike.%${event.phone.replace(/%/g, '\\%')}%`)
              .limit(1);

            const matchedLead = leads && leads.length > 0 ? leads[0] : null;

            // Create activity record
            const activityData = {
              lead_id: matchedLead?.id || null,
              type: 'call',
              title: matchedLead 
                ? `${callInfo.direction === 'outgoing' ? 'Outgoing' : 'Incoming'} call with ${matchedLead.name}`
                : `${callInfo.direction === 'outgoing' ? 'Outgoing' : 'Incoming'} call to ${event.phone}`,
              description: `Automatic recording - ${duration}s`,
              metadata: {
                recording: {
                  url: uploadResult.url,
                  duration,
                  fileName: uploadResult.fileName,
                },
                phone: event.phone,
                direction: callInfo.direction,
                autoRecorded: true,
              },
            };

            const { error: insertError } = await supabase
              .from('lead_activities')
              .insert([activityData]);

            if (insertError) {
              console.error('Error creating activity:', insertError);
              toast({
                title: 'Error',
                description: 'Recording saved but failed to log activity',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Call Recorded',
                description: matchedLead 
                  ? `Recording saved to ${matchedLead.name}'s activity`
                  : 'Recording saved successfully',
              });
            }
          } catch (error) {
            console.error('Error handling call end:', error);
            toast({
              title: 'Error',
              description: 'Failed to process recording',
              variant: 'destructive',
            });
          } finally {
            currentCallRef.current = null;
          }
        });

        console.log('Call state listeners registered');
      } catch (error) {
        console.error('Error setting up call state listeners:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize auto-recording',
          variant: 'destructive',
        });
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      if (callStartedListener) {
        callStartedListener.remove();
      }
      if (callEndedListener) {
        callEndedListener.remove();
      }
      currentCallRef.current = null;
    };
  }, [isEnabled, startRecording, stopRecording, toast]);

  return {
    isEnabled,
    setIsEnabled,
    isRecording,
  };
};
