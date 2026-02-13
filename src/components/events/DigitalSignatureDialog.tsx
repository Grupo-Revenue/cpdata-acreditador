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

interface DigitalSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  dealName: string | null;
  userId: string;
  onSigned?: () => void;
}

interface SignatureRecord {
  id: string;
  contract_text: string;
  signer_name: string;
  signed_at: string;
}

export function DigitalSignatureDialog({ open, onOpenChange, eventId, dealName, userId, onSigned }: DigitalSignatureDialogProps) {
  const { toast } = useToast();
  const [contractText, setContractText] = useState('');
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<SignatureRecord | null>(null);
  const [internalEventId, setInternalEventId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
      setContractText(settingsData?.value ?? '');

      // Get internal event id from hubspot_deal_id
      const { data: eventData } = await supabase
        .from('events')
        .select('id')
        .eq('hubspot_deal_id', eventId)
        .maybeSingle();

      const evId = eventData?.id ?? null;
      setInternalEventId(evId);

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
  }, [open, eventId, userId]);

  const handleSign = async () => {
    if (!internalEventId) return;
    setSigning(true);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre, apellido')
      .eq('id', userId)
      .single();

    const signerName = profile ? `${profile.nombre} ${profile.apellido}` : 'Usuario';

    const { data, error } = await supabase
      .from('digital_signatures')
      .insert({
        user_id: userId,
        event_id: internalEventId,
        contract_text: contractText,
        signer_name: signerName,
      })
      .select('id, contract_text, signer_name, signed_at')
      .single();

    setSigning(false);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo registrar la firma.', variant: 'destructive' });
    } else {
      setSignature(data);
      toast({ title: 'Contrato firmado', description: 'Tu firma digital ha sido registrada exitosamente.' });
      onSigned?.();
    }
  };

  const handleDownload = () => {
    if (!signature) return;
    const signedDate = new Date(signature.signed_at);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Contrato Firmado', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(signature.contract_text, 170);
    doc.text(lines, 20, 35);
    const y = 35 + lines.length * 6;
    doc.setFontSize(10);
    doc.text('─────────────────────────────────────', 20, y + 10);
    doc.text(`Firmado por: ${signature.signer_name}`, 20, y + 18);
    doc.text(`Fecha: ${signedDate.toLocaleDateString('es-CL')}`, 20, y + 24);
    doc.text(`Hora: ${signedDate.toLocaleTimeString('es-CL')}`, 20, y + 30);
    doc.text('─────────────────────────────────────', 20, y + 36);
    doc.save(`contrato-${dealName ?? 'evento'}-${signature.signer_name}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Firma Digital — {dealName ?? 'Evento'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <LoadingState text="Cargando contrato..." className="py-8" />
        ) : signature ? (
          <div className="space-y-4">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              Contrato firmado
            </Badge>
            <ScrollArea className="h-[300px] border rounded-md p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono">{signature.contract_text}</pre>
            </ScrollArea>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Firmado por:</strong> {signature.signer_name}</p>
              <p><strong>Fecha:</strong> {new Date(signature.signed_at).toLocaleDateString('es-CL')}</p>
              <p><strong>Hora:</strong> {new Date(signature.signed_at).toLocaleTimeString('es-CL')}</p>
            </div>
            <DialogFooter>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Contrato
              </Button>
            </DialogFooter>
          </div>
        ) : !contractText ? (
          <p className="text-muted-foreground py-8 text-center">
            No se ha configurado el texto del contrato. Contacte al administrador.
          </p>
        ) : (
          <div className="space-y-4 flex flex-col flex-1 min-h-0">
            <p className="text-sm text-muted-foreground">Lea el contrato completo antes de firmar:</p>
            <ScrollArea className="h-[350px] border rounded-md p-4 flex-1">
              <pre className="whitespace-pre-wrap text-sm font-mono">{contractText}</pre>
            </ScrollArea>
            <DialogFooter>
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
