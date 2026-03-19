import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'ticket-evidence';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/**
 * Normalizes a stored evidence value to a storage path.
 * Handles legacy full Supabase URLs and plain paths.
 */
export function normalizeEvidencePath(value: string): string {
  // Legacy public URL pattern
  const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  if (value.startsWith(publicPrefix)) {
    return decodeURIComponent(value.slice(publicPrefix.length));
  }

  // Legacy signed URL pattern
  const signedPrefix = `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/`;
  if (value.startsWith(signedPrefix)) {
    const pathWithParams = value.slice(signedPrefix.length);
    return decodeURIComponent(pathWithParams.split('?')[0]);
  }

  // Generic: any supabase storage URL containing the bucket name
  if (value.startsWith('http') && value.includes(`/${BUCKET}/`)) {
    const parts = value.split(`/${BUCKET}/`);
    return decodeURIComponent(parts[parts.length - 1].split('?')[0]);
  }

  // Already a path
  return value;
}

/**
 * Downloads a file from the ticket-evidence bucket and opens it as a blob URL.
 * This avoids navigating to supabase.co directly (which is blocked in iframes/previews).
 */
export async function openEvidenceFile(value: string): Promise<{ error?: string }> {
  const path = normalizeEvidencePath(value);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(path);

  if (error) {
    return { error: error.message };
  }

  const url = URL.createObjectURL(data);
  window.open(url, '_blank');
  return {};
}
