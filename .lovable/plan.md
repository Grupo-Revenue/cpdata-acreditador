## Problema

Al enviar la plantilla `msg_boleta_pagada` desde el diálogo individual (`InvoiceWhatsappDialog`), Meta responde con error porque la plantilla tiene una variable `{{1}}` y el formulario la deja vacía si el usuario no escribe nada. En cambio, el flujo masivo (`BulkWhatsappInvoicesDialog`) funciona porque pasa automáticamente el `nombre` del destinatario como parámetro `[nombre]`.

## Solución

Alinear el envío individual con el masivo, prellenando las variables de la plantilla con el `nombre` del destinatario de la boleta y validando que no se envíen valores vacíos.

### Edits en `src/components/invoices/InvoiceWhatsappDialog.tsx`

1. Al cambiar de plantilla (efecto que detecta `variables`), prellenar `variableValues`:
   - `{{1}}` → `invoice.profiles.nombre` (igual que el bulk).
   - Resto de variables → string vacío (el usuario las completa).
2. En `sendMutation.mutationFn`, antes de invocar la edge function, validar que cada variable detectada tenga un valor no vacío; si falta alguna, lanzar `throw new Error('Completa todas las variables de la plantilla')` para que aparezca un toast claro en vez del error 400 de Meta.
3. Mantener `cleanPhone` y demás lógica como está.

No requiere cambios en la edge function `send-whatsapp-message` ni en la base de datos.

## Verificación

- Abrir una boleta pagada → ícono de WhatsApp → seleccionar `msg_boleta_pagada` → la variable `{{1}}` aparece prellenada con el nombre → enviar → mensaje recibido sin error.
- Probar con `msg_pendiente_boleta` (mismo comportamiento).
- Probar plantilla con variable vacía manualmente → toast "Completa todas las variables de la plantilla".