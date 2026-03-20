

## Plan: Agregar confirmación antes de postular a un evento

### Cambio
Agregar un `ConfirmDialog` (ya existe en `src/components/ui/ConfirmDialog.tsx`) que pregunte "¿Está seguro que desea postular a este evento?" antes de ejecutar la postulación.

### Archivo: `src/components/events/EventsUserTable.tsx`
- Importar `ConfirmDialog` desde `@/components/ui/ConfirmDialog`
- Agregar estado `applyDeal` para guardar el deal seleccionado para postular
- El botón "Postular" ahora abre el diálogo de confirmación en vez de llamar `handleApply` directamente
- Al confirmar en el diálogo, se ejecuta `handleApply` con el deal guardado
- Título: "Confirmar postulación", Descripción: "¿Está seguro que desea postular al evento [nombre]?"

### Archivos a modificar
- `src/components/events/EventsUserTable.tsx`

