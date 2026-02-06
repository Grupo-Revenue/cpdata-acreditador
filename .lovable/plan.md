

## Plan: Iconos Únicos para Accesos Rápidos

### Problema Identificado
Los botones de accesos rápidos usan iconos repetidos:
- **Cotización**: `FileText` (correcto)
- **Trello**: `ExternalLink` (repetido)
- **Hubspot**: `ExternalLink` (repetido)

Además, el indicador de enlace externo también usa `ExternalLink`, creando confusión visual.

---

### Solución

Asignar iconos únicos y representativos para cada servicio:

| Botón | Icono Actual | Icono Nuevo | Razón |
|-------|-------------|-------------|-------|
| Cotización | `FileText` | `FileText` | Mantener (representa documentos) |
| Trello | `ExternalLink` | `Trello` o `LayoutGrid` | Representa tableros/organización |
| Hubspot | `ExternalLink` | `MessageCircle` o `Users` | Representa CRM/comunicación |

---

### Iconos Propuestos

**Opción recomendada usando iconos de Lucide disponibles:**

- **Cotización**: `FileText` - documento de cotización
- **Trello**: `LayoutGrid` - representa los tableros de Trello
- **Hubspot**: `MessageCircle` - representa CRM y comunicación con clientes

---

### Cambios Técnicos

**Archivo**: `src/pages/dashboard/SuperadminDashboard.tsx`

1. Importar iconos adicionales: `LayoutGrid`, `MessageCircle`
2. Actualizar el array `quickLinks`:

```text
quickLinks = [
  { label: 'Cotización', icon: FileText, ... },
  { label: 'Trello', icon: LayoutGrid, ... },
  { label: 'Hubspot', icon: MessageCircle, ... },
]
```

El indicador de enlace externo (flecha pequeña a la derecha) seguirá usando `ExternalLink` ya que cumple una función diferente: indicar que el enlace abre en nueva pestaña.

