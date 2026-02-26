-- Allow authenticated users to upload to invoices bucket
CREATE POLICY "Authenticated users can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Allow authenticated users to read invoices
CREATE POLICY "Authenticated users can read invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');

-- Allow authenticated users to update (upsert) invoices
CREATE POLICY "Authenticated users can update invoices"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices');