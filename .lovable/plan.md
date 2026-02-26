

## Diagnóstico: `contract_status` no se actualiza por RLS

En `DigitalSignatureDialog.tsx` (línea 131-135), después de firmar el contrato se ejecuta:

```ts
await supabase
  .from('event_accreditors')
  .update({ contract_status: 'firmado' })
  .eq('event_id', internalEventId)
  .eq('user_id', userId);
```

Sin embargo, la tabla `event_accreditors` **no tiene ninguna política RLS de UPDATE para usuarios normales** — solo admins tienen acceso ALL. Este update falla silenciosamente, dejando `contract_status` en "pendiente" aunque la firma sí se registró en `digital_signatures`.

### Solución: Migración SQL

Agregar una política que permita a los usuarios actualizar **solo su propia fila** en `event_accreditors`:

```sql
CREATE POLICY "Users can update own accreditor record"
  ON event_accreditors FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Después, actualizar manualmente el registro de Gabriel Espoz:

```sql
UPDATE event_accreditors
SET contract_status = 'firmado'
WHERE user_id = '<gabriel_user_id>'
  AND event_id = '<event_id>';
```

No se requieren cambios en el frontend.

