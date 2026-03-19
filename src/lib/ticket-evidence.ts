import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'ticket-evidence';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function normalizeEvidencePath(value: string): string {
  const publicPrefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  if (value.startsWith(publicPrefix)) {
    return decodeURIComponent(value.slice(publicPrefix.length));
  }

  const signedPrefix = `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/`;
  if (value.startsWith(signedPrefix)) {
    const pathWithParams = value.slice(signedPrefix.length);
    return decodeURIComponent(pathWithParams.split('?')[0]);
  }

  if (value.startsWith('http') && value.includes(`/${BUCKET}/`)) {
    const parts = value.split(`/${BUCKET}/`);
    return decodeURIComponent(parts[parts.length - 1].split('?')[0]);
  }

  return value;
}

export interface EvidenceFile {
  blob: Blob;
  objectUrl: string;
  mimeType: string;
  filename: string;
}

/**
 * Downloads a file from the ticket-evidence bucket and returns blob data
 * for in-app preview. Caller must revoke objectUrl when done.
 */
export async function getEvidenceFile(value: string): Promise<EvidenceFile> {
  const path = normalizeEvidencePath(value);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(path);

  if (error) {
    throw new Error(error.message);
  }

  const filename = path.split('/').pop() || 'archivo';

  return {
    blob: data,
    objectUrl: URL.createObjectURL(data),
    mimeType: data.type || 'application/octet-stream',
    filename,
  };
}
