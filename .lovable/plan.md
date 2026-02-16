
## Mostrar imagen del usuario en el dialogo de edicion (solo lectura)

### Cambios necesarios

**1. `src/components/users/types.ts`**
- Agregar `foto_url: string | null` a la interfaz `UserWithRoles` (actualmente no esta incluido aunque el query ya trae el campo con `select('*')`).

**2. `src/components/users/UserEditDialog.tsx`**
- Importar los componentes `Avatar`, `AvatarImage` y `AvatarFallback`.
- Agregar debajo del `DialogDescription` y antes del formulario, un bloque centrado con el avatar del usuario en tamano grande (similar al de Profile.tsx).
- Mostrar las iniciales como fallback si no tiene foto.
- El avatar es solo de visualizacion, sin boton de edicion ni funcionalidad de carga.

### Vista esperada

Al abrir el dialogo de edicion, se vera la foto del usuario (o sus iniciales) centrada en la parte superior del formulario, antes del campo RUT. No se podra modificar la imagen desde este dialogo.
