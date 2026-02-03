
## Objetivo
Arreglar el bloqueo percibido en `/auth/pending` haciendo que:
1) **“Verificar estado”** realmente compruebe el perfil y, si ya está aprobado, **redirija automáticamente al dashboard**.  
2) **“Cerrar sesión”** cierre sesión y **redirija al login**, para que el usuario vea un cambio inmediato (y no parezca “bloqueado”).  
3) Se muestre **feedback** (loading/toast) cuando se presionan botones, y mensajes claros si hay error.

## Diagnóstico (qué está pasando ahora)
- En base de datos tu usuario `gabriel@revopslatam.com` ya está **approved** y **active**.
- Pero la pantalla `/auth/pending`:
  - No tiene lógica para **redirigir** cuando el estado cambia a “approved”.
  - `refreshProfile()` sí puede refrescar el estado, pero **aunque cambie**, la pantalla se queda ahí.
  - `signOut()` cierra la sesión, pero `/auth/pending` **no redirige** al login si ya no hay usuario, entonces “parece que no hace nada”.
- Además, no hay indicador visual (spinner/toast) que confirme que el click se procesó.

## Cambios propuestos (frontend)

### 1) Mejorar `src/pages/auth/Pending.tsx`
**Agregar:**
- `useNavigate` de `react-router-dom`
- `useEffect` para redirecciones automáticas:
  - Si **no hay `user`** → navegar a `/auth/login`
  - Si **`isApproved && isActive`** → navegar a `/app/dashboard` (esto activará `DashboardRedirect` y te llevará al dashboard correcto según roles)
- Estado local para UX:
  - `isChecking` para “Verificar estado”
  - `isSigningOut` para “Cerrar sesión”
- Toasts para feedback (usando `useToast()`):
  - Si sigue pendiente: “Tu cuenta aún no está aprobada”
  - Si hubo error de red/RLS/etc.: toast `destructive`
- Asegurar que ambos botones tengan `type="button"` (evita comportamientos raros si algún día quedan dentro de un `<form>`).

**Resultado esperado:**
- Apenas tu perfil se refresque y ya esté approved, la pantalla “Pending” te sacará automáticamente hacia el dashboard.
- Al cerrar sesión, siempre vuelves al login.

### 2) (Opcional pero recomendado) Robustecer `refreshProfile()` en `src/contexts/AuthContext.tsx`
Ahora `refreshProfile()` solo hace algo si `user` existe en estado React. En algunas carreras de carga (cuando la app aún está inicializando sesión), puede no hacer nada.

**Mejora propuesta:**
- Si `user` es `null`, intentar obtener el usuario desde `supabase.auth.getSession()` y, si existe, refrescar usando ese `userId`.
- (Sin cambiar modelo de roles; roles siguen en `user_roles` como corresponde.)

Esto hace que “Verificar estado” sea más confiable incluso en situaciones donde el estado aún no terminó de hidratarse.

## Consideraciones / casos borde
- Si por alguna razón `profiles` devuelve `null` (perfil no creado o RLS bloqueando), mostraremos un toast claro indicando que no se pudo leer el perfil.
- Si el usuario está `approved` pero `is_active = false`, se mantiene en pending (pero con un mensaje más claro si lo quieres, podemos ajustarlo).

## Plan de pruebas (end-to-end)
1) Iniciar sesión con el usuario `gabriel@revopslatam.com`.
2) Entrar a `/auth/pending`:
   - Debe **redirigir solo** a `/app/dashboard` si ya está approved/active.
3) Si forzamos un usuario realmente pendiente:
   - “Verificar estado” debe mostrar loading y luego:
     - seguir en pending con toast informativo, o
     - redirigir al dashboard si ya fue aprobado.
4) “Cerrar sesión” debe:
   - cerrar sesión en Supabase
   - redirigir a `/auth/login`
   - impedir que al volver a `/auth/pending` se vea información de perfil.

## Archivos a tocar
- `src/pages/auth/Pending.tsx` (principal)
- `src/contexts/AuthContext.tsx` (opcional/recomendado para robustez)

