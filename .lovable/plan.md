
Problema real detectado

La descarga desde Supabase ya está funcionando. Lo confirma la red:
- se hace `GET /storage/v1/object/ticket-evidence/...`
- responde `200`
- devuelve el PDF correctamente

Así que el problema ya no es la URL antigua de Supabase ni el bucket. El bloqueo ahora ocurre después, cuando el código hace `window.open(blobUrl, '_blank')`. En el preview/sandbox eso intenta abrir una nueva página/documento y termina mostrando “La página está bloqueada”.

Plan de implementación

1. Dejar de usar `window.open` para evidencias
- Cambiar `src/lib/ticket-evidence.ts` para que ya no abra nada por su cuenta
- En vez de eso, que:
  - normalice la ruta
  - descargue el archivo
  - devuelva `blob`, `objectUrl`, `mimeType` y nombre estimado del archivo
- Mantener la compatibilidad con rutas simples y URLs legacy

2. Mostrar la evidencia dentro de la app
- Crear un visor reutilizable, por ejemplo `src/components/support/TicketEvidencePreviewDialog.tsx`
- Comportamiento:
  - PDF: mostrar con `<iframe>` o `<object>`
  - imagen: mostrar con `<img>`
  - Word/formatos no previsualizables: mostrar mensaje “este archivo no se puede visualizar aquí” + botón de descarga
- Esto evita navegar a otra página y elimina el bloqueo del preview

3. Actualizar los diálogos de soporte
- Reemplazar el flujo actual en:
  - `src/components/support/TicketDetailDialog.tsx`
  - `src/components/support/TicketEditDialog.tsx`
- Nuevo flujo:
  - al hacer clic en “Ver / Descargar” o “Ver evidencia de respuesta”
  - descargar el archivo con el helper
  - abrir el visor interno
  - ofrecer también botón “Descargar archivo”

4. Manejar limpieza y UX correctamente
- Revocar `URL.createObjectURL(...)` al cerrar el visor o cambiar de archivo
- Mostrar loading mientras se descarga la evidencia
- Mostrar toast si la descarga falla o si el archivo no existe

5. Corregir warning secundario en edición
- En `TicketEditDialog.tsx`, dejar de usar `Button asChild` con `<label>` porque eso está generando el warning de refs
- Cambiar ese bloque por un botón normal que dispare `inputRef.current?.click()`
- Aprovechar de agregar `DialogDescription` en los diálogos para eliminar el warning de accesibilidad

Resultado esperado
- Ya no aparecerá “La página está bloqueada”
- PDFs e imágenes se podrán ver dentro del sistema
- Archivos no previsualizables se podrán descargar sin romper el preview
- El módulo de soporte quedará consistente para tickets antiguos y nuevos

Archivos a tocar
- `src/lib/ticket-evidence.ts`
- `src/components/support/TicketDetailDialog.tsx`
- `src/components/support/TicketEditDialog.tsx`
- `src/components/support/TicketCreateDialog.tsx` (solo verificación, probablemente sin cambios)
- `src/components/support/TicketEvidencePreviewDialog.tsx` (nuevo)

Detalles técnicos
- No hace falta otra migración de base de datos para este bug puntual
- No hace falta cambiar el bucket
- El origen del error actual es la apertura de una nueva página desde el preview, no el acceso al archivo
- Seguiré reutilizando la normalización de rutas ya existente para soportar datos legacy
