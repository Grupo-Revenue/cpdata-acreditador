## Problema

En el diálogo "Envío Masivo — Eventos Disponibles" (`BulkWhatsappEventsDialog.tsx`), al hacer clic sobre un acreditador no se logra seleccionar (parece que nada cambia, o se "deselecciona" inmediatamente).

## Causa raíz

Cada fila usa un `<label>` envolviendo el `<Checkbox>` de Radix:

```tsx
<label ...>
  <Checkbox checked={...} onCheckedChange={() => toggleUser(user.id)} />
  ...
</label>
```

Esto provoca el clásico **doble disparo** de evento: al hacer clic sobre el `Checkbox`, Radix dispara `onCheckedChange` una vez; el evento `click` además burbujea al `<label>`, que reenvía un segundo `click` al control asociado, disparando `onCheckedChange` por segunda vez. Resultado: el ítem se marca y desmarca en el mismo clic, por eso "no permite seleccionar más de uno" (ni siquiera uno).

## Solución

Reemplazar el `<label>` por un `<div>` con `onClick={() => toggleUser(user.id)}`, y poner el `Checkbox` en modo no interactivo (`pointer-events-none`) para que sea un solo manejador de click el que dispare la selección.

### Cambio en `src/components/events/BulkWhatsappEventsDialog.tsx`

```tsx
filtered.map(user => (
  <div
    key={user.id}
    onClick={() => toggleUser(user.id)}
    className="flex items-center gap-3 px-2 py-2 rounded hover:bg-muted/50 cursor-pointer"
  >
    <Checkbox
      checked={selectedIds.has(user.id)}
      className="pointer-events-none"
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{user.nombre} {user.apellido}</p>
      <p className="text-xs text-muted-foreground">{user.telefono} · {user.role}</p>
    </div>
  </div>
))
```

Con esto cada clic dispara `toggleUser` exactamente una vez y se podrán seleccionar múltiples acreditadores sin problema.

## Archivos

- **Modificar**: `src/components/events/BulkWhatsappEventsDialog.tsx` (solo el bloque del `map` de la lista).