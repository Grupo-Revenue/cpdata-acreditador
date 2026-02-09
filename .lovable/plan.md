

## Plan: Guardar RUT con formato

### Problema
Al crear un usuario, el RUT se limpia con `cleanRUT()` antes de enviarlo a la edge function (linea 111 de `UserCreateDialog.tsx`), lo que elimina puntos y guion. El RUT se guarda como `12345678K` en vez de `12.345.678-K`.

### Solucion
Enviar el RUT formateado en lugar del limpio. El estado `rut` ya contiene el valor formateado gracias al componente `RUTInput`, asi que basta con enviarlo directamente.

### Cambio

**`src/components/users/UserCreateDialog.tsx`** (linea 111):
- Cambiar `rut: cleanRUT(rut)` por `rut: rut` (o simplemente `rut`)

Esto asegura que el RUT se almacene con formato `XX.XXX.XXX-X` en la base de datos.

### Nota sobre la edge function
La edge function `create-user` busca duplicados con `eq("rut", rut)`. Como los RUTs existentes podrian estar guardados sin formato, tambien se debe verificar la consistencia. Sin embargo, si el sistema es nuevo y todos los RUTs futuros se guardaran con formato, no se necesita cambio en la edge function.

