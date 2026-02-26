import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import type { InvoiceRow } from './InvoicesTable';

interface InvoiceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceRow | null;
}

function formatInvoiceId(num: number): string {
  return 'B' + String(num).padStart(3, '0');
}

export function InvoiceUploadDialog({ open, onOpenChange, invoice }: InvoiceUploadDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [numeroBoleta, setNumeroBoleta] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleUpload = async () => {
    if (!invoice) return;
    if (!numeroBoleta.trim()) {
      toast.error('Ingresa el número de boleta');
      return;
    }
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Selecciona un archivo');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${invoice.id}/${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from('invoices')
        .upload(path, file, { upsert: true });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('invoices')
        .update({ file_url: urlData.publicUrl, numero_boleta: numeroBoleta.trim() })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Boleta subida correctamente');
      setNumeroBoleta('');
      onOpenChange(false);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Boleta {formatInvoiceId(invoice.invoice_number)}
          </DialogTitle>
          <DialogDescription>
            Selecciona un archivo PDF o imagen para esta boleta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Número de boleta</label>
            <Input
              placeholder="Ej: 12345"
              value={numeroBoleta}
              onChange={(e) => setNumeroBoleta(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Archivo (PDF o imagen)</label>
            <Input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Subiendo...' : 'Subir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
