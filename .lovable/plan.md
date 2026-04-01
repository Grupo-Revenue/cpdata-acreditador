

## Plan: Agregar descripciones a los items del sidebar

### Objetivo
Hacer que cada item de navegacion del sidebar muestre un subtitulo descriptivo debajo del nombre, para que el usuario entienda rapidamente que funcion cumple cada seccion.

### Cambios en `src/components/layout/Sidebar.tsx`

1. **Extender la interfaz `NavItem`** con un campo `description: string` para cada item.

2. **Agregar descripciones a cada item del array `navItems`**:
   - Dashboard: "Resumen general y metricas"
   - Usuarios: "Gestionar acreditadores y roles"
   - Eventos: "Eventos y asignacion de equipos"
   - Boletas: "Subir y gestionar boletas"
   - Rendiciones: "Control de gastos y rendiciones"
   - Soporte: "Tickets de ayuda y consultas"
   - Ranking: "Ranking de acreditadores"
   - Configuracion: "Parametros del sistema"

3. **Actualizar `NavItemComponent`** para mostrar la descripcion debajo del label cuando el sidebar esta expandido (no collapsed). Usar un `<span>` con `text-xs text-muted-foreground` para el subtitulo.

4. **Mejorar los tooltips en modo collapsed** para que incluyan la descripcion ademas del nombre.

### Diseno visual (sidebar expandido)
```text
 [icon]  Dashboard
         Resumen general y metricas

 [icon]  Usuarios
         Gestionar acreditadores y roles
```

### Archivo a modificar
- `src/components/layout/Sidebar.tsx` (unico archivo)

