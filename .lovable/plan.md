

## Integración con Meta WhatsApp Business API para aprobación de plantillas

### Resumen

Cuando el usuario haga clic en "Enviar a aprobación", la plantilla se enviará a la API de Meta para su revisión. Meta devuelve un ID de plantilla que se almacena localmente. El estado cambia a `pending` mientras Meta la revisa.

### Paso 1: Crear Edge Function `submit-whatsapp-template`

Crear `supabase/functions/submit-whatsapp-template/index.ts` que:

1. Verifique autenticación del usuario
2. Lea las credenciales de Meta (`meta_access_token`, `meta_phone_number_id`) desde la tabla `settings` usando service role
3. Reciba el ID de la plantilla local por POST
4. Lea los datos de la plantilla desde `whatsapp_templates`
5. Construya el payload en el formato que requiere la API de Meta (`POST https://graph.facebook.com/v21.0/{WABA_ID}/message_templates`)
6. Envíe la plantilla a Meta
7. Guarde el `meta_template_id` retornado y actualice el estado a `pending`

**Nota**: Se necesita el **WhatsApp Business Account ID (WABA ID)**, no el Phone Number ID, para crear plantillas en Meta. El Phone Number ID sirve para enviar mensajes. Se agregara un campo adicional en la configuracion de Meta para el WABA ID.

### Paso 2: Agregar campo WABA ID a MetaIntegration

Modificar `src/components/settings/MetaIntegration.tsx` para incluir un tercer campo: **WhatsApp Business Account ID (WABA ID)**, almacenado como `meta_waba_id` en la tabla `settings`.

### Paso 3: Modificar WhatsappTemplateDialog

Modificar `src/components/settings/WhatsappTemplateDialog.tsx`:

- El boton "Enviar a aprobacion" primero guarda la plantilla en la base de datos (como `draft`)
- Luego llama a la edge function `submit-whatsapp-template` con el ID de la plantilla
- Si Meta responde exitosamente, el estado se actualiza a `pending` y se guarda el `meta_template_id`
- Si falla, se muestra un error con el mensaje de Meta

### Paso 4: Configurar Edge Function

Agregar la configuracion en `supabase/config.toml`:

```text
[functions.submit-whatsapp-template]
verify_jwt = false
```

### Formato del payload para Meta API

La edge function convertira los datos locales al formato requerido por Meta:

```text
POST https://graph.facebook.com/v21.0/{WABA_ID}/message_templates

{
  "name": "plantilla_nombre",
  "language": "es",
  "category": "MARKETING",
  "components": [
    { "type": "HEADER", "format": "TEXT", "text": "..." },
    { "type": "BODY", "text": "Hola {{1}}, ..." },
    { "type": "FOOTER", "text": "..." },
    { "type": "BUTTONS", "buttons": [...] }
  ]
}
```

### Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `supabase/functions/submit-whatsapp-template/index.ts` | Crear |
| `supabase/config.toml` | Agregar configuracion de la nueva funcion |
| `src/components/settings/MetaIntegration.tsx` | Agregar campo WABA ID |
| `src/components/settings/WhatsappTemplateDialog.tsx` | Integrar llamada a la edge function |

### Prerequisito

Antes de probar, debes ir a **Configuracion > Integraciones** y guardar tus credenciales de Meta:
- Token de acceso
- Phone Number ID: `233776859809440`
- WABA ID (lo encuentras en tu Meta Business Suite > WhatsApp > Configuracion de la cuenta)

