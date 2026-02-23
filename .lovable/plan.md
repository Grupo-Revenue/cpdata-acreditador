

## Corregir bug de rechazo de usuarios

### Problema

En `src/pages/app/Users.tsx`, la funcion `handleReject` solo actualiza `is_active: false` pero no cambia `approval_status` a `'rejected'`. Esto impide que el sistema muestre la interfaz de "Cuenta rechazada" y deja al usuario en un estado inconsistente (`pending` + inactivo).

### Solucion

Agregar `approval_status: 'rejected'` al `.update()` en la funcion `handleReject` (linea ~188).

### Cambio

**Archivo:** `src/pages/app/Users.tsx`

Cambiar:
```typescript
.update({ is_active: false })
```

Por:
```typescript
.update({ is_active: false, approval_status: 'rejected' })
```

Es un cambio de una sola linea que alinea el comportamiento con el ciclo de vida documentado del usuario.

