import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ITEMS_PER_PAGE = 5;

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
  is_general: boolean;
}

export function AttendanceCommentsDialog({ open, onOpenChange, userId, userName }: AttendanceCommentsDialogProps) {
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [userId]);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['attendance-comments', userId],
    enabled: open && !!userId,
    queryFn: async () => {
      // Get attendance comments
      const { data: rawComments, error } = await supabase
        .from('attendance_comments')
        .select('id, comment, created_at, created_by, attendance_record_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get general user comments
      const { data: generalComments, error: generalError } = await supabase
        .from('user_comments' as any)
        .select('id, comment, created_at, created_by')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (generalError) throw generalError;

      const allCreatorIds = new Set<string>();

      // Process attendance comments
      let attendanceResults: CommentWithContext[] = [];
      if (rawComments && rawComments.length > 0) {
        const recordIds = [...new Set(rawComments.map(c => c.attendance_record_id))];
        const { data: records } = await supabase
          .from('attendance_records')
          .select('id, event_id')
          .in('id', recordIds);

        const eventIds = [...new Set((records ?? []).map(r => r.event_id))];
        const { data: events } = await supabase
          .from('events')
          .select('id, name')
          .in('id', eventIds);

        rawComments.forEach(c => allCreatorIds.add(c.created_by));

        const eventsMap = new Map((events ?? []).map(e => [e.id, e.name]));
        const recordsMap = new Map((records ?? []).map(r => [r.id, r.event_id]));

        attendanceResults = rawComments.map(c => {
          const eventId = recordsMap.get(c.attendance_record_id);
          return {
            id: c.id,
            comment: c.comment,
            created_at: c.created_at,
            event_name: eventId ? eventsMap.get(eventId) ?? 'Evento desconocido' : 'Evento desconocido',
            supervisor_nombre: '',
            supervisor_apellido: '',
            is_general: false,
          };
        });
      }

      // Process general comments
      const generalResults: CommentWithContext[] = ((generalComments as any[]) ?? []).map((c: any) => {
        allCreatorIds.add(c.created_by);
        return {
          id: c.id,
          comment: c.comment,
          created_at: c.created_at,
          event_name: 'General',
          supervisor_nombre: '',
          supervisor_apellido: '',
          is_general: true,
        };
      });

      // Fetch all creator profiles at once
      if (allCreatorIds.size > 0) {
        const { data: supervisors } = await supabase
          .from('profiles')
          .select('id, nombre, apellido')
          .in('id', [...allCreatorIds]);

        const supervisorsMap = new Map((supervisors ?? []).map(s => [s.id, s]));

        const fillSupervisor = (c: CommentWithContext, createdBy: string) => {
          const sup = supervisorsMap.get(createdBy);
          c.supervisor_nombre = sup?.nombre ?? '';
          c.supervisor_apellido = sup?.apellido ?? '';
        };

        rawComments?.forEach((raw, i) => fillSupervisor(attendanceResults[i], raw.created_by));
        ((generalComments as any[]) ?? []).forEach((raw: any, i: number) => fillSupervisor(generalResults[i], raw.created_by));
      }

      // Merge and sort by date desc
      return [...attendanceResults, ...generalResults].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });

  const totalComments = comments?.length ?? 0;
  const totalPages = Math.ceil(totalComments / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedComments = comments?.slice(startIndex, startIndex + ITEMS_PER_PAGE) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
        ) : totalComments > 0 ? (
          <>
            <ScrollArea className="max-h-[400px] pr-3">
              <div className="space-y-3">
                {paginatedComments.map(c => (
                  <div key={c.id} className="border rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(c.created_at), "dd MMM yyyy", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {c.is_general ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">General</Badge>
                        ) : c.event_name}
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
            </ScrollArea>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  Mostrando {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalComments)} de {totalComments}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
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
