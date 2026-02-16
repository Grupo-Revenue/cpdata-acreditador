

## Actualizar contract_status al firmar

### Problema

Cuando un acreditador o supervisor firma el contrato digital, el estado del contrato (`contract_status`) en la tabla `event_accreditors` no se actualiza. Queda en "pendiente" aunque ya exista la firma.

### Solucion

Agregar una actualizacion a `event_accreditors` dentro de la funcion `handleSign` en `DigitalSignatureDialog.tsx`, cambiando `contract_status` de `"pendiente"` a `"firmado"` inmediatamente despues de insertar la firma exitosamente.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/events/DigitalSignatureDialog.tsx` | Despues de insertar en `digital_signatures`, ejecutar `supabase.from('event_accreditors').update({ contract_status: 'firmado' }).eq('event_id', internalEventId).eq('user_id', userId)` |

### Detalle tecnico

En la funcion `handleSign` (linea 108), despues de la insercion exitosa en `digital_signatures` y antes de mostrar el toast de exito, agregar:

```typescript
await supabase
  .from('event_accreditors')
  .update({ contract_status: 'firmado' })
  .eq('event_id', internalEventId)
  .eq('user_id', userId);
```

Esto asegura que la tabla de postulantes refleje automaticamente que el contrato fue firmado, sin requerir accion manual del administrador.

