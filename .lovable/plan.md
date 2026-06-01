## Plan: Toggle de visibilidad de contraseña en Login

### Cambio
Agregar un botón de mostrar/ocultar contraseña dentro del campo de password en la pantalla de login.

### Implementación
1. En `src/pages/auth/Login.tsx`:
   - Importar los iconos `Eye` y `EyeOff` de `lucide-react`.
   - Agregar un estado `showPassword` (boolean) con `useState`.
   - Cambiar el `type` del `<Input>` de password a condicional: `type={showPassword ? 'text' : 'password'}`.
   - Agregar un botón/icono al lado derecho del input (posicionado con `absolute right-3`) que alterne el estado `showPassword`.
   - El botón debe ser accesible (tipo `button`, no submit) y mostrar `Eye` cuando la contraseña está oculta y `EyeOff` cuando está visible.

### Archivo a modificar
- `src/pages/auth/Login.tsx`