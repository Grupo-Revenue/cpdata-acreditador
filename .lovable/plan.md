

## Soporte para multiples idiomas por usuario

### Resumen

Cambiar el campo "Idioma" de un input de texto simple a un sistema de etiquetas (tags/chips) que permita agregar multiples idiomas. No se requieren cambios en la base de datos ya que el campo `idioma` (tipo `text`) almacenara los valores separados por coma (ej: `"Español, Inglés, Portugués"`).

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/app/Profile.tsx` | Reemplazar input de idioma por componente de tags con input + boton agregar |
| `src/components/users/UserCreateDialog.tsx` | Mismo cambio: input de tags para idioma |
| `src/components/users/UserEditDialog.tsx` | Mismo cambio: input de tags para idioma |
| `src/components/events/ApplicantProfileDialog.tsx` | Mostrar idiomas como badges individuales en vez de texto plano |

### Detalle tecnico

**Formato de almacenamiento:** Se mantiene el campo `idioma` como `text` en la tabla `profiles`. Los multiples idiomas se almacenan separados por coma: `"Español, Inglés, Portugués"`. Esto evita migraciones de base de datos.

**Componente de entrada (en Profile, UserCreate, UserEdit):**
- Un input de texto con un boton "Agregar" al lado
- Al presionar Enter o clic en "Agregar", el idioma se anade como un chip/badge debajo del input
- Cada chip tiene una "X" para eliminarlo
- Al guardar, los idiomas se unen con coma y se almacenan como texto
- Al cargar, el texto se separa por coma para mostrar los chips existentes

**Visualizacion (ApplicantProfileDialog):**
- En vez de mostrar el texto plano, separar por coma y renderizar cada idioma como un `Badge` individual

### Flujo de interaccion

```text
Usuario escribe "Inglés" en el input
  |-- Presiona Enter o clic en "Agregar"
  |-- Aparece chip [Inglés x]
  |-- Escribe "Portugués" y agrega
  |-- Chips: [Inglés x] [Portugués x]
  |-- Al guardar: se almacena "Inglés, Portugués" en DB
```

### Notas
- No se requiere migracion de base de datos
- Los datos existentes (un solo idioma) siguen siendo compatibles ya que al separar por coma se obtiene un arreglo con un solo elemento
- La edge function `create-user` no necesita cambios ya que recibe el campo como texto
