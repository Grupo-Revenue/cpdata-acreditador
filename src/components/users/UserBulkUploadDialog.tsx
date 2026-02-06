import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  parseCSV,
  readFileAsText,
  generateCSVTemplate,
  downloadFile,
  CSVUserRow,
  CSVParseResult,
} from '@/lib/csv-parser';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface UserBulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreatedUser {
  email: string;
  password: string;
}

type UploadStep = 'upload' | 'preview' | 'processing' | 'results';

export function UserBulkUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: UserBulkUploadDialogProps) {
  const [step, setStep] = useState<UploadStep>('upload');
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [failedUsers, setFailedUsers] = useState<{ email: string; error: string }[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setStep('upload');
    setParseResult(null);
    setIsProcessing(false);
    setCreatedUsers([]);
    setFailedUsers([]);
    setIsDragOver(false);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  }, [onOpenChange, resetState]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    // Validar extensión
    const validExtensions = ['.csv', '.txt'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(extension)) {
      toast({
        variant: 'destructive',
        title: 'Formato no válido',
        description: 'Por favor suba un archivo CSV.',
      });
      return;
    }

    try {
      const content = await readFileAsText(file);
      const result = parseCSV(content);
      
      if (result.rows.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Archivo vacío',
          description: 'El archivo no contiene datos de usuarios.',
        });
        return;
      }

      setParseResult(result);
      setStep('preview');
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo leer el archivo.',
      });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFileSelect]);

  const handleDownloadTemplate = useCallback(() => {
    const template = generateCSVTemplate();
    downloadFile(template, 'plantilla_usuarios.csv');
  }, []);

  const handleUpload = useCallback(async () => {
    if (!parseResult) return;

    const validRows = parseResult.rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Sin usuarios válidos',
        description: 'No hay usuarios válidos para crear.',
      });
      return;
    }

    setStep('processing');
    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const users = validRows.map(row => ({
        nombre: row.nombre,
        apellido: row.apellido,
        rut: row.rut,
        telefono: row.telefono,
        email: row.email,
      }));

      const response = await supabase.functions.invoke('create-users-bulk', {
        body: { users },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { results } = response.data;
      
      const created = results
        .filter((r: { success: boolean }) => r.success)
        .map((r: { email: string; password: string }) => ({ email: r.email, password: r.password }));
      
      const failed = results
        .filter((r: { success: boolean }) => !r.success)
        .map((r: { email: string; error: string }) => ({ email: r.email, error: r.error }));

      setCreatedUsers(created);
      setFailedUsers(failed);
      setStep('results');

      if (created.length > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error uploading users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear usuarios.',
      });
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  }, [parseResult, toast, onSuccess]);

  const handleDownloadCredentials = useCallback(() => {
    if (createdUsers.length === 0) return;

    const header = 'Email,Contraseña Temporal';
    const rows = createdUsers.map(u => `${u.email},${u.password}`);
    const content = [header, ...rows].join('\n');
    
    downloadFile(content, 'credenciales_usuarios.csv');
  }, [createdUsers]);

  const renderUploadStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Suba un archivo CSV con los datos de los usuarios. Cada usuario recibirá una
        contraseña temporal que deberá cambiar en su primer inicio de sesión.
      </p>

      <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
        <Download className="w-4 h-4 mr-2" />
        Descargar plantilla de ejemplo
      </Button>

      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          Arrastre el archivo aquí o haga clic para seleccionar
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Formato: CSV (separado por comas o punto y coma)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!parseResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Válidos: {parseResult.validCount}</span>
          </div>
          {parseResult.errorCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 text-destructive">
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Con errores: {parseResult.errorCount}</span>
            </div>
          )}
        </div>

        <ScrollArea className="h-[300px] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Apellido</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-24">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parseResult.rows.map((row) => (
                <TableRow key={row.rowNumber} className={!row.isValid ? 'bg-destructive/5' : ''}>
                  <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
                  <TableCell>{row.nombre || '-'}</TableCell>
                  <TableCell>{row.apellido || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{row.rut || '-'}</TableCell>
                  <TableCell>{row.telefono || '-'}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{row.email || '-'}</TableCell>
                  <TableCell>
                    {row.isValid ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                        OK
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Error
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {parseResult.errorCount > 0 && (
          <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-700 dark:text-yellow-400">
                  Hay {parseResult.errorCount} fila(s) con errores
                </p>
                <p className="text-muted-foreground mt-1">
                  Las filas con errores serán ignoradas. Solo se crearán los{' '}
                  {parseResult.validCount} usuarios válidos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-medium">Creando usuarios...</p>
      <p className="text-sm text-muted-foreground">Por favor espere, esto puede tomar unos momentos.</p>
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-500/10 text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Creados: {createdUsers.length}</span>
        </div>
        {failedUsers.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 text-destructive">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Fallidos: {failedUsers.length}</span>
          </div>
        )}
      </div>

      {createdUsers.length > 0 && (
        <div className="p-4 rounded-md bg-green-500/10 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  ¡Usuarios creados exitosamente!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Descargue las credenciales temporales para compartirlas con los usuarios.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleDownloadCredentials}>
              <Download className="w-4 h-4 mr-2" />
              Descargar Credenciales
            </Button>
          </div>
        </div>
      )}

      {failedUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">Usuarios que no se pudieron crear:</p>
          <ScrollArea className="h-[150px] border border-destructive/30 rounded-md p-2">
            {failedUsers.map((user, idx) => (
              <div key={idx} className="text-sm py-1">
                <span className="font-medium">{user.email}</span>
                <span className="text-muted-foreground"> - {user.error}</span>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Carga Masiva de Usuarios
          </DialogTitle>
          <DialogDescription>
            Cree múltiples usuarios a la vez mediante un archivo CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'upload' && renderUploadStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'results' && renderResultsStep()}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetState}>
                Cargar otro archivo
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!parseResult || parseResult.validCount === 0}
              >
                Crear {parseResult?.validCount || 0} usuarios
              </Button>
            </>
          )}

          {step === 'results' && (
            <Button onClick={() => handleClose(false)}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
