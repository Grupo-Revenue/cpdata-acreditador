## Agregar tooltips (title) a iconos de acción sin etiqueta

### Problema
Varios botones con `size="icon"` en las tablas de eventos no tienen el atributo `title`, por lo que al acercar el cursor no se muestra qué acción representan. El usuario reportó específicamente el icono del avión (Send) para postular a eventos.

### Cambios

**`src/components/events/EventsUserTable.tsx`**
- Agregar `title="Postular al evento"` al botón `<Send>` (línea ~356) que abre el diálogo de postulación.

**`src/components/events/EventsAdminTable.tsx`**
- Agregar `title="Editar evento"` al botón `<Pencil>` (línea ~359).
- Agregar `title="Asignar equipo"` al botón `<Users>` (línea ~364).

### Detalle técnico
- Se usa el atributo nativo `title` de HTML en los `<Button>` de shadcn/ui (ya usado en otros botones del mismo archivo).
- Sin cambios de backend.
- Texto en español, consistente con el resto de la UI.