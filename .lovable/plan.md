

## Botón "Consultar estado" para plantillas de WhatsApp pendientes

### Resumen

Agregar un botón en la tabla de plantillas que consulte la API de Meta para verificar y actualizar el estado de las plantillas pendientes. Usa las credenciales ya configuradas (token de acceso y WABA ID).

### Paso 1: Crear Edge Function `check-whatsapp-template-status`

Crear `supabase/functions/check-whatsapp-template-status/index.ts` que:

1. Verifique autenticación del usuario
2. Reciba el `template_id` local por POST
3. Lea las credenciales de Meta (`meta_access_token`, `meta_waba_id`) desde la tabla `settings`
4. Lea el `meta_template_id` de la plantilla local
5. Consulte la API de Meta: `GET https://graph.facebook.com/v21.0/{meta_template_id}?fields=status,name,category`
6. Actualice el estado local segun la respuesta de Meta (`APPROVED` -> `approved`, `REJECTED` -> `rejected`, `PENDING` -> `pending`)
7. Retorne el nuevo estado

### Paso 2: Registrar la Edge Function

Agregar en `supabase/config.toml`:

```text
[functions.check-whatsapp-template-status]
verify_jwt = false
```

### Paso 3: Agregar botón en WhatsappTemplatesManager

Modificar `src/components/settings/WhatsappTemplatesManager.tsx`:

- Agregar un botón con icono de "refresh" en cada fila de plantilla con estado `pending`
- Al hacer clic, llamar a la edge function con `supabase.functions.invoke('check-whatsapp-template-status', { body: { template_id } })`
- Mostrar un toast con el resultado (aprobada, rechazada, o aún pendiente)
- Invalidar la query para refrescar la tabla

### Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `supabase/functions/check-whatsapp-template-status/index.ts` | Crear |
| `supabase/config.toml` | Agregar configuracion de la nueva funcion |
| `src/components/settings/WhatsappTemplatesManager.tsx` | Agregar boton de consulta de estado |

### Detalle tecnico

**Endpoint de Meta para consultar estado:**

```text
GET https://graph.facebook.com/v21.0/{meta_template_id}?fields=status,name,category
Authorization: Bearer {access_token}
```

**Mapeo de estados de Meta a estados locales:**

| Meta | Local |
|---|---|
| APPROVED | approved |
| REJECTED | rejected |
| PENDING | pending |
| IN_APPEAL | pending |

