

## Plan: Monto por persona al asignar equipo + mostrar en tabla de eventos

### Problema actual
El `payment_amount` solo se puede asignar al aceptar un postulante. Se necesita poder asignarlo al momento de armar el equipo, y que ese monto sea visible en la tabla de eventos de acreditadores/supervisores.

### Cambios

#### 1. `src/components/events/EventTeamDialog.tsx`
- **Cambiar la estructura de seleccion**: En lugar de `Map<string, string | null>` (userId -> shift), usar `Map<string, { shift: string | null; amount: number | null }>` para almacenar turno y monto por cada usuario seleccionado.
- **Agregar columna "Monto"** en ambas tablas (supervisores y acreditadores): un `Input` de tipo number que aparece cuando el usuario esta seleccionado, al lado del selector de turno.
- **Actualizar `handleSave`**: incluir `payment_amount` en el upsert a `event_accreditors` y usar ese monto al crear las boletas en `invoices`.
- **Cargar montos existentes**: al abrir el dialogo, precargar los montos de asignaciones existentes desde `event_accreditors.payment_amount`.

#### 2. `src/components/events/EventsUserTable.tsx`
- **Agregar columna "Monto"** a la tabla.
- **Extender la query** de `event_accreditors` (linea 62-65) para incluir `payment_amount`.
- **Mostrar el monto** formateado como moneda chilena (ej: `$50.000`) en cada fila.
- **Agregar filtro** de monto en la barra de filtros.

### Diseno visual (tabla de equipo)
```text
 [x] Nombre    RUT       Tel    Estatura  Idioma  Ranking  Turno    Monto
 [x] Juan P.   12.345..  +56..  175 cm    ES      5        [Full]   [$30000]
```

### Archivos a modificar
- `src/components/events/EventTeamDialog.tsx`
- `src/components/events/EventsUserTable.tsx`

