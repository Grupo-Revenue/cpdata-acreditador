import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, PenTool } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { jsPDF } from 'jspdf';
import { replaceContractVariables, generateProfessionalPDF, ContractVariables } from '@/lib/contract-utils';

interface DigitalSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  dealName: string | null;
  userId: string;
  horario?: string;
  onSigned?: () => void;
}

interface SignatureRecord {
  id: string;
  contract_text: string;
  signer_name: string;
  signed_at: string;
}

export function DigitalSignatureDialog({ open, onOpenChange, eventId, dealName, userId, horario, onSigned }: DigitalSignatureDialogProps) {
  const { toast } = useToast();
  const [contractTemplate, setContractTemplate] = useState('');
  const [processedText, setProcessedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<SignatureRecord | null>(null);
  const [internalEventId, setInternalEventId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signerName, setSignerName] = useState('');

  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    setSignature(null);

    const load = async () => {
      // Get contract text
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'digital_signature_text')
        .maybeSingle();
      const template = settingsData?.value ?? '';
      setContractTemplate(template);

      // Get internal event
      const { data: eventData } = await supabase
        .from('events')
        .select('id, name, location, event_date')
        .eq('hubspot_deal_id', eventId)
        .maybeSingle();

      const evId = eventData?.id ?? null;
      setInternalEventId(evId);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre, apellido, rut, carrera, universidad, telefono')
        .eq('id', userId)
        .single();

      const fullName = profile ? `${profile.nombre} ${profile.apellido}` : 'Usuario';
      setSignerName(fullName);

      // Build variables
      const vars: ContractVariables = {
        NOMBRE_ESTUDIANTE: fullName,
        RUT_ESTUDIANTE: profile?.rut || '',
        CARRERA: profile?.carrera || '',
        UNIVERSIDAD: profile?.universidad || '',
        TELEFONO: profile?.telefono || '',
        EVENTO: eventData?.name || dealName || '',
        LOCACION: eventData?.location || '',
        FECHA_EVENTO: eventData?.event_date ? new Date(eventData.event_date).toLocaleDateString('es-CL') : '',
        HORARIO: horario || '',
        FECHA_FIRMA: new Date().toLocaleDateString('es-CL'),
      };

      setProcessedText(replaceContractVariables(template, vars));

      // Check existing signature
      if (evId) {
        const { data: sigData } = await supabase
          .from('digital_signatures')
          .select('id, contract_text, signer_name, signed_at')
          .eq('user_id', userId)
          .eq('event_id', evId)
          .maybeSingle();
        setSignature(sigData ?? null);
      }

      setLoading(false);
    };
    load();
  }, [open, eventId, userId, horario]);

  const handleSign = async () => {
    if (!internalEventId) return;
    setSigning(true);

    const { data, error } = await supabase
      .from('digital_signatures')
      .insert({
        user_id: userId,
        event_id: internalEventId,
        contract_text: processedText,
        signer_name: signerName,
      })
      .select('id, contract_text, signer_name, signed_at')
      .single();

    setSigning(false);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo registrar la firma.', variant: 'destructive' });
    } else {
      // Update contract_status in event_accreditors
      await supabase
        .from('event_accreditors')
        .update({ contract_status: 'firmado' })
        .eq('event_id', internalEventId)
        .eq('user_id', userId);

      setSignature(data);
      toast({ title: 'Contrato firmado', description: 'Tu firma digital ha sido registrada exitosamente.' });
      onSigned?.();
    }
  };

  const handleDownload = () => {
    if (!signature) return;
    const doc = new jsPDF();
    generateProfessionalPDF(doc, signature.contract_text, signature.signer_name, new Date(signature.signed_at));
    doc.save(`contrato-${dealName ?? 'evento'}-${signature.signer_name}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Firma Digital — {dealName ?? 'Evento'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <LoadingState text="Cargando contrato..." className="py-8" />
        ) : signature ? (
          <div className="space-y-4 flex flex-col flex-1 min-h-0">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 flex-shrink-0">
              Contrato firmado
            </Badge>
            <div className="flex-1 min-h-0 border rounded-md p-4 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">{signature.contract_text}</pre>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 flex-shrink-0">
              <p><strong>Firmado por:</strong> {signature.signer_name}</p>
              <p><strong>Fecha:</strong> {new Date(signature.signed_at).toLocaleDateString('es-CL')}</p>
              <p><strong>Hora:</strong> {new Date(signature.signed_at).toLocaleTimeString('es-CL')}</p>
            </div>
            <DialogFooter className="flex-shrink-0">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Contrato
              </Button>
            </DialogFooter>
          </div>
        ) : !contractTemplate ? (
          <p className="text-muted-foreground py-8 text-center">
            No se ha configurado el texto del contrato. Contacte al administrador.
          </p>
        ) : (
          <div className="space-y-4 flex flex-col flex-1 min-h-0">
            <p className="text-sm text-muted-foreground flex-shrink-0">Lea el contrato completo antes de firmar:</p>
            <div className="flex-1 min-h-0 border rounded-md p-4 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">{processedText}</pre>
            </div>
            <DialogFooter className="flex-shrink-0">
              <Button onClick={() => setConfirmOpen(true)} disabled={signing}>
                <PenTool className="h-4 w-4 mr-2" />
                {signing ? 'Firmando...' : 'Firmar Contrato'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar firma"
        description="¿Está seguro de que desea firmar este contrato? Esta acción no se puede deshacer."
        confirmLabel="Firmar"
        variant="default"
        isLoading={signing}
        onConfirm={() => {
          setConfirmOpen(false);
          handleSign();
        }}
      />
    </Dialog>
  );
}
