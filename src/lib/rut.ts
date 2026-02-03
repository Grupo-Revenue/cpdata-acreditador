/**
 * Utilidades para validación y formateo de RUT chileno
 */

/**
 * Limpia un RUT de cualquier caracter no numérico (excepto K)
 */
export function cleanRUT(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Formatea un RUT con puntos y guión
 * Ej: 12345678K -> 12.345.678-K
 */
export function formatRUT(rut: string): string {
  const cleaned = cleanRUT(rut);
  
  if (cleaned.length < 2) return cleaned;
  
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Agregar puntos cada 3 dígitos desde la derecha
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedBody}-${dv}`;
}

/**
 * Calcula el dígito verificador de un RUT
 */
export function calculateDV(rutBody: string): string {
  const cleaned = rutBody.replace(/\D/g, '');
  
  let sum = 0;
  let multiplier = 2;
  
  // Recorrer dígitos de derecha a izquierda
  for (let i = cleaned.length - 1; i >= 0; i--) {
    sum += parseInt(cleaned[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = 11 - remainder;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

/**
 * Valida un RUT chileno completo (formato + dígito verificador)
 */
export function validateRUT(rut: string): { isValid: boolean; error?: string } {
  const cleaned = cleanRUT(rut);
  
  // Verificar longitud mínima
  if (cleaned.length < 2) {
    return { isValid: false, error: 'RUT demasiado corto' };
  }
  
  // Verificar longitud máxima (8 dígitos + 1 DV = 9)
  if (cleaned.length > 9) {
    return { isValid: false, error: 'RUT demasiado largo' };
  }
  
  // Separar cuerpo y dígito verificador
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Verificar que el cuerpo sean solo números
  if (!/^\d+$/.test(body)) {
    return { isValid: false, error: 'El RUT debe contener solo números' };
  }
  
  // Verificar que el DV sea válido (número o K)
  if (!/^[0-9K]$/.test(dv)) {
    return { isValid: false, error: 'Dígito verificador inválido' };
  }
  
  // Calcular y comparar DV
  const calculatedDV = calculateDV(body);
  
  if (dv !== calculatedDV) {
    return { isValid: false, error: 'RUT inválido' };
  }
  
  return { isValid: true };
}

/**
 * Hook-friendly: Valida y retorna mensaje de error o null
 */
export function getRUTError(rut: string): string | null {
  if (!rut || rut.trim() === '') {
    return 'El RUT es requerido';
  }
  
  const { isValid, error } = validateRUT(rut);
  return isValid ? null : error || 'RUT inválido';
}
