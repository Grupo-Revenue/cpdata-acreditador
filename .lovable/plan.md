

## Plan: Ordenar deals por dealname y mostrar label del dealstage

### Cambios

**1. Edge Function `supabase/functions/hubspot-deals/index.ts`**

- Despues de obtener los deals de HubSpot, hacer una segunda llamada a la API de pipelines para obtener el label del dealstage:
  - `GET https://api.hubapi.com/crm/v3/pipelines/deals/755372600/stages`
  - Construir un mapa `stageId -> label`
  - Reemplazar el valor interno de `dealstage` por su label en cada deal
- Ordenar los deals por `dealname` de mayor a menor (orden descendente alfabetico) antes de retornarlos

**2. Frontend `src/pages/app/Events.tsx`**

- No requiere cambios funcionales, ya que el ordenamiento y el mapeo del label se haran en el backend

---

### Detalles Tecnicos

**Llamada adicional en la Edge Function:**
```
GET https://api.hubapi.com/crm/v3/pipelines/deals/755372600/stages
Authorization: Bearer {token}
```

Respuesta esperada: array de stages con `id` y `label`. Se usara para crear un diccionario y reemplazar el ID interno por el nombre visible.

**Ordenamiento:**
Los deals se ordenaran con `.sort()` comparando `dealname` en orden descendente (Z-A / mayor a menor).

