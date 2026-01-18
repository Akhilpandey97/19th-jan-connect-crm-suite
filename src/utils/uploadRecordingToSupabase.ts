import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export async function uploadRecordingToSupabase(filePath: string, destFilename: string) {
  // convert native file path to a fetchable url inside WebView
  const src = (Capacitor as any).convertFileSrc ? (Capacitor as any).convertFileSrc(filePath) : filePath;
  const res = await fetch(src);
  if (!res.ok) throw new Error('Failed to fetch recording file');
  const blob = await res.blob();

  const uploadPath = `recordings/${destFilename}`;
  const { error: uploadErr } = await supabase.storage
    .from('recordings')
    .upload(uploadPath, blob, { contentType: blob.type || 'audio/m4a', upsert: false });

  if (uploadErr) throw uploadErr;

  const { data, error: urlErr } = await supabase
    .storage
    .from('recordings')
    .getPublicUrl(uploadPath);

  if (urlErr) throw urlErr;
  // supabase returns { publicUrl } in newer SDKs under data?.publicUrl
  // adapt to either shape
  if (data && (data as any).publicUrl) return (data as any).publicUrl;
  if ((data as any)?.publicURL) return (data as any).publicURL;
  return data;
}