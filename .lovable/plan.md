

## Agregar nuevos campos al registro de usuarios

### Campos nuevos a crear en la base de datos

Los siguientes campos no existen actualmente y deben agregarse a la tabla `profiles`:

| Campo | Columna DB | Tipo | Obligatorio |
|---|---|---|---|
| Fecha de Nacimiento | `fecha_nacimiento` | date | No |
| Semestre | `semestre` | text | No |
| Disponibilidad Horaria | `disponibilidad_horaria` | text | No |
| Comuna | `comuna` | text | No |
| Instagram | `instagram` | text | No |
| Facebook | `facebook` | text | No |
| Talla de Polera | `talla_polera` | text | No |
| Contacto de emergencia | `contacto_emergencia_nombre` | text | No |
| Email contacto emergencia | `contacto_emergencia_email` | text | No |
| Celular contacto emergencia | `contacto_emergencia_telefono` | text | No |

**Nota:** "Referencia de contacto" ya existe y es diferente a "Contacto de emergencia". Se mantienen ambos campos.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| **Migracion SQL** | Agregar 10 columnas nuevas a `profiles` |
| `src/pages/auth/Register.tsx` | Agregar los nuevos campos al formulario de registro publico y al schema zod. Agregar secciones para datos academicos, personales adicionales y contacto de emergencia |
| `src/contexts/AuthContext.tsx` | Actualizar interfaces `Profile` y `SignUpData` con los nuevos campos, y pasar los nuevos datos en `signUp()` como metadata |
| `src/components/users/UserCreateDialog.tsx` | Agregar los 10 campos al formulario de creacion por admin |
| `src/components/users/UserEditDialog.tsx` | Agregar los 10 campos al formulario de edicion |
| `src/pages/app/Profile.tsx` | Agregar los nuevos campos a la vista y edicion del perfil propio |
| `src/components/users/types.ts` | Agregar los nuevos campos a `UserWithRoles` |
| `supabase/functions/create-user/index.ts` | Aceptar y guardar los nuevos campos al crear usuario por admin |
| `supabase/functions/create-users-bulk/index.ts` | Soportar los nuevos campos en la carga masiva CSV |

### Detalle tecnico

**Migracion SQL:**
```sql
ALTER TABLE profiles
  ADD COLUMN fecha_nacimiento date,
  ADD COLUMN semestre text,
  ADD COLUMN disponibilidad_horaria text,
  ADD COLUMN comuna text,
  ADD COLUMN instagram text,
  ADD COLUMN facebook text,
  ADD COLUMN talla_polera text,
  ADD COLUMN contacto_emergencia_nombre text,
  ADD COLUMN contacto_emergencia_email text,
  ADD COLUMN contacto_emergencia_telefono text;
```

**Registro publico (`Register.tsx`):**
- Se agregan los campos al schema zod como opcionales
- Se organizan en secciones: Datos personales (existente), Datos adicionales (fecha nacimiento, comuna, instagram, facebook, talla polera, disponibilidad horaria), Datos academicos (universidad, carrera, semestre), Contacto de emergencia (nombre, email, celular)
- Se pasan como metadata en `signUp()`

**Trigger de base de datos:**
- El trigger `on_auth_user_created` existente crea el perfil con los metadata. Se debe actualizar para capturar los nuevos campos de metadata y guardarlos en las nuevas columnas de `profiles`

**Edge function `create-user`:**
- Agregar los nuevos campos a la interface `CreateUserRequest`
- Incluirlos en el `profileUpdate` que se hace despues de crear el usuario

**Formularios admin (UserCreateDialog, UserEditDialog, Profile):**
- Agregar campos de formulario organizados en la seccion correspondiente
- Ninguno de los nuevos campos es obligatorio
