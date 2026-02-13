

## Persistir el Rol Activo en localStorage

### Problema

El rol activo (`activeRole`) se almacena unicamente en memoria con `useState`. Cuando Supabase refresca el token de autenticacion automaticamente (cada ~1 hora aprox.), se dispara `onAuthStateChange`, lo que re-ejecuta la carga de roles. Durante ese breve instante, el estado de roles puede quedar vacio y el sistema interpreta que el usuario no tiene rol seleccionado, forzandolo a volver a elegir uno.

### Solucion

Persistir el rol activo en `localStorage` y restaurarlo al iniciar la aplicacion o cuando se refresca el token. Ademas, evitar que el `onAuthStateChange` en eventos de tipo `TOKEN_REFRESHED` borre o interfiera con el rol activo ya seleccionado.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/contexts/AuthContext.tsx` | Persistir `activeRole` en localStorage, restaurarlo al iniciar, y proteger el rol durante refrescos de token |

### Detalle tecnico

1. **Inicializar `activeRole` desde localStorage:**
   - Al crear el estado, leer `localStorage.getItem('activeRole')` como valor inicial
   - Validar que el valor guardado sea un rol valido antes de usarlo

2. **Persistir cambios en localStorage:**
   - Crear un wrapper `setActiveRole` que ademas de actualizar el estado, guarde en `localStorage`
   - Al hacer `signOut`, limpiar el valor de localStorage

3. **Proteger durante TOKEN_REFRESHED:**
   - En el `onAuthStateChange`, cuando el evento sea `TOKEN_REFRESHED`, NO resetear el rol activo
   - Solo recargar perfil y roles en segundo plano sin afectar `activeRole`

4. **Validacion al restaurar:**
   - Despues de cargar los roles del usuario, verificar que el `activeRole` guardado en localStorage siga siendo valido (que el usuario aun tenga ese rol asignado)
   - Si el rol guardado ya no existe en los roles del usuario, limpiarlo

### Flujo corregido

```text
Inicio / Refresco de token
  |-- Leer activeRole de localStorage
  |-- Cargar roles desde base de datos
  |-- Validar que activeRole guardado exista en roles cargados
  |     |-- SI: mantener el rol (sin interrupcion)
  |     |-- NO: limpiar activeRole y redirigir a seleccion
  |-- Usuario continua trabajando sin interrupcion
```

