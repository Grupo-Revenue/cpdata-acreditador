

## Plan: Mejorar visualización móvil de la tabla de Eventos

### Problema
En móvil, las tablas `EventsAdminTable` y `EventsUserTable` tienen muchas columnas (10) que fuerzan scroll horizontal extremo. Los botones de acción (Editar, Equipo, Postulantes, Adicionales, Gestión, Firma, etc.) quedan ocultos al final, son difíciles de alcanzar y de tocar con el dedo.

### Solución: Vista dual (tabla en desktop, tarjetas en móvil)

Usar `useIsMobile()` para alternar entre:
- **Desktop (≥768px)**: tabla actual sin cambios.
- **Móvil (<768px)**: lista de **tarjetas** apiladas, una por evento, con:
  - Header con nombre del evento + badges de estado (Estado Evento / Estado postulación).
  - Datos clave en grid 2 columnas: Tipo, Locación, Fecha, Horario, Monto.
  - **Footer con botones de acción grandes** (h-10, ancho completo o grid 2/3 col) con icono + label de texto en español ("Editar", "Equipo", "Postulantes", "Adicionales", "Gestión", "Firmar", "Descargar contrato", "Postular").
  - Filtros colapsables en un `<details>` o botón "Filtros" que abre un sheet, para no saturar la pantalla.

### Archivos a modificar
1. **`src/components/events/EventsAdminTable.tsx`** — agregar render condicional de tarjetas móvil con todos los botones de acción visibles y táctiles.
2. **`src/components/events/EventsUserTable.tsx`** — misma estrategia: tarjetas móvil con botones Postular / Firmar / Descargar / Gestión.
3. **`src/pages/app/Events.tsx`** (revisión menor) — asegurar que el contenedor permita el render de tarjetas sin overflow horizontal.

### Detalles UX clave
- Botones con `size="sm"` mínimo + `text-xs` y `gap-2` con icono visible.
- Filtros móviles: botón "Filtros (n activos)" → abre `Sheet` lateral con los 8 inputs apilados.
- Paginación intacta (ya es responsive).
- Mantener idioma 100% español, paleta y tipografía existentes.

### Lo que NO cambia
- Lógica de queries, permisos, diálogos hijos, ni estructura desktop.
- Comportamiento de roles (admin/superadmin/supervisor/acreditador).

