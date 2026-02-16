export const DEFAULT_CONTRACT_TEMPLATE = `EN SANTIAGO, REPUBLICA DE CHILE, a {{FECHA_FIRMA}} entre CP DATA OPTIMUM CHILE S.A, Rut.: 96.949.130-3, representada por Cristián Andrés Croquevielle Rodríguez Rut.: 8.003.282-k, ambos domiciliados en Avenida Presidente Kennedy 7440, oficina 923, comuna de Vitacura y don {{NOMBRE_ESTUDIANTE}}, ESTUDIANTE de la carrera de {{CARRERA}} en la institución {{UNIVERSIDAD}}, cédula de identidad Nº {{RUT_ESTUDIANTE}}, en adelante el "ESTUDIANTE", han acordado dejar constancia de lo siguiente.

1. El ESTUDIANTE ofrece a CP DATA OPTIMUM CHILE S.A sus servicios para atender esporádica y ocasionalmente el servicio de registro y acreditación de público en el Centro de Eventos {{LOCACION}}, en el evento {{EVENTO}}.
2. Habida consideración de la calidad de estudiante, estos servicios los prestaré según la disponibilidad de horario, libremente determinada por aquel, no existiendo subordinación de dependencia de ninguna naturaleza. Los servicios se prestarán el día {{FECHA_EVENTO}}, entre las {{HORARIO}};
3. El valor de los honorarios por cada jornada diaria de servicio prestado ascenderá según lo acordado;
4. El estudiante emitirá contra el pago, una boleta de honorario personal, sujeto a la única retención del 14,5% de impuestos, en donde deberá indicar el número de horas servidas, el local donde se prestaron y el evento indicado más arriba.
5. El pago se depositará en la cuenta bancaria registrada por el estudiante en el sistema.

Importante:
Responsabilidad en el uso y manipulación del material de trabajo que se le entrega (equipos y otros). Jamás abandonar los equipos sin previo aviso al encargado o supervisor del evento. En caso de falla de uno de estos, se le debe informar al encargado o supervisor para su cambio.`;

export const CONTRACT_VARIABLES = [
  { key: '{{NOMBRE_ESTUDIANTE}}', description: 'Nombre y apellido del usuario' },
  { key: '{{RUT_ESTUDIANTE}}', description: 'RUT del usuario' },
  { key: '{{CARRERA}}', description: 'Carrera del usuario' },
  { key: '{{UNIVERSIDAD}}', description: 'Universidad del usuario' },
  { key: '{{TELEFONO}}', description: 'Teléfono del usuario' },
  { key: '{{EVENTO}}', description: 'Nombre del evento' },
  { key: '{{LOCACION}}', description: 'Ubicación del evento' },
  { key: '{{FECHA_EVENTO}}', description: 'Fecha del evento' },
  { key: '{{HORARIO}}', description: 'Horario del evento' },
  { key: '{{FECHA_FIRMA}}', description: 'Fecha actual al firmar' },
];

export interface ContractVariables {
  NOMBRE_ESTUDIANTE?: string;
  RUT_ESTUDIANTE?: string;
  CARRERA?: string;
  UNIVERSIDAD?: string;
  TELEFONO?: string;
  EVENTO?: string;
  LOCACION?: string;
  FECHA_EVENTO?: string;
  HORARIO?: string;
  FECHA_FIRMA?: string;
}

export function replaceContractVariables(text: string, vars: ContractVariables): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value || '_______________');
  }
  return result;
}

export function generateProfessionalPDF(
  doc: import('jspdf').jsPDF,
  contractText: string,
  signerName: string,
  signedAt: Date,
  startOnNewPage = false
) {
  if (startOnNewPage) doc.addPage();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CP DATA OPTIMUM', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Title
  doc.setFontSize(12);
  doc.text('ACUERDO DE PRESTACION DE SERVICIOS OCASIONALES', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Subtitle with signer name
  doc.setFontSize(11);
  doc.text(signerName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Separator line
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Body text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Split into paragraphs and handle page breaks
  const paragraphs = contractText.split('\n').filter(p => p.trim());
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 30;

  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph.trim(), contentWidth);
    const blockHeight = lines.length * 5;

    if (y + blockHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = 20;
    }

    // Check if paragraph starts with "Importante:" for bold
    if (paragraph.trim().startsWith('Importante:')) {
      doc.setFont('helvetica', 'bold');
      doc.text(lines, margin, y);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.text(lines, margin, y);
    }
    y += blockHeight + 3;
  }

  // Signature block
  y += 10;
  if (y + 40 > pageHeight - bottomMargin) {
    doc.addPage();
    y = 30;
  }

  // Two signature lines
  const colWidth = contentWidth / 2;
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + colWidth - 10, y);
  doc.line(margin + colWidth + 10, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('pp. CP DATA OPTIMUM CHILE S.A', margin, y);
  doc.text('ESTUDIANTE', margin + colWidth + 10, y);
  y += 15;

  // Digital signature metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setTextColor(100);
  doc.text(`Firmado digitalmente por: ${signerName}`, margin, y);
  y += 4;
  doc.text(`Fecha: ${signedAt.toLocaleDateString('es-CL')} a las ${signedAt.toLocaleTimeString('es-CL')}`, margin, y);
  doc.setTextColor(0);
}
