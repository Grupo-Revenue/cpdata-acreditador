

## Agregar subida de archivos al crear ticket de soporte

### Contexto

Actualmente el dialogo de creacion de tickets solo permite ingresar motivo y prioridad. El dialogo de edicion ya tiene logica de subida de archivos al bucket `ticket-evidence`. Se reutilizara ese mismo patron.

### Problema

Al crear el ticket aun no existe un `id` del registro para usarlo como ruta en el storage. Se debe primero insertar el ticket, obtener el `id` retornado, y luego subir el archivo usando ese `id` como carpeta.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/support/TicketCreateDialog.tsx` | Agregar campo de subida de archivo (imagenes, PDF, docs). Tras insertar el ticket, si hay archivo seleccionado, subirlo al bucket `ticket-evidence` usando el `id` del ticket recien creado y actualizar `evidence_url` en el registro. |

### Detalle tecnico

**Flujo de creacion con archivo:**

1. El usuario completa motivo, prioridad y opcionalmente selecciona un archivo
2. Al hacer clic en "Crear Ticket":
   - Se inserta el ticket en `support_tickets` con `evidence_url = null`
   - Se obtiene el `id` del ticket creado usando `.select('id').single()`
   - Si hay archivo seleccionado, se sube a `ticket-evidence/{ticket_id}/{timestamp}.{ext}`
   - Se obtiene la URL publica y se actualiza el registro con `evidence_url`
3. Se muestra confirmacion

**Codigo clave (patron tomado de TicketEditDialog):**

```text
// Insert ticket y obtener id
const { data: newTicket, error } = await supabase
  .from('support_tickets')
  .insert({ motivo, priority, ... })
  .select('id')
  .single();

// Si hay archivo, subirlo
if (file && newTicket) {
  const filePath = `${newTicket.id}/${Date.now()}.${ext}`;
  await supabase.storage.from('ticket-evidence').upload(filePath, file);
  const { publicUrl } = supabase.storage.from('ticket-evidence').getPublicUrl(filePath);
  await supabase.from('support_tickets').update({ evidence_url: publicUrl }).eq('id', newTicket.id);
}
```

**UI del campo archivo:**
- Boton "Subir archivo" con icono Upload (mismo estilo que TicketEditDialog)
- Acepta imagenes y documentos: `accept="image/*,.pdf,.doc,.docx"`
- Muestra nombre del archivo seleccionado antes de enviar
- Estado de carga con texto "Subiendo..."

