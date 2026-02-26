

## Problema

El bucket de storage `invoices` no tiene politicas RLS que permitan a supervisores/acreditadores subir archivos. Solo los admins pueden hacerlo actualmente.

## Solucion

Crear una migracion SQL que agregue politicas de storage para el bucket `invoices`:

1. **INSERT policy**: Permitir a usuarios autenticados subir archivos en su propia carpeta (el path usa el `invoice.id`, y la boleta pertenece al usuario).
2. **SELECT policy**: Permitir a usuarios autenticados leer archivos del bucket.
3. **UPDATE policy**: Permitir upsert (ya que el codigo usa `upsert: true`).

```sql
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
```

### Archivos a modificar
1. **Migracion SQL** — agregar politicas de storage para el bucket `invoices`

No se requieren cambios de codigo frontend.

