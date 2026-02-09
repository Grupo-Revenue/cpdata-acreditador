
## Plan: Boton de edicion de eventos con sincronizacion a HubSpot

### Resumen
Agregar un boton de edicion en cada fila de la tabla de eventos que abra un dialogo para modificar las propiedades del deal. Los campos `dealname` (Id) y `dealstage` (Etapa) seran de solo lectura. Al guardar, los cambios se enviaran a HubSpot mediante una nueva Edge Function.

### Cambios

**1. Nueva Edge Function: `supabase/functions/hubspot-update-deal/index.ts`**

- Recibe por POST el `dealId` y un objeto `properties` con los campos a actualizar
- Valida autenticacion del usuario
- Obtiene el token de HubSpot desde la tabla `settings`
- Llama a la API de HubSpot: `PATCH https://api.hubapi.com/crm/v3/objects/deals/{dealId}`
- Envia solo las propiedades editables (excluye `dealname` y `dealstage` por seguridad en el backend)
- Retorna el deal actualizado o un error

**2. Configuracion: `supabase/config.toml`**

- Agregar entrada para la nueva funcion:
```
[functions.hubspot-update-deal]
verify_jwt = false
```

**3. Nuevo componente: `src/components/events/EventEditDialog.tsx`**

- Dialogo modal siguiendo el patron de `UserEditDialog`
- Campos de solo lectura (deshabilitados con fondo gris):
  - `dealname` (Id)
  - `dealstage` (Etapa)
- Campos editables:
  - `nombre_del_evento` (Nombre del Evento)
  - `tipo_de_evento` (Tipo)
  - `cantidad_de_asistentes` (Asistentes)
  - `locacion_del_evento` (Locacion)
  - `hora_de_inicio_y_fin_del_evento` (Horario)
  - `fecha_inicio_del_evento` (Fecha Inicio)
  - `fecha_fin_del_evento` (Fecha Fin)
- Al enviar el formulario, llama a `supabase.functions.invoke('hubspot-update-deal', { body: { dealId, properties } })`
- Muestra toast de exito o error
- Al guardar exitosamente, invalida la query `hubspot-deals` para refrescar la tabla

**4. Actualizacion: `src/pages/app/Events.tsx`**

- Agregar columna "Acciones" al final de la tabla
- Incluir un boton con icono de lapiz (Pencil) en cada fila
- Estado local para controlar el dialogo y el deal seleccionado
- Importar y renderizar `EventEditDialog`

### Detalle tecnico de la Edge Function

```text
POST /hubspot-update-deal
Body: { dealId: string, properties: { nombre_del_evento?: string, ... } }

Flujo:
1. Validar auth
2. Leer hubspot_token de settings
3. Filtrar propiedades: eliminar dealname y dealstage del objeto properties
4. PATCH https://api.hubapi.com/crm/v3/objects/deals/{dealId}
   Headers: Authorization: Bearer {token}
   Body: { properties: { ... } }
5. Retornar resultado
```

### Archivos afectados
- `supabase/functions/hubspot-update-deal/index.ts` (nuevo)
- `supabase/config.toml` (agregar entrada)
- `src/components/events/EventEditDialog.tsx` (nuevo)
- `src/pages/app/Events.tsx` (agregar columna y boton)
