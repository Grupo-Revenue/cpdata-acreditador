

## Problema: `altura` e `idioma` no se guardan al registrarse

### Causa raiz

La interfaz `SignUpData` en `AuthContext.tsx` no incluye los campos `altura` ni `idioma`. El formulario de registro los envía, pero se descartan silenciosamente porque no están en el tipo ni en el objeto `options.data` del `signUp`.

El trigger de base de datos (`handle_new_user`) ya los maneja correctamente -- solo falta pasarlos desde el frontend.

### Cambios

**`src/contexts/AuthContext.tsx`**:
1. Agregar `altura?: string` e `idioma?: string` a la interfaz `SignUpData` (lineas 43-63)
2. Agregar `altura: data.altura || null` e `idioma: data.idioma || null` al objeto `options.data` en la funcion `signUp` (lineas 257-274)

