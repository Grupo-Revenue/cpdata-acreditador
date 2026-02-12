

## Separar evidencia de creador y responsable en tickets de soporte

### Problema

Actualmente existe un solo campo `evidence_url` que se usa tanto para la evidencia del creador (supervisor/acreditador) como para la del responsable (admin/superadmin). Esto causa que si el admin sube evidencia, sobreescribe la del creador y viceversa. Ademas, ambas partes necesitan poder ver/descargar los archivos de la otra.

### Solucion

Agregar un nuevo campo `response_evidence_url` para la evidencia del responsable, manteniendo `evidence_url` como la evidencia del creador.

### Cambios

| Archivo / Recurso | Cambio |
|---|---|
| **Migracion SQL** | Agregar columna `response_evidence_url TEXT` a `support_tickets` |
| **TicketCreateDialog.tsx** | Sin cambios - ya usa `evidence_url` correctamente para la evidencia del creador |
| **TicketEditDialog.tsx** | Separar la seccion de evidencia en dos: mostrar la evidencia del creador (solo lectura, con link para ver/descargar) y un campo de subida para la evidencia de respuesta (`response_evidence_url`) |
| **TicketDetailDialog.tsx** | Mostrar ambas evidencias por separado: "Evidencia del creador" y "Evidencia de respuesta", cada una con su boton de ver/descargar |
| **TicketsTable.tsx** | Sin cambios necesarios |

### Detalle tecnico

**1. Migracion SQL:**

```text
ALTER TABLE support_tickets
ADD COLUMN response_evidence_url TEXT;
```

**2. TicketEditDialog.tsx** - Separar evidencias:

- Mostrar la evidencia del creador (`evidence_url`) como un link de solo lectura con boton "Ver/Descargar"
- Agregar un campo de subida separado para la evidencia de respuesta del responsable
- Al subir archivo, guardar la URL en `response_evidence_url` en lugar de `evidence_url`
- En el `handleSubmit`, enviar `response_evidence_url` en el update y no sobreescribir `evidence_url`

**3. TicketDetailDialog.tsx** - Mostrar ambas evidencias:

- Seccion "Evidencia del creador" con link a `evidence_url` (si existe)
- Seccion "Evidencia de respuesta" con link a `response_evidence_url` (si existe)
- Ambos links abren el archivo en nueva pestana para ver/descargar

**4. TicketCreateDialog.tsx** - Sin cambios, sigue usando `evidence_url` para la evidencia que sube el creador.

Con esto, supervisores y acreditadores podran ver la evidencia de respuesta del admin al consultar el detalle del ticket, y los admins podran ver la evidencia original del creador al editar el ticket.
