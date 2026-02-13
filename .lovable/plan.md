

## Hacer el boton de Preguntas Frecuentes mas llamativo

### Resumen

Reemplazar el boton simple `outline` de FAQs por una Card completa y visualmente atractiva que ocupe el espacio al lado del ranking, con gradiente, icono grande, titulo destacado y descripcion, para que los acreditadores lo noten facilmente.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/pages/dashboard/AcreditadorDashboard.tsx` | Reemplazar el `Button` de FAQs por una Card con gradiente primario, icono grande, texto descriptivo y efecto hover |

### Detalle tecnico

Reemplazar el bloque actual (lineas 136-141) que contiene un simple `Button variant="outline"` por una Card interactiva con:

- Fondo con gradiente primario (`gradient-primary`) y texto blanco
- Icono `HelpCircle` grande (w-12 h-12) centrado
- Titulo "Preguntas Frecuentes" en texto grande y bold
- Subtitulo descriptivo: "Revisa las respuestas a las dudas mas comunes"
- Cursor pointer y efecto `hover-lift` para indicar que es clickeable
- Animacion `animate-fade-in-up` consistente con el resto del dashboard
- `onClick` que abre el `FaqDialog` existente

La Card ocupara la columna derecha del grid de 2 columnas junto al `RankingTable`, dandole presencia visual equivalente.

