import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Search, Send, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserWithPhone {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  role: string;
}

interface BulkWhatsappEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkWhatsappEventsDialog({ open, onOpenChange }: BulkWhatsappEventsDialogProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithPhone[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set());
    setSearch('');
    fetchUsers();
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['acreditador', 'supervisor']);

      if (!roles || roles.length === 0) { setUsers([]); setLoading(false); return; }

      const userIds = [...new Set(roles.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, telefono')
        .in('id', userIds);

      if (!profiles) { setUsers([]); setLoading(false); return; }

      const roleMap = new Map<string, string>();
      roles.forEach(r => {
        const existing = roleMap.get(r.user_id);
        if (!existing) roleMap.set(r.user_id, r.role);
        else if (!existing.includes(r.role)) roleMap.set(r.user_id, `${existing}, ${r.role}`);
      });

      const usersWithPhone = profiles
        .filter(p => p.telefono && p.telefono.trim().length >= 8)
        .map(p => ({
          id: p.id,
          nombre: p.nombre,
          apellido: p.apellido,
          telefono: p.telefono!,
          role: roleMap.get(p.id) || '',
        }));

      setUsers(usersWithPhone);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los usuarios.', variant: 'destructive' });
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter(u =>
      `${u.nombre} ${u.apellido}`.toLowerCase().includes(s) || u.telefono.includes(s)
    );
  }, [users, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(u => selectedIds.has(u.id));

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allFilteredSelected) {
      filtered.forEach(u => next.delete(u.id));
    } else {
      filtered.forEach(u => next.add(u.id));
    }
    setSelectedIds(next);
  };

  const toggleUser = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    let success = 0;
    let fail = 0;

    const selected = users.filter(u => selectedIds.has(u.id));

    for (const user of selected) {
      try {
        const { error } = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            template_name: 'msg_eventos_disponibles',
            template_language: 'es',
            to_phone: user.telefono,
            parameters: [user.nombre],
          },
        });
        if (error) { fail++; } else { success++; }
      } catch {
        fail++;
      }
    }

    setSending(false);
    toast({
      title: 'Envío completado',
      description: `${success} enviados correctamente${fail > 0 ? `, ${fail} fallidos` : ''}.`,
      variant: fail > 0 ? 'destructive' : 'default',
    });
    if (fail === 0) onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Envío Masivo — Eventos Disponibles
            </DialogTitle>
            <DialogDescription>
              Selecciona los acreditadores o supervisores a quienes enviar la plantilla <strong>msg_eventos_disponibles</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Button variant="ghost" size="sm" onClick={toggleAll} disabled={filtered.length === 0}>
              {allFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </Button>
            <span className="text-muted-foreground">{selectedIds.size} seleccionados</span>
          </div>

          <ScrollArea className="h-[300px] border rounded-md p-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Cargando usuarios...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No se encontraron usuarios con teléfono.</p>
            ) : (
              filtered.map(user => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 px-2 py-2 rounded hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedIds.has(user.id)}
                    onCheckedChange={() => toggleUser(user.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.nombre} {user.apellido}</p>
                    <p className="text-xs text-muted-foreground">{user.telefono} · {user.role}</p>
                  </div>
                </label>
              ))
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={selectedIds.size === 0 || sending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Enviando...' : `Enviar (${selectedIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar envío masivo"
        description={`Se enviará la plantilla msg_eventos_disponibles a ${selectedIds.size} usuario(s). ¿Deseas continuar?`}
        confirmLabel="Enviar"
        icon={MessageSquare}
        onConfirm={handleSend}
        isLoading={sending}
      />
    </>
  );
}
