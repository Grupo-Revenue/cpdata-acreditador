

## Plan: Usar RUTInput en el diálogo de edición de usuario

### Cambio

**Archivo: `src/components/users/UserEditDialog.tsx`**

Reemplazar el `<Input>` del campo RUT por el componente `<RUTInput>` existente, que ya formatea automáticamente con puntos y guión (ej: `11.111.111-1`).

- Importar `RUTInput` desde `@/components/ui/RUTInput`
- Sustituir el `<Input>` de RUT por `<RUTInput>` pasando `value={formData.rut}`, `onChange` y `disabled={activeRole !== 'superadmin'}`
- Mantener la lógica condicional de superadmin sin cambios

