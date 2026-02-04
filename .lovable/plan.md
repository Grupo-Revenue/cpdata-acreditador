
## Plan: Corregir Usuario con Datos Faltantes

### Problema Identificado

El usuario `test@test.cl` **SÍ existe** en la tabla `profiles`, pero tiene los campos `nombre`, `apellido` y `rut` **vacíos**:

| Campo | Valor actual |
|-------|-------------|
| email | test@test.cl |
| nombre | (vacío) |
| apellido | (vacío) |
| rut | (vacío) |
| approval_status | approved |
| is_active | true |

Esto ocurrió porque el usuario fue registrado antes de que el sistema de metadatos funcionara correctamente con el trigger.

---

### Solución en 2 Partes

#### Parte 1: Actualizar datos del usuario existente (SQL)

Ejecutar una actualización manual para agregar los datos que debería tener:

```sql
UPDATE profiles 
SET 
  nombre = 'Test',
  apellido = 'Usuario',
  rut = '12.345.678-9'
WHERE email = 'test@test.cl';
```

O puedes usar el diálogo de edición que ya implementamos para actualizar sus datos desde la interfaz.

---

#### Parte 2: Mejorar la tabla para manejar datos vacíos

Modificar `UsersTable.tsx` para mostrar el email cuando el nombre está vacío, evitando filas "invisibles":

**Cambio en la columna Nombre:**
```tsx
<TableCell className="font-medium">
  {user.nombre || user.apellido 
    ? `${user.nombre} ${user.apellido}`.trim()
    : <span className="text-muted-foreground italic">{user.email}</span>
  }
  {!user.is_active && (
    <Badge variant="secondary" className="ml-2">Inactivo</Badge>
  )}
</TableCell>
```

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/users/UsersTable.tsx` | Mostrar email cuando nombre está vacío |

### Acción Opcional

Ejecutar SQL para corregir los datos del usuario test@test.cl
