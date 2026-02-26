

## Problema

El diálogo de Postulantes muestra datos en caché de la sesión anterior. React Query sirve la data antigua (stale) al reabrir el diálogo, por lo que un registro aceptado previamente sigue mostrando "Pendiente".

## Solución

En `src/components/events/EventApplicantsDialog.tsx`, agregar `refetchOnMount: 'always'` al query principal `['event-applicants']` para forzar un refetch cada vez que el diálogo se abre, en lugar de servir datos del caché.

### Cambio

Línea ~86-96: agregar `refetchOnMount: 'always'` y opcionalmente `staleTime: 0` al query de `event_accreditors`:

```typescript
const { data: rawData, isLoading } = useQuery({
  queryKey: ['event-applicants'],
  enabled: open,
  refetchOnMount: 'always',
  staleTime: 0,
  queryFn: async () => { ... },
});
```

Esto garantiza que cada vez que se abra el diálogo, se obtengan los datos frescos de la base de datos.

