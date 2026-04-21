

## Plan: Eliminar espacios al ingresar email en login

### Problema
Al copiar y pegar un email en el formulario de login, pueden venir espacios al inicio o final que causan que el login falle o que la validación de email sea incorrecta.

### Solución
Agregar `trim()` automático al campo de email cuando el usuario termina de escribir (evento `onBlur`).

### Cambios

#### 1. Modificar `src/pages/auth/Login.tsx`
En el `FormField` del email, agregar prop `onBlur` al `Input` que ejecute `field.onChange(e.target.value.trim())`:

```tsx
<Input 
  placeholder="correo@ejemplo.cl" 
  className="pl-10"
  {...field}
  onBlur={(e) => {
    field.onChange(e.target.value.trim());
    field.onBlur();
  }}
/>
```

Esto limpia los espacios al perder el foco del campo, sin interferir con la experiencia de escritura.

### Archivos
- **Modificar**: `src/pages/auth/Login.tsx`

