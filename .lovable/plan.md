

## Corregir scroll del contrato y variable HORARIO

### Problema 1: Texto cortado sin scroll

El `ScrollArea` dentro del dialogo tiene alturas fijas (`h-[300px]` y `h-[350px]`) pero el `DialogContent` con `max-h-[90vh]` y `flex flex-col` puede no estar permitiendo que el ScrollArea funcione correctamente. El `overflow-hidden` del DialogContent de shadcn/ui esta cortando el contenido.

### Solucion 1

- Agregar `overflow-y-auto` al contenedor interno del dialogo para que el contenido completo sea scrolleable
- Cambiar el ScrollArea para usar una altura que se adapte mejor al espacio disponible

### Problema 2: HORARIO vacio

En `DigitalSignatureDialog.tsx` linea 86, la variable `HORARIO` esta hardcodeada como string vacio `''`. El horario del evento (`hora_de_inicio_y_fin_del_evento`) es un dato de HubSpot que esta disponible en el deal pero no se pasa al dialogo.

### Solucion 2

Pasar el horario como prop desde `EventsUserTable` y `EventsAdminTable` al `DigitalSignatureDialog`, ya que esos componentes ya tienen acceso al dato `hora_de_inicio_y_fin_del_evento` del deal de HubSpot.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/events/DigitalSignatureDialog.tsx` | Agregar prop `horario?: string`, usarla para la variable HORARIO. Cambiar el layout del dialogo para que el scroll funcione correctamente con `overflow-y-auto` en el contenedor interno |
| `src/components/events/EventsUserTable.tsx` | Pasar `horario={signatureDeal?.hora_de_inicio_y_fin_del_evento}` al DigitalSignatureDialog |
| `src/components/events/EventsAdminTable.tsx` | Pasar el horario al DigitalSignatureDialog si aplica, y usar el horario en las descargas masivas de contratos |

### Detalle tecnico

**Prop horario:**
```typescript
interface DigitalSignatureDialogProps {
  // ... existentes
  horario?: string; // nuevo
}
```

En la construccion de variables (linea 86):
```typescript
HORARIO: horario || '',
```

**Scroll fix:**
Reemplazar la estructura del dialogo para que el contenido sea scrolleable. Cambiar `overflow-hidden` por un contenedor con `overflow-y-auto` y asegurar que el `flex-1 min-h-0` permita al ScrollArea ocupar el espacio disponible.
