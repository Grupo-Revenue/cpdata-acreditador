import { validateRUT, cleanRUT, formatRUT } from './rut';

export interface CSVUserRow {
  rowNumber: number;
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
  email: string;
  isValid: boolean;
  errors: string[];
}

export interface CSVParseResult {
  rows: CSVUserRow[];
  validCount: number;
  errorCount: number;
}

/**
 * Detecta el separador del CSV (coma o punto y coma)
 */
function detectSeparator(line: string): string {
  const semicolonCount = (line.match(/;/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Parsea una línea de CSV respetando comillas
 */
function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Valida un email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normaliza encabezados removiendo acentos y espacios
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

/**
 * Mapea encabezados del CSV a campos esperados
 */
function mapHeaders(headers: string[]): Map<string, number> {
  const headerMap = new Map<string, number>();
  const expectedFields = ['nombre', 'apellido', 'rut', 'telefono', 'email'];
  
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    
    // Mapeo directo
    if (expectedFields.includes(normalized)) {
      headerMap.set(normalized, index);
    }
    // Mapeos alternativos
    else if (['mail', 'correo', 'correo_electronico', 'e-mail'].includes(normalized)) {
      headerMap.set('email', index);
    } else if (['tel', 'fono', 'celular', 'movil', 'phone'].includes(normalized)) {
      headerMap.set('telefono', index);
    } else if (['first_name', 'primer_nombre'].includes(normalized)) {
      headerMap.set('nombre', index);
    } else if (['last_name', 'paterno', 'apellido_paterno'].includes(normalized)) {
      headerMap.set('apellido', index);
    }
  });
  
  return headerMap;
}

/**
 * Parsea el contenido de un archivo CSV de usuarios
 */
export function parseCSV(content: string): CSVParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length < 2) {
    return { rows: [], validCount: 0, errorCount: 0 };
  }

  const separator = detectSeparator(lines[0]);
  const headers = parseCSVLine(lines[0], separator);
  const headerMap = mapHeaders(headers);

  // Verificar que tenemos todos los campos requeridos
  const requiredFields = ['nombre', 'apellido', 'rut', 'telefono', 'email'];
  const missingFields = requiredFields.filter(field => !headerMap.has(field));
  
  if (missingFields.length > 0) {
    // Retornar un error indicando campos faltantes
    return {
      rows: [{
        rowNumber: 0,
        nombre: '',
        apellido: '',
        rut: '',
        telefono: '',
        email: '',
        isValid: false,
        errors: [`Faltan columnas requeridas: ${missingFields.join(', ')}`]
      }],
      validCount: 0,
      errorCount: 1
    };
  }

  const rows: CSVUserRow[] = [];
  const seenRuts = new Set<string>();
  const seenEmails = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], separator);
    const errors: string[] = [];

    const nombre = values[headerMap.get('nombre')!] || '';
    const apellido = values[headerMap.get('apellido')!] || '';
    const rutRaw = values[headerMap.get('rut')!] || '';
    const telefono = values[headerMap.get('telefono')!] || '';
    const email = (values[headerMap.get('email')!] || '').toLowerCase().trim();

    // Validaciones
    if (!nombre.trim()) {
      errors.push('Nombre es requerido');
    }

    if (!apellido.trim()) {
      errors.push('Apellido es requerido');
    }

    // Validar RUT
    const cleanedRut = cleanRUT(rutRaw);
    if (!cleanedRut) {
      errors.push('RUT es requerido');
    } else {
      const rutValidation = validateRUT(cleanedRut);
      if (!rutValidation.isValid) {
        errors.push(rutValidation.error || 'RUT inválido');
      } else if (seenRuts.has(cleanedRut)) {
        errors.push('RUT duplicado en el archivo');
      } else {
        seenRuts.add(cleanedRut);
      }
    }

    // Validar teléfono
    if (!telefono.trim()) {
      errors.push('Teléfono es requerido');
    }

    // Validar email
    if (!email) {
      errors.push('Email es requerido');
    } else if (!isValidEmail(email)) {
      errors.push('Email tiene formato inválido');
    } else if (seenEmails.has(email)) {
      errors.push('Email duplicado en el archivo');
    } else {
      seenEmails.add(email);
    }

    rows.push({
      rowNumber: i,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rut: formatRUT(cleanedRut),
      telefono: telefono.trim(),
      email,
      isValid: errors.length === 0,
      errors
    });
  }

  return {
    rows,
    validCount: rows.filter(r => r.isValid).length,
    errorCount: rows.filter(r => !r.isValid).length
  };
}

/**
 * Lee un archivo y retorna su contenido como texto
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Genera una plantilla CSV de ejemplo
 */
export function generateCSVTemplate(): string {
  const headers = 'nombre,apellido,rut,telefono,email';
  const example1 = 'Juan,Pérez,12345678-5,+56912345678,juan.perez@ejemplo.com';
  const example2 = 'María,López,98765432-1,+56987654321,maria.lopez@ejemplo.com';
  
  return `${headers}\n${example1}\n${example2}`;
}

/**
 * Descarga un archivo de texto
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
