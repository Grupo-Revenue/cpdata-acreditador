

## Problema

En `InvoicesTable.tsx` (líneas 324-334), la lógica de acciones para usuarios no-admin solo muestra el check verde si ya hay archivo, pero **no muestra el botón de subir** cuando no hay archivo:

```tsx
// Línea 332-334: usuario no-admin sin file_url → null (nada)
: (
  inv.file_url ? <CheckCircle ... /> : null
)
```

## Solución

Cambiar la rama no-admin para que muestre el botón `Upload` cuando `file_url` está vacío, igual que los admins:

```tsx
// Para no-admin:
inv.file_url ? (
  <CheckCircle className="h-4 w-4 text-success" />
) : (
  <Button variant="ghost" size="icon" onClick={() => onUpload(inv)} title="Subir boleta">
    <Upload className="h-4 w-4" />
  </Button>
)
```

Un cambio de 2 líneas en `src/components/invoices/InvoicesTable.tsx`.

