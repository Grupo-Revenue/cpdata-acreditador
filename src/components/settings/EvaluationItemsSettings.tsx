import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus, Trash2, Save, ClipboardList } from 'lucide-react';

interface EvalOption {
  id: string;
  item_id: string;
  label: string;
  points: number;
  sort_order: number;
}
interface EvalItem {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  options: EvalOption[];
}

export function EvaluationItemsSettings() {
  const { activeRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<{ type: 'item' | 'option'; id: string; label: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newOption, setNewOption] = useState<Record<string, { label: string; points: string }>>({});

  const isSuperadmin = activeRole === 'superadmin';

  const { data: items } = useQuery({
    queryKey: ['evaluation-items-settings'],
    queryFn: async () => {
      const { data: itemsData, error } = await supabase
        .from('evaluation_items')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      const ids = (itemsData ?? []).map((i: any) => i.id);
      if (ids.length === 0) return [] as EvalItem[];
      const { data: opts } = await supabase
        .from('evaluation_options')
        .select('*')
        .in('item_id', ids)
        .order('sort_order');
      return (itemsData ?? []).map((it: any) => ({
        ...it,
        options: (opts ?? []).filter((o: any) => o.item_id === it.id),
      })) as EvalItem[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['evaluation-items-settings'] });
    queryClient.invalidateQueries({ queryKey: ['evaluation-items-active'] });
  };

  const createItem = useMutation({
    mutationFn: async () => {
      const name = newItemName.trim();
      if (!name) throw new Error('Nombre requerido');
      const nextOrder = (items?.length ?? 0) + 1;
      const { error } = await supabase.from('evaluation_items').insert({ name, sort_order: nextOrder });
      if (error) throw error;
    },
    onSuccess: () => { setNewItemName(''); invalidate(); toast({ title: 'Ítem creado' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateItem = async (id: string, patch: Partial<EvalItem>) => {
    const { error } = await supabase.from('evaluation_items').update(patch).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    invalidate();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('evaluation_items').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    invalidate(); toast({ title: 'Ítem eliminado' });
  };

  const addOption = async (itemId: string) => {
    const inp = newOption[itemId];
    if (!inp?.label || inp.points === '') {
      toast({ title: 'Error', description: 'Etiqueta y puntos son obligatorios.', variant: 'destructive' });
      return;
    }
    const it = items?.find(i => i.id === itemId);
    const nextOrder = (it?.options.length ?? 0) + 1;
    const { error } = await supabase.from('evaluation_options').insert({
      item_id: itemId,
      label: inp.label.trim(),
      points: parseInt(inp.points, 10) || 0,
      sort_order: nextOrder,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setNewOption(prev => ({ ...prev, [itemId]: { label: '', points: '' } }));
    invalidate(); toast({ title: 'Opción agregada' });
  };

  const updateOption = async (id: string, patch: Partial<EvalOption>) => {
    const { error } = await supabase.from('evaluation_options').update(patch).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    invalidate();
  };

  const deleteOption = async (id: string) => {
    const { error } = await supabase.from('evaluation_options').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    invalidate(); toast({ title: 'Opción eliminada' });
  };

  if (!isSuperadmin) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4" />
            Ítems de Evaluación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configura los ítems que el supervisor puede evaluar por acreditador en cada evento, junto con sus opciones y puntajes.
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="Nombre del nuevo ítem (ej. Desempeño)"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="h-9 text-sm"
            />
            <Button size="sm" onClick={() => createItem.mutate()}>
              <Plus className="h-4 w-4 mr-1" /> Agregar ítem
            </Button>
          </div>

          <div className="space-y-4">
            {(items ?? []).map(item => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    value={item.name}
                    onChange={e => updateItem(item.id, { name: e.target.value })}
                    className="h-9 text-sm font-medium flex-1 min-w-[200px]"
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Activo</span>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(v) => updateItem(item.id, { is_active: v })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setConfirm({ type: 'item', id: item.id, label: item.name })}
                    title="Eliminar ítem"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                  {item.options.map(opt => (
                    <div key={opt.id} className="flex gap-2 items-center">
                      <Input
                        value={opt.label}
                        onChange={e => updateOption(opt.id, { label: e.target.value })}
                        className="h-8 text-xs flex-1"
                        placeholder="Etiqueta"
                      />
                      <Input
                        type="number"
                        value={opt.points}
                        onChange={e => updateOption(opt.id, { points: parseInt(e.target.value, 10) || 0 })}
                        className="h-8 text-xs w-24"
                        placeholder="Puntos"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setConfirm({ type: 'option', id: opt.id, label: opt.label })}
                        title="Eliminar opción"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-2 items-center pt-1">
                    <Input
                      placeholder="Nueva opción"
                      value={newOption[item.id]?.label ?? ''}
                      onChange={e => setNewOption(prev => ({ ...prev, [item.id]: { label: e.target.value, points: prev[item.id]?.points ?? '' } }))}
                      className="h-8 text-xs flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Pts"
                      value={newOption[item.id]?.points ?? ''}
                      onChange={e => setNewOption(prev => ({ ...prev, [item.id]: { label: prev[item.id]?.label ?? '', points: e.target.value } }))}
                      className="h-8 text-xs w-24"
                    />
                    <Button size="sm" variant="outline" className="h-8" onClick={() => addOption(item.id)}>
                      <Plus className="h-3 w-3 mr-1" /> Agregar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(items ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay ítems configurados.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => { if (!o) setConfirm(null); }}
        title={confirm?.type === 'item' ? 'Eliminar ítem' : 'Eliminar opción'}
        description={confirm?.type === 'item'
          ? `Se eliminará el ítem "${confirm?.label}" y todas sus opciones. Esta acción no se puede deshacer.`
          : `Se eliminará la opción "${confirm?.label}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        icon={Trash2}
        onConfirm={async () => {
          if (!confirm) return;
          if (confirm.type === 'item') await deleteItem(confirm.id);
          else await deleteOption(confirm.id);
          setConfirm(null);
        }}
      />
    </>
  );
}
