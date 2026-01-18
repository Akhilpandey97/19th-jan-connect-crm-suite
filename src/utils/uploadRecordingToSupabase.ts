import { supabase } from '@/integrations/supabase/client';

export interface UploadRecordingResult {
  url: string;
  fileName: string;
  path: string;
}

interface RecordingMetadata {
  url: string;
  duration: number;
  fileName: string;
}

/**
 * Uploads a recording file to Supabase storage
 * @param filePath - Native file path from the audio recorder
 * @param fileName - Optional custom file name (defaults to timestamp-based name)
 * @returns Public URL, file name, and storage path
 * @throws Error if upload fails with detailed error message
 */
export const uploadRecordingToSupabase = async (
  filePath: string,
  fileName?: string
): Promise<UploadRecordingResult> => {
  try {
    // Convert native file path to a blob
    // On native apps, filePath is typically a file:// URI
    let response;
    try {
      response = await fetch(filePath);
    } catch (fetchError) {
      throw new Error(`Failed to read recording file: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}. Please check file path and permissions.`);
    }

    let blob;
    try {
      blob = await response.blob();
    } catch (blobError) {
      throw new Error(`Failed to convert recording to uploadable format: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`);
    }

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
