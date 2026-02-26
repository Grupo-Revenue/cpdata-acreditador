

## Problema: La tabla de Postulantes muestra "Sin nombre" en la columna Evento

### Causa raiz

En `EventApplicantsDialog.tsx` (linea 146), cuando la relacion `events` del registro `event_accreditors` no se resuelve correctamente (por ejemplo, si el evento fue eliminado o hay un problema de sincronizacion), el join de Supabase retorna `null` y se muestra el fallback `'Sin nombre'`:

```typescript
event_name: r.events?.name ?? 'Sin nombre',
```

### Solucion

1. **Incluir `hubspot_deal_id` en el join de eventos** para poder mostrarlo como identificador alternativo
2. **Mejorar el fallback** para que muestre informacion util en vez de "Sin nombre"
3. **Agregar el `nombre_del_evento` de HubSpot como fuente secundaria**: cruzar los datos locales con los deals de HubSpot (ya disponibles via query `hubspot-deals`) para obtener el nombre real cuando el join local falla

### Cambios en `src/components/events/EventApplicantsDialog.tsx`

1. Modificar el query de `event_accreditors` para incluir `hubspot_deal_id` en el select de events:
   ```typescript
   .select('id, user_id, event_id, application_status, contract_status, payment_amount, events(name, event_date, hubspot_deal_id)')
   ```

2. Agregar un query secundario para obtener los deals de HubSpot (reutilizando la misma edge function `hubspot-deals`)

3. En el mapeo de `applicants`, usar el `nombre_del_evento` de HubSpot como respaldo:
   ```typescript
   event_name: r.events?.name 
     || hubspotDealMap.get(r.events?.hubspot_deal_id)?.nombre_del_evento 
     || hubspotDealMap.get(r.events?.hubspot_deal_id)?.dealname
     || 'Sin nombre',
   ```

4. Agregar `hubspot_deal_id` a la interfaz `Applicant` para referencia

