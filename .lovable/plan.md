
Objetivo: eliminar el 404 de Vercel al abrir el enlace de recuperación (`/auth/reset-password`) y dejar el flujo de cambio de contraseña estable.

Resumen de hallazgos:
- La ruta sí existe en la app (`/auth/reset-password` en `src/App.tsx`).
- El log de Supabase muestra `/verify` con `status=303` (token válido), redirigiendo a `https://cpdata-acreditador.vercel.app/auth/reset-password`.
- El error de la captura es 404 nativo de Vercel (no de React), así que el problema principal es de enrutado en hosting (deep link de SPA).

Plan de implementación:
1) Configurar fallback SPA en Vercel
- Crear `vercel.json` en la raíz con rewrite global a `index.html` para que rutas como `/auth/reset-password` no den 404 en refresh o acceso directo por email.

2) Mantener y revisar consistencia de URL de redirección en auth
- Conservar `redirectTo: ${window.location.origin}/auth/reset-password` (ya implementado y correcto para multi-entorno).
- Unificar este criterio en los dos puntos existentes:
  - `src/contexts/AuthContext.tsx` (recover público)
  - `src/pages/app/Profile.tsx` (recover desde perfil)
- (Opcional recomendado) extraer helper común para evitar desalineaciones futuras.

3) Verificación de configuración en Supabase (paso manual)
- Confirmar en Auth > URL Configuration que estén permitidas:
  - `https://cpdata-acreditador.vercel.app/**`
  - `https://id-preview--40d3fa8d-3023-41c0-95c7-35bd26852e37.lovable.app/**`
  - (y cualquier dominio final que uses en producción)

Pruebas E2E (obligatorias):
1. Desde `/auth/recover`, enviar correo de recuperación.
2. Abrir el link del correo.
3. Verificar que carga la pantalla “Restablecer contraseña” (sin 404 de Vercel).
4. Cambiar contraseña y confirmar navegación a login.
5. Iniciar sesión con la nueva contraseña.

Detalles técnicos:
- Causa raíz: app React con `BrowserRouter` desplegada como SPA en Vercel sin rewrite de deep links.
- Evidencia: Supabase procesa el token correctamente (`/verify` 303), fallo ocurre al aterrizar en ruta cliente en Vercel.
- Impacto esperado tras el fix: cualquier ruta cliente (`/auth/*`, `/app/*`) abrirá correctamente desde URL directa.
