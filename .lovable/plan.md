

## Agregar pestaña "FAQs" en Configuración

### Resumen

Mover el componente `FaqSettings` de la pestaña "General" a su propia pestaña dedicada llamada "FAQs" en la página de Configuración.

### Cambio

| Archivo | Cambio |
|---|---|
| `src/pages/app/Settings.tsx` | Eliminar `<FaqSettings />` del TabsContent "general" y agregar un nuevo `TabsTrigger` "FAQs" con su propio `TabsContent` que contenga `<FaqSettings />` |

### Detalle tecnico

En `Settings.tsx`:
1. Agregar `<TabsTrigger value="faqs">FAQs</TabsTrigger>` al `TabsList` (despues de "Plantillas WhatsApp")
2. Eliminar `<FaqSettings />` del `TabsContent value="general"`
3. Agregar un nuevo `<TabsContent value="faqs"><FaqSettings /></TabsContent>` al final

El import de `FaqSettings` ya existe, no se requieren cambios adicionales.
