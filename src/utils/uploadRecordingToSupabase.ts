import { supabase } from '@/integrations/supabase/client';

export interface UploadRecordingResult {
  url: string;
  fileName: string;
  path: string;
}

/**
 * Uploads a recording file to Supabase storage
 * @param filePath - Native file path from the audio recorder
 * @param fileName - Optional custom file name (defaults to timestamp-based name)
 * @returns Public URL, file name, and storage path
 */
export const uploadRecordingToSupabase = async (
  filePath: string,
  fileName?: string
): Promise<UploadRecordingResult> => {
  try {
    // Convert native file path to a blob
    // On native apps, filePath is typically a file:// URI
    const response = await fetch(filePath);
    const blob = await response.blob();

    // Generate filename if not provided
    const timestamp = new Date().getTime();
    const finalFileName = fileName || `recording_${timestamp}.m4a`;

    // Upload to Supabase storage bucket 'recordings'
    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(finalFileName, blob, {
        contentType: 'audio/m4a',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload recording: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      fileName: finalFileName,
      path: data.path,
    };
  } catch (error) {
    console.error('Error uploading recording to Supabase:', error);
    throw error;
  }
};
