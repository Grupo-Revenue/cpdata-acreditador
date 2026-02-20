

## Enviar mensajes de WhatsApp reales desde Boletas

### Problema

El boton "Enviar" en el dialogo de WhatsApp de boletas **solo muestra un toast de exito** pero nunca envia el mensaje a la API de Meta. Es una implementacion puramente visual (placeholder).

### Solucion

Crear una Edge Function que envie el mensaje via la API de Meta y conectarla al dialogo existente.

### Paso 1: Crear Edge Function `send-whatsapp-message`

Crear `supabase/functions/send-whatsapp-message/index.ts` que:

1. Reciba por POST: `template_name`, `template_language`, `to_phone` y opcionalmente `components` (variables dinamicas)
2. Lea las credenciales de Meta (`meta_access_token`, `meta_phone_number_id`) desde la tabla `settings`
3. Llame a la API de Meta para enviar el mensaje:

```text
POST https://graph.facebook.com/v21.0/{phone_number_id}/messages

{
  "messaging_product": "whatsapp",
  "to": "56912345678",
  "type": "template",
  "template": {
    "name": "msg_prueba",
    "language": { "code": "es" },
    "components": []
  }
}
```

4. Retorne el resultado (exito o error de Meta)

### Paso 2: Registrar la Edge Function

Agregar en `supabase/config.toml`:

```text
[functions.send-whatsapp-message]
verify_jwt = false
```

### Paso 3: Modificar InvoiceWhatsappDialog

Actualizar `src/components/invoices/InvoiceWhatsappDialog.tsx`:

- Reemplazar el `handleSend` placeholder por una llamada real a `supabase.functions.invoke('send-whatsapp-message')`
- Enviar: nombre de plantilla, idioma, numero de telefono del destinatario, y el `meta_template_id`
- Mostrar estado de carga mientras se envia
- Mostrar toast de exito o error segun la respuesta real de Meta

### Paso 4: Formato del numero de telefono

El numero debe enviarse en formato internacional sin el signo `+` (ejemplo: `56912345678`). Se agregara una funcion de limpieza que elimine caracteres no numericos del telefono almacenado en el perfil del usuario.

### Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `supabase/functions/send-whatsapp-message/index.ts` | Crear |
| `supabase/config.toml` | Agregar configuracion |
| `src/components/invoices/InvoiceWhatsappDialog.tsx` | Conectar con la edge function |

### Prerequisito

Las credenciales de Meta ya estan configuradas (token de acceso y Phone Number ID en Configuracion > Integraciones). El Phone Number ID (`meta_phone_number_id`) es el que se usa para enviar mensajes, a diferencia del WABA ID que se usa para gestionar plantillas.

