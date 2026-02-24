import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

const priorityStyles: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-warning/10 text-warning border-warning/20',
  baja: 'bg-muted text-muted-foreground border-muted',
};

const priorityLabels: Record<string, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export function RecentTicketsTable() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['recent-tickets-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, ticket_number, motivo, creator_nombre, creator_apellido, priority, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const pending = tickets?.filter(t => t.status === 'pendiente') ?? [];
  const resolved = tickets?.filter(t => t.status === 'resuelto' || t.status === 'inactivo') ?? [];

  const renderTable = (rows: typeof pending) => {
    if (rows.length === 0) {
      return <EmptyState icon={MessageCircle} title="Sin tickets" description="No hay tickets en esta categoría" />;
    }
    return (
      <div className="overflow-x-auto">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Creado por</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead className="text-right">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(t => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.ticket_number}</TableCell>
              <TableCell className="max-w-[200px] truncate">{t.motivo}</TableCell>
              <TableCell>{t.creator_nombre} {t.creator_apellido}</TableCell>
              <TableCell>
                <Badge variant="outline" className={priorityStyles[t.priority] ?? ''}>
                  {priorityLabels[t.priority] ?? t.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-xs">
                {format(new Date(t.created_at), 'dd/MM/yyyy')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    );
  };

  return (
    <Card className="animate-fade-in-up animation-delay-400">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Tickets Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="pendientes">
            <TabsList>
              <TabsTrigger value="pendientes">Pendientes ({pending.length})</TabsTrigger>
              <TabsTrigger value="resueltos">Resueltos ({resolved.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pendientes">{renderTable(pending)}</TabsContent>
            <TabsContent value="resueltos">{renderTable(resolved)}</TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
