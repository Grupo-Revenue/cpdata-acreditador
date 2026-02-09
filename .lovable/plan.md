

## Plan: Mostrar etapa del deal como badge con colores

### Objetivo
Reemplazar el texto plano de la columna "Etapa" en la tabla de eventos por un badge/tag con colores para que sea visualmente mas destacado.

### Cambios

**Archivo: `src/pages/app/Events.tsx`**

- Importar el componente `Badge` existente
- Reemplazar la celda de texto plano de `dealstage` por un Badge con colores asignados dinamicamente
- Crear un mapeo de colores para las etapas conocidas del pipeline, usando las clases de Tailwind ya existentes en el proyecto (similar al patron de `StatusBadge`)
- Para etapas no mapeadas, usar un color neutral por defecto

### Logica de colores

Se creara una funcion auxiliar `getStageBadgeClass` dentro del archivo que retorne clases de Tailwind segun el nombre del label de la etapa. Ejemplo de esquema:

| Etapa | Estilo |
|-------|--------|
| Etapa activa / en progreso | `bg-primary/10 text-primary border-primary/20` |
| Etapa completada / ganada | `bg-success/10 text-success border-success/20` |
| Etapa pendiente | `bg-warning/10 text-warning border-warning/20` |
| Otras etapas | `bg-muted text-muted-foreground border-muted` |

Como los nombres exactos de las etapas provienen de HubSpot y pueden variar, se usara un mapeo flexible que asigne colores basandose en palabras clave del label (por ejemplo, si contiene "ganado" o "cerrado" se muestra en verde).

### Detalle tecnico

En la celda de la tabla, se reemplazara:
```
<TableCell>{deal.dealstage ?? '—'}</TableCell>
```
Por:
```
<TableCell>
  {deal.dealstage ? (
    <Badge variant="outline" className={getStageBadgeClass(deal.dealstage)}>
      {deal.dealstage}
    </Badge>
  ) : '—'}
</TableCell>
```

Solo se modifica un archivo: `src/pages/app/Events.tsx`.

