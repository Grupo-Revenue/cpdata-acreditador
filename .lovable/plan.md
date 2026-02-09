

## Plan: Mostrar Negocios de HubSpot en la Pagina de Eventos

### Objetivo
Reemplazar el estado vacio actual de la pagina de Eventos por una tabla que muestre los negocios (deals) de HubSpot filtrados por pipeline `755372600` y dealstage `1098991990`, usando el token configurado en Configuracion.

---

### Arquitectura

La pagina de Eventos llamara a una nueva Edge Function que:
1. Lee el token de HubSpot desde la tabla `settings`
2. Consulta la API de HubSpot para obtener los deals del pipeline y stage especificados
3. Devuelve los datos al frontend

---

### Columnas de la Tabla

| Columna | Propiedad HubSpot | Descripcion |
|---------|-------------------|-------------|
| Nombre del Deal | `dealname` | Nombre del negocio |
| Nombre del Evento | `nombre_del_evento` | Propiedad personalizada |
| Tipo de Evento | `tipo_de_evento` | Propiedad personalizada |
| Cantidad de Asistentes | `cantidad_de_asistentes` | Propiedad personalizada |
| Locacion | `locacion_del_evento` | Propiedad personalizada |
| Horario | `hora_de_inicio_y_fin_del_evento` | Propiedad personalizada |
| Fecha Inicio | `fecha_inicio_del_evento` | Propiedad personalizada |
| Fecha Fin | `fecha_fin_del_evento` | Propiedad personalizada |
| Etapa | `dealstage` | Etapa del negocio |

---

### Archivos a Crear/Modificar

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| `supabase/functions/hubspot-deals/index.ts` | Nuevo | Edge Function que consulta la API de HubSpot |
| `src/pages/app/Events.tsx` | Modificar | Reemplazar EmptyState con tabla de datos |

---

### Detalles Tecnicos

**Edge Function `hubspot-deals`:**
- Lee el `hubspot_token` de la tabla `settings` usando el service role key
- Llama a `POST https://api.hubapi.com/crm/v3/objects/deals/search` con filtros:
  - `pipeline = 755372600`
  - `dealstage = 1098991990`
- Solicita las propiedades: `dealname`, `nombre_del_evento`, `tipo_de_evento`, `cantidad_de_asistentes`, `locacion_del_evento`, `hora_de_inicio_y_fin_del_evento`, `fecha_inicio_del_evento`, `fecha_fin_del_evento`, `dealstage`
- Requiere autenticacion (usuario logueado)
- Retorna el array de deals con sus propiedades

**Pagina de Eventos:**
- Usa `useQuery` para llamar a la Edge Function via `supabase.functions.invoke('hubspot-deals')`
- Muestra `LoadingState` mientras carga
- Muestra `EmptyState` si no hay resultados o si HubSpot no esta configurado
- Muestra una tabla con las columnas indicadas cuando hay datos
- Manejo de errores con toast si la llamada falla

