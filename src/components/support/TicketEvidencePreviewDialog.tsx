import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { getEvidenceFile, type EvidenceFile } from '@/lib/ticket-evidence';
import { useToast } from '@/hooks/use-toast';

interface TicketEvidencePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidenceValue: string | null;
  title?: string;
}

export function TicketEvidencePreviewDialog({ open, onOpenChange, evidenceValue, title = 'Evidencia' }: TicketEvidencePreviewDialogProps) {
  const [file, setFile] = useState<EvidenceFile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    if (file) {
      URL.revokeObjectURL(file.objectUrl);
      setFile(null);
    }
  }, [file]);

  useEffect(() => {
    if (!open || !evidenceValue) {
      cleanup();
      return;
    }

    let cancelled = false;
    setLoading(true);

    getEvidenceFile(evidenceValue)
      .then((result) => {
        if (!cancelled) setFile(result);
      })
      .catch((err) => {
        if (!cancelled) {
          toast({ title: 'Error al cargar archivo', description: err.message, variant: 'destructive' });
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, evidenceValue]);

  useEffect(() => {
    if (!open) cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDownload = () => {
    if (!file) return;
    const a = document.createElement('a');
    a.href = file.objectUrl;
    a.download = file.filename;
    a.click();
  };

  const isImage = file?.mimeType.startsWith('image/');
  const isPdf = file?.mimeType === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{file?.filename || 'Cargando archivo...'}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          {loading && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}

          {!loading && file && isImage && (
            <img src={file.objectUrl} alt={file.filename} className="max-w-full max-h-[60vh] object-contain rounded" />
          )}

          {!loading && file && isPdf && (
            <iframe src={file.objectUrl} className="w-full h-[60vh] rounded border" title={file.filename} />
          )}

          {!loading && file && !isImage && !isPdf && (
            <div className="text-center space-y-3 py-8">
              <p className="text-sm text-muted-foreground">
                Este tipo de archivo no se puede previsualizar aquí.
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar {file.filename}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {file && !loading && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
