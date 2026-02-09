

## Plan: Agregar campos adicionales al perfil de usuario

### Resumen
Agregar 6 nuevos campos a la tabla `profiles` (idioma, altura, universidad, carrera, y datos bancarios) y actualizar el formulario de creacion de usuario, el de edicion, y la pagina de perfil para incluirlos.

---

### 1. Migracion de base de datos

Agregar las siguientes columnas a la tabla `profiles`:

| Columna | Tipo | Nullable | Default | Descripcion |
|---------|------|----------|---------|-------------|
| idioma | text | Si | null | Idioma del usuario |
| altura | text | Si | null | Altura (ej: "1.75") |
| universidad | text | Si | null | Universidad |
| carrera | text | Si | null | Carrera universitaria |
| banco | text | Si | null | Nombre del banco |
| numero_cuenta | text | Si | null | Numero de cuenta bancaria |
| tipo_cuenta | text | Si | null | Corriente, Vista, Ahorro, Prepago |

Todos los campos son opcionales (nullable) para no romper usuarios existentes.

---

### 2. Actualizar `UserCreateDialog.tsx`

Agregar los nuevos campos al formulario de creacion, organizados en secciones claras:

- **Datos personales** (existentes): RUT, Email, Nombre, Apellido, Telefono, Referencia
- **Informacion adicional** (nuevos): Idioma (input texto), Altura (input texto), Universidad (input texto), Carrera (input texto)
- **Datos bancarios** (nuevos):
  - Banco: Select con los 12 bancos chilenos listados
  - Numero de cuenta: Input texto
  - Tipo de cuenta: Select con opciones Corriente, Vista, Ahorro, Prepago

Enviar los nuevos campos al body de la Edge Function `create-user`.

---

### 3. Actualizar Edge Function `create-user`

- Agregar los nuevos campos a la interfaz `CreateUserRequest`
- Incluirlos en `user_metadata` para que el trigger los capture, O bien hacer un update directo a `profiles` despues de la creacion (mas confiable)
- Se optara por hacer un `update` directo a profiles despues de la creacion, ya que modificar el trigger requiere acceso al SQL Editor manual

---

### 4. Actualizar `UserEditDialog.tsx`

Agregar los mismos campos al formulario de edicion para que los superadmins puedan modificarlos.

---

### 5. Actualizar `Profile.tsx` (pagina de perfil)

Agregar una nueva seccion "Informacion adicional" y "Datos bancarios" para que el usuario pueda ver y editar sus propios datos.

---

### 6. Actualizar `UserBulkUploadDialog.tsx`

Verificar si la carga masiva necesita soportar los nuevos campos (probablemente no obligatorio en esta fase).

---

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Crear: agregar 7 columnas a `profiles` |
| `supabase/functions/create-user/index.ts` | Modificar: aceptar y guardar nuevos campos |
| `src/components/users/UserCreateDialog.tsx` | Modificar: agregar campos al formulario |
| `src/components/users/UserEditDialog.tsx` | Modificar: agregar campos al formulario |
| `src/pages/app/Profile.tsx` | Modificar: agregar secciones de informacion adicional y datos bancarios |

