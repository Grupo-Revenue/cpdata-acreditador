

## Fix: Permitir a todos los usuarios crear tickets de soporte

### Problema
El botón "Crear Ticket" en la página de Soporte solo es visible para administradores (`isAdmin`), pero todos los usuarios autenticados deberían poder crear tickets.

### Cambio en `src/pages/app/Support.tsx`

Eliminar la condición `isAdmin &&` que envuelve el botón "Crear Ticket" en el `PageHeader` (línea ~114), para que todos los roles puedan ver y usar el botón.

```tsx
// Antes:
actions={
  isAdmin && (
    <Button onClick={() => setCreateOpen(true)}>...
  )
}

// Después:
actions={
  <Button onClick={() => setCreateOpen(true)}>...
}
```

No se requieren cambios en la base de datos: la política RLS `Authenticated users can create tickets` ya permite a cualquier usuario autenticado insertar tickets.

