

## Plan: Corregir la visualizacion de asignaciones al reabrir el dialogo

### Problema

Hay una condicion de carrera entre dos `useEffect`:

1. **Reset al cerrar** (linea 154): limpia `selectedSupervisors` y `selectedAccreditors` cuando `open` pasa a `false`.
2. **Pre-seleccion** (linea 144): restaura las selecciones basandose en `existingAssignments`, `supervisors` y `accreditors`.

Cuando los datos estan en cache de React Query, al reabrir el dialogo los valores de `existingAssignments` no cambian, por lo que el efecto de pre-seleccion no se vuelve a ejecutar. Las selecciones quedan vacias.

### Solucion

Dos cambios en `src/components/events/EventTeamDialog.tsx`:

#### 1. Agregar `open` como dependencia del efecto de pre-seleccion

Cambiar el `useEffect` de la linea 144 para que tambien dependa de `open`, y solo ejecute cuando `open` sea `true`:

```typescript
useEffect(() => {
  if (!open) return;
  const supIds = new Set(supervisors.map(s => s.id));
  const accIds = new Set(accreditors.map(a => a.id));
  setSelectedSupervisors(new Set(existingAssignments.filter(id => supIds.has(id))));
  setSelectedAccreditors(new Set(existingAssignments.filter(id => accIds.has(id))));
}, [open, existingAssignments, supervisors, accreditors]);
```

Esto elimina la condicion `if (existingAssignments.length > 0)` para que tambien funcione correctamente cuando se deseleccionan todos los usuarios (caso de 0 asignaciones).

#### 2. Forzar refetch de asignaciones al abrir

Agregar `refetchOnMount: 'always'` al query de `existingAssignments` para que siempre traiga datos frescos al abrir:

```typescript
const { data: existingAssignments = [] } = useQuery({
  queryKey: ['event-assignments', dealId],
  queryFn: async () => { ... },
  enabled: open && !!dealId,
  refetchOnMount: 'always',
});
```

### Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/components/events/EventTeamDialog.tsx` | Corregir efecto de pre-seleccion y forzar refetch |

No se requieren cambios en base de datos.

