

## Plan: Agregar RUT de Solo Lectura en Edición de Usuario

### Objetivo
Mostrar el RUT del usuario en el diálogo de edición, pero como campo bloqueado (solo lectura) para referencia visual.

---

### Cambio a Realizar

**Archivo**: `src/components/users/UserEditDialog.tsx`

Agregar un campo de Input deshabilitado para mostrar el RUT al inicio del formulario, justo antes del campo "Nombre":

```tsx
<div className="grid gap-2">
  <Label htmlFor="rut">RUT</Label>
  <Input
    id="rut"
    value={user?.rut || ''}
    disabled
    className="bg-muted"
  />
</div>
```

---

### Resultado Visual

El formulario de edición mostrará:

| Campo | Editable |
|-------|----------|
| RUT | No (bloqueado, fondo gris) |
| Nombre | Sí |
| Apellido | Sí |
| Teléfono | Sí |
| Referencia de Contacto | Sí |
| Estado de Aprobación | Sí |
| Usuario Activo | Sí |

---

### Detalles Técnicos

- El RUT se obtiene directamente del objeto `user` pasado como prop (ya disponible en `UserWithRoles`)
- No se incluye en `formData` ya que no es editable
- Se usa `disabled` y `className="bg-muted"` para indicar visualmente que no puede modificarse
- No requiere cambios en la lógica de guardado

