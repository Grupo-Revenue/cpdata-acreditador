import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MessageSquare, Calendar, MapPin, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendanceCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

interface CommentWithContext {
  id: string;
  comment: string;
  created_at: string;
  event_name: string;
  supervisor_nombre: string;
  supervisor_apellido: string;
}

export function AttendanceCommentsDialog({ open, onOpenChange, userId, userName }: AttendanceCommentsDialogProps) {
  const { data: comments, isLoading } = useQuery({
    queryKey: ['attendance-comments', userId],
    enabled: open && !!userId,
    queryFn: async () => {
      // Get comments for this user
      const { data: rawComments, error } = await supabase
        .from('attendance_comments')
        .select('id, comment, created_at, created_by, attendance_record_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!rawComments || rawComments.length === 0) return [];

      // Get attendance records to find event_ids
      const recordIds = [...new Set(rawComments.map(c => c.attendance_record_id))];
      const { data: records } = await supabase
        .from('attendance_records')
        .select('id, event_id')
        .in('id', recordIds);

      // Get event names
      const eventIds = [...new Set((records ?? []).map(r => r.event_id))];
      const { data: events } = await supabase
        .from('events')
        .select('id, name')
        .in('id', eventIds);

      // Get supervisor profiles
      const supervisorIds = [...new Set(rawComments.map(c => c.created_by))];
      const { data: supervisors } = await supabase
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', supervisorIds);

      const eventsMap = new Map((events ?? []).map(e => [e.id, e.name]));
      const recordsMap = new Map((records ?? []).map(r => [r.id, r.event_id]));
      const supervisorsMap = new Map((supervisors ?? []).map(s => [s.id, s]));

      return rawComments.map(c => {
        const eventId = recordsMap.get(c.attendance_record_id);
        const supervisor = supervisorsMap.get(c.created_by);
        return {
          id: c.id,
          comment: c.comment,
          created_at: c.created_at,
          event_name: eventId ? eventsMap.get(eventId) ?? 'Evento desconocido' : 'Evento desconocido',
          supervisor_nombre: supervisor?.nombre ?? '',
          supervisor_apellido: supervisor?.apellido ?? '',
        } as CommentWithContext;
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Comentarios de {userName}
          </DialogTitle>
          <DialogDescription>
            Historial de comentarios registrados por supervisores
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="border rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(c.created_at), "dd MMM yyyy", { locale: es })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {c.event_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {c.supervisor_nombre} {c.supervisor_apellido}
                  </span>
                </div>
                <p className="text-sm">{c.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">No hay comentarios registrados</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
