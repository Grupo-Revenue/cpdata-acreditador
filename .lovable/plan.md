

## Plan: Arreglar el Loading Infinito en Login

### Problema Identificado

El `AuthContext` tiene una **race condition** (condición de carrera) entre:
1. La inicialización manual (`initializeAuth` con `getSession()`)  
2. El listener `onAuthStateChange` (que Supabase dispara automáticamente)

Esto causa que `isLoading` quede en `true` indefinidamente en ciertos casos, especialmente cuando no hay sesión activa.

### Causa Raíz

El flujo actual tiene estos problemas:

1. **Doble ejecución**: Cuando no hay sesión, `onAuthStateChange` se dispara con `newSession = null`, pero no siempre llega a `setIsLoading(false)` antes de que otros componentes evalúen el estado.

2. **Deadlock potencial**: Si `loadUserData()` falla silenciosamente o tarda demasiado, `isLoading` nunca se vuelve `false`.

3. **Orden incorrecto**: Según la documentación de Supabase, el listener debe configurarse **antes** de `getSession()`, pero las operaciones async dentro del callback pueden causar problemas.

### Solución Propuesta

Refactorizar el `useEffect` en `AuthContext.tsx` con un patrón más robusto:

1. **Separar responsabilidades**: 
   - El listener solo actualiza estado sincronizado (session, user)
   - Una función aparte carga datos adicionales (profile, roles)
   - Loading se maneja de forma explícita

2. **Usar `setTimeout(..., 0)`** en el callback de `onAuthStateChange` para evitar deadlocks (patrón recomendado por Supabase)

3. **Garantizar que `isLoading = false`** siempre se ejecute, incluso si hay errores

### Código del Cambio

```typescript
useEffect(() => {
  let isMounted = true;

  const loadUserData = async (userId: string) => {
    await Promise.all([fetchProfile(userId), fetchRoles(userId)]);
  };

  // Configurar listener PRIMERO (recomendación de Supabase)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, newSession) => {
      if (!isMounted) return;

      // Actualizar estado de sesión de forma síncrona
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
        return;
      }

      // Para otros eventos, cargar datos en setTimeout para evitar deadlock
      if (newSession?.user) {
        setTimeout(async () => {
          if (!isMounted) return;
          await loadUserData(newSession.user.id);
          if (isMounted) setIsLoading(false);
        }, 0);
      } else {
        // No hay usuario - ya podemos dejar de cargar
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
      }
    }
  );

  // Luego hacer la carga inicial
  const initializeAuth = async () => {
    try {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!isMounted) return;

      // Si no hay sesión, marcar como no loading inmediatamente
      if (!initialSession?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
        return;
      }

      // Si hay sesión, el onAuthStateChange ya la manejará
      // pero por seguridad también la procesamos aquí
      setSession(initialSession);
      setUser(initialSession.user);
      await loadUserData(initialSession.user.id);
    } catch (error) {
      console.error('Error initializing auth:', error);
      // En caso de error, igual dejar de cargar para no quedar atascados
      setProfile(null);
      setRoles([]);
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

### Cambios Clave

| Antes | Después |
|-------|---------|
| `onAuthStateChange` hace `await` directamente | Usa `setTimeout(..., 0)` para async |
| No hay manejo explícito del caso "sin sesión" | Se marca `isLoading = false` inmediatamente si no hay usuario |
| `finally` puede competir con el listener | El flujo es más predecible |
| Errores pueden dejar loading infinito | Try/catch con fallback a `isLoading = false` |

### Archivo a Modificar

- `src/contexts/AuthContext.tsx` (líneas 113-167)

### Resultado Esperado

1. Si **no hay sesión**: El login se muestra inmediatamente (sin loading infinito)
2. Si **hay sesión**: Se carga el perfil y roles, luego se redirige al dashboard
3. **Sin race conditions**: El flujo es determinístico y no depende del orden de eventos

