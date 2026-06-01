## Problema
En `EventsUserTable` el acreditador ve un ícono de avión (Send) sin texto y una badge "Asignado" cuando el admin le envía una postulación. No queda claro que debe presionar para postular.

## Solución
Hacer más explícita la acción y el estado en `src/components/events/EventsUserTable.tsx`:

1. **Botón de escritorio (desktop):** Reemplazar el botón ghost con ícono de avión por un botón visible con texto **"Postular"** + ícono `Send`, variante `default` (primario) tamaño `sm`. Solo se muestra cuando `application_status === 'asignado'`.

2. **Badges de estado de postulación:**
   - `asignado` → "Postulación pendiente" (azul, en vez de "Asignado")
   - `pendiente` → "En revisión" (en vez de "Pendiente"), para indicar que está esperando aprobación del admin
   - `aceptado` → "Aceptado" (sin cambios)
   - `rechazado` → "Rechazado" (sin cambios)

3. **Móvil:** El botón ya tiene el texto "Postular"; solo se actualizan las etiquetas de las badges (cambio centralizado en `getDisplayStatus`).

## Sin cambios
- Backend / flujo de estados (`asignado` → `pendiente` → `aceptado`/`rechazado`) intacto.
- `EventApplicantsDialog` (donde el admin acepta/rechaza) intacto.
- Otras tablas y páginas intactas.

**Archivo modificado:** `src/components/events/EventsUserTable.tsx`
