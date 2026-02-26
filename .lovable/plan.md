

## Fix: Badge de estado desactualizado en Gestión de Evento

### Problema
El query `event-accreditors-mgmt` usa caché de React Query y no refresca al reabrir el diálogo, mostrando `contract_status` antiguo (ej: "pendiente" cuando ya es "firmado").

### Cambio en `src/components/events/EventManagementDialog.tsx`

Agregar `refetchOnMount: 'always'` y `staleTime: 0` al query de acreditadores (líneas 87-89) para forzar datos frescos cada vez que se abre el diálogo:

```typescript
const { data: accreditors } = useQuery({
  queryKey: ['event-accreditors-mgmt', eventId],
  enabled: !!eventId,
  refetchOnMount: 'always',
  staleTime: 0,
  queryFn: async () => { ... },
});
```

