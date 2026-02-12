

## Nueva seccion "Dia de Pago" en Configuracion

### Resumen

Agregar una seccion dentro de la pestana "General" de Configuracion que permita al superadmin seleccionar el dia de pago entre tres opciones fijas: dia 5, 15 o 25 del mes. El valor se almacenara en la tabla `settings` existente con la clave `payment_day`.

### Cambios

| Archivo / Recurso | Cambio |
|---|---|
| **Nuevo componente `src/components/settings/PaymentDaySettings.tsx`** | Componente con RadioGroup que muestra las 3 opciones, lee el valor actual de `settings` y lo actualiza al cambiar |
| **`src/pages/app/Settings.tsx`** | Importar y agregar `PaymentDaySettings` debajo de `RolesManager` en la pestana General |

No se necesita migracion SQL ya que la tabla `settings` es generica (key/value) y las politicas RLS ya permiten lectura a usuarios autenticados y escritura a superadmins.

### Detalle tecnico

**1. PaymentDaySettings.tsx**

- Usar `supabase` para consultar `settings` donde `key = 'payment_day'`
- Si no existe el registro, crearlo con valor por defecto `'5'`
- Mostrar un `Card` con titulo "Dia de Pago" y descripcion
- Usar `RadioGroup` con 3 opciones:
  - `5` - "Dia 5 del mes"
  - `15` - "Dia 15 del mes"  
  - `25` - "Dia 25 del mes"
- Al cambiar la seleccion, hacer `upsert` en la tabla `settings` con `key = 'payment_day'`
- Mostrar toast de confirmacion al guardar

**2. Settings.tsx** - Agregar en la pestana General:

```text
<TabsContent value="general" className="space-y-6">
  <PaymentDaySettings />
  <RolesManager />
</TabsContent>
```

