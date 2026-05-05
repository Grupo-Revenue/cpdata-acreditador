## Plan: Sincronizar contrato firmado con asistencia

### Diagnóstico
Hay 3 firmas en `digital_signatures` para el evento `76614149...`, pero las filas correspondientes en `event_accreditors` siguen con `contract_status='pendiente'`. Como el diálogo de Gestión filtra por `application_status='aceptado' AND contract_status='firmado'` (línea 101 de `EventManagementDialog.tsx`), esos acreditadores nunca aparecen para registrar asistencia.

**Causa raíz:** Tras insertar la firma, `DigitalSignatureDialog.tsx` ejecuta un `UPDATE event_accreditors SET contract_status='firmado'` desde el cliente. Ese UPDATE no genera error pero queda como no-op silencioso (0 filas afectadas) en algunos casos por timing/contexto de RLS. Al no haber excepción, la UI marca la firma como exitosa pero la tabla operativa nunca se actualiza.

### Solución

**1. Trigger en base de datos (fuente de verdad)**
Crear un trigger `AFTER INSERT` en `digital_signatures` que actualice automáticamente `event_accreditors.contract_status='firmado'` para el `(user_id, event_id)` correspondiente. Es `SECURITY DEFINER`, se ejecuta server-side y elimina cualquier dependencia del cliente o de RLS.

```sql
CREATE OR REPLACE FUNCTION public.sync_contract_signed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.event_accreditors
  SET contract_status = 'firmado'
  WHERE user_id = NEW.user_id AND event_id = NEW.event_id;
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_sync_contract_signed
AFTER INSERT ON public.digital_signatures
FOR EACH ROW EXECUTE FUNCTION public.sync_contract_signed();
```

**2. Backfill de las firmas existentes**
```sql
UPDATE event_accreditors ea
SET contract_status='firmado'
FROM digital_signatures ds
WHERE ds.user_id=ea.user_id AND ds.event_id=ea.event_id
  AND ea.contract_status<>'firmado';
```

**3. Limpieza menor en `DigitalSignatureDialog.tsx`**
Quitar el `UPDATE` redundante del cliente (ahora lo hace el trigger). Mantener el `onSigned?.()` y la invalidación de queries.

### Lo que NO cambia
- Reglas de visibilidad (sigue requiriendo `application_status='aceptado'`).
- Flujo de aceptación de postulantes ni RLS existente.
- UI de la firma ni del módulo de gestión.

### Archivos
- **Migración SQL** (trigger + backfill).
- **Modificar** `src/components/events/DigitalSignatureDialog.tsx` (eliminar update redundante).
