

## Ajustar vista de Soporte para supervisor y acreditador

### Situacion actual

Las politicas RLS en `support_tickets` ya estan correctamente configuradas:
- **Admins**: ven todos los tickets (`is_admin(auth.uid())`)
- **Usuarios normales**: solo ven sus propios tickets (`created_by = auth.uid()`)

Por lo tanto, la base de datos ya filtra correctamente. Sin embargo, la interfaz muestra elementos innecesarios para roles no-admin (supervisor/acreditador), como el buscador "por nombre del creador" y la columna "Creado por" en la tabla, cuando solo van a ver sus propios tickets.

### Cambios propuestos

| Archivo | Cambio |
|---------|--------|
| `src/pages/app/Support.tsx` | Ocultar el campo de busqueda "Buscar por nombre del creador" cuando el usuario no es admin, ya que solo vera sus propios tickets. Mantener el filtro de prioridad visible para todos. Cambiar el titulo de la card a "Mis Tickets" para no-admins. |
| `src/components/support/TicketsTable.tsx` | Ocultar las columnas "Creado por" y "Responsable" cuando el usuario no es admin, ya que esa informacion no es relevante para quien solo ve sus propios tickets. Agregar un prop `showCreator` para controlar la visibilidad de esas columnas. |

### Detalle tecnico

**Support.tsx** - Condicionar filtro de busqueda:

```text
// Solo mostrar el buscador por nombre si es admin
{isAdmin && (
  <div className="relative flex-1">
    <Search ... />
    <Input placeholder="Buscar por nombre del creador..." ... />
  </div>
)}
```

**TicketsTable.tsx** - Agregar prop para columnas:

```text
interface TicketsTableProps {
  tickets: SupportTicket[];
  canEdit: boolean;
  canView?: boolean;
  showCreatorColumns?: boolean;  // nuevo prop, default true
  onEdit: (ticket: SupportTicket) => void;
  onView?: (ticket: SupportTicket) => void;
}
```

- Si `showCreatorColumns` es `false`, ocultar las columnas "Creado por" y "Responsable" del header y del body
- Ajustar el `colSpan` del estado vacio acorde

**Uso en Support.tsx:**

```text
<TicketsTable
  tickets={pendingTickets}
  canEdit={isAdmin}
  canView={!isAdmin}
  showCreatorColumns={isAdmin}
  onEdit={handleEdit}
  onView={handleView}
/>
```

