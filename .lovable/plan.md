
## Plan: Hacer el Teléfono Obligatorio en el Registro

### Cambios Necesarios

**Archivo:** `src/pages/auth/Register.tsx`

Se requieren 2 modificaciones simples:

---

### 1. Actualizar el Schema de Validación (línea 23)

**Antes:**
```typescript
telefono: z.string().optional(),
```

**Después:**
```typescript
telefono: z.string().min(1, 'El teléfono es requerido'),
```

Esto asegura que:
- El campo no puede estar vacío
- Se muestra un mensaje de error claro si el usuario no lo completa

---

### 2. Actualizar la Etiqueta del Campo (línea 164)

**Antes:**
```typescript
<FormLabel>Teléfono (opcional)</FormLabel>
```

**Después:**
```typescript
<FormLabel>Teléfono</FormLabel>
```

Esto elimina la indicación "(opcional)" para reflejar que ahora es obligatorio.

---

### Resultado

| Campo | Estado Actual | Estado Nuevo |
|-------|---------------|--------------|
| Teléfono | Opcional | **Obligatorio** |
| Mensaje de error | N/A | "El teléfono es requerido" |

El formulario no permitirá enviar el registro si el campo de teléfono está vacío, mostrando el mensaje de validación correspondiente.
