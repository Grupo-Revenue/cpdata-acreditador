
# Plan: Eliminar el Flash de "Cuenta Pendiente" para Usuarios Aprobados

## Problema Raíz

El `AuthContext` marca `isLoading = false` **antes** de que el perfil y roles terminen de cargarse. Esto causa que el `ProtectedRoute` vea:
- `user` ✓ (existe)
- `isLoading` = `false`
- `profile` = `null` → `isApproved` = `false`

Como resultado, redirige incorrectamente a `/auth/pending` hasta que el perfil finalmente llega.

## Solución

Modificar el `AuthContext` para que `isLoading` permanezca en `true` hasta que **tanto la sesión como el perfil** estén completamente cargados. Esto asegura que las decisiones de redirección se tomen con información completa.

---

## Cambios a Realizar

### Archivo: `src/contexts/AuthContext.tsx`

**Cambio principal:** No establecer `isLoading = false` hasta que el perfil y los roles hayan sido cargados.

```text
Antes:
1. getSession() → setUser() → setIsLoading(false)
2. fetchProfile() y fetchRoles() se ejecutan después (async, sin await)
3. ProtectedRoute ve isLoading=false + profile=null → redirige a /auth/pending

Después:
1. getSession() → setUser()
2. await fetchProfile() y await fetchRoles()
3. setIsLoading(false) ← solo después de tener todo
4. ProtectedRoute ve isLoading=false + profile completo → va directo al dashboard
```

**Cambios específicos:**

1. **Modificar la inicialización** (líneas 140-151):
   - Usar `await` para esperar que `fetchProfile()` y `fetchRoles()` terminen
   - Solo entonces hacer `setIsLoading(false)`

2. **Modificar el listener `onAuthStateChange`** (líneas 115-138):
   - Para el evento `SIGNED_IN`, esperar que el perfil y roles carguen antes de marcar loading como completo
   - Mantener el `setTimeout` pero asegurar la secuencia correcta

---

## Flujo Esperado Después del Cambio

```text
Usuario inicia sesión
    ↓
AuthContext: isLoading = true
    ↓
Se obtiene sesión y usuario
    ↓
Se carga perfil (approval_status, is_active)
    ↓
Se cargan roles
    ↓
isLoading = false
    ↓
ProtectedRoute evalúa con datos completos
    ↓
Si approved + active → Dashboard directo
Si pending → /auth/pending
```

---

## Detalles Técnicos

### Modificación del useEffect en AuthContext

```typescript
useEffect(() => {
  let isMounted = true;

  const loadUserData = async (userId: string) => {
    await Promise.all([fetchProfile(userId), fetchRoles(userId)]);
  };

  // Listener para cambios de auth
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, newSession) => {
      if (!isMounted) return;
      
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadUserData(newSession.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setRoles([]);
      }

      if (isMounted) setIsLoading(false);
    }
  );

  // Carga inicial
  const initializeAuth = async () => {
    try {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!isMounted) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        await loadUserData(initialSession.user.id);
      }
    } finally {
      if (isMounted) setIsLoading(false);
    }
  };

  initializeAuth();

  return () => {
    isMounted = false;
    subscription.unsubscribe();
  };
}, []);
```

---

## Beneficios

1. **Sin flash de /auth/pending** - El usuario aprobado va directo al dashboard
2. **Decisiones correctas** - El `ProtectedRoute` siempre tiene datos completos
3. **Mejor UX** - Se muestra "Verificando sesión..." durante la carga completa
4. **Código más robusto** - Maneja correctamente las race conditions

---

## Verificación

Después del cambio:
1. Iniciar sesión con usuario aprobado → debe ir **directo** al dashboard sin ver /auth/pending
2. Iniciar sesión con usuario pendiente → debe ir a /auth/pending
3. Refrescar la página estando logueado → debe mantenerse en el dashboard sin flash
