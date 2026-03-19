UPDATE support_tickets
SET evidence_url = REPLACE(evidence_url, 'https://wodzysrgdsforiuliejo.supabase.co/storage/v1/object/public/ticket-evidence/', '')
WHERE evidence_url LIKE 'https://wodzysrgdsforiuliejo.supabase.co/storage/v1/object/public/ticket-evidence/%';

UPDATE support_tickets
SET response_evidence_url = REPLACE(response_evidence_url, 'https://wodzysrgdsforiuliejo.supabase.co/storage/v1/object/public/ticket-evidence/', '')
WHERE response_evidence_url LIKE 'https://wodzysrgdsforiuliejo.supabase.co/storage/v1/object/public/ticket-evidence/%';