import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { WhatsappTemplateDialog } from './WhatsappTemplateDialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, MessageSquare, RefreshCw } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  pending: { label: 'Pendiente', variant: 'outline' },
  approved: { label: 'Aprobada', variant: 'default' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
};

const CATEGORY_LABELS: Record<string, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utilidad',
  AUTHENTICATION: 'Autenticación',
};

export function WhatsappTemplatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const checkStatusMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase.functions.invoke('check-whatsapp-template-status', {
        body: { template_id: templateId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      const statusLabels: Record<string, string> = { approved: 'Aprobada ✅', rejected: 'Rechazada ❌', pending: 'Aún pendiente ⏳' };
      toast({ title: 'Estado actualizado', description: statusLabels[data.status] || data.status });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'No se pudo consultar el estado.', variant: 'destructive' });
    },
    onSettled: () => setCheckingId(null),
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['whatsapp_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_templates'] });
      toast({ title: 'Plantilla eliminada' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo eliminar la plantilla.', variant: 'destructive' });
    },
  });

  const handleEdit = (t: any) => {
    setEditTemplate(t);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditTemplate(null);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-accent">
                <MessageSquare className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Plantillas de WhatsApp</CardTitle>
                <CardDescription>Gestiona las plantillas de mensaje para WhatsApp Business</CardDescription>
              </div>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-1" /> Crear Plantilla
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? null : !templates?.length ? (
            <EmptyState title="Sin plantillas" description="Crea tu primera plantilla de mensaje de WhatsApp." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Idioma</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => {
                  const status = STATUS_MAP[t.status] ?? STATUS_MAP.draft;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{CATEGORY_LABELS[t.category] ?? t.category}</TableCell>
                      <TableCell>{t.language}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {(t.status === 'pending' || t.status === 'rejected') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={checkingId === t.id}
                              onClick={() => { setCheckingId(t.id); checkStatusMutation.mutate(t.id); }}
                              title="Consultar estado en Meta"
                            >
                              <RefreshCw className={`w-4 h-4 ${checkingId === t.id ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <WhatsappTemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} template={editTemplate} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar plantilla"
        description="¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
