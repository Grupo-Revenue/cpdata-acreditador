
Problema detectado: el código nuevo ya guarda rutas internas, pero todavía existen tickets antiguos con URLs completas de Supabase en `support_tickets`. En `TicketDetailDialog` y `TicketEditDialog`, si el valor empieza con `http`, el código hace `window.open(...)` directo. Eso sigue enviando al usuario a `wodzysrgdsforiuliejo.supabase.co`, que es justo lo que aparece bloqueado en el preview.

Plan

1. Centralizar la lógica de evidencia
- Crear un helper compartido (por ejemplo `src/lib/ticket-evidence.ts`) para:
  - detectar si el valor es una ruta simple o una URL legacy del bucket `ticket-evidence`
  - extraer la ruta real cuando venga como URL de Supabase
  - conservar fallback solo para URLs externas reales

2. Dejar de abrir Supabase directamente
- Reemplazar el flujo actual en:
  - `src/components/support/TicketDetailDialog.tsx`
  - `src/components/support/TicketEditDialog.tsx`
- Nuevo comportamiento:
  - normalizar el valor a ruta de Storage
  - obtener el archivo desde Supabase
  - abrirlo mediante `blob:` URL o descarga controlada
- Con esto evitamos navegar directamente a `supabase.co`, que es lo que hoy se bloquea

3. Mantener creación y edición consistentes
- Verificar que:
  - `TicketCreateDialog.tsx` siga guardando solo `filePath`
  - `TicketEditDialog.tsx` siga guardando solo `filePath`
- No hace falta cambiar el esquema de la tabla

4. Normalizar datos antiguos
- Agregar una migración de datos para convertir valores legacy en `evidence_url` y `response_evidence_url` desde URL pública completa a ruta interna del bucket
- Así los tickets existentes también quedarán compatibles y no dependerán del fallback viejo

Resultado esperado
- Los adjuntos antiguos y nuevos se abrirán correctamente
- Desaparecerá el mensaje “La página ... está bloqueada”
- El flujo quedará unificado para todo el módulo de soporte

Archivos a tocar
- `src/components/support/TicketDetailDialog.tsx`
- `src/components/support/TicketEditDialog.tsx`
- `src/components/support/TicketCreateDialog.tsx`
- `src/lib/ticket-evidence.ts`
- `supabase/migrations/*`
