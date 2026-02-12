import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AccreditorRanking {
  id: string;
  nombre: string;
  apellido: string;
  eventos_completados: number;
  ultimo_evento: string | null;
}

interface RankingTableProps {
  limit?: number;
}

export function RankingTable({ limit = 10 }: RankingTableProps) {
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['accreditor-ranking'],
    queryFn: async () => {
      // Get all accreditors (users with role 'acreditador')
      const { data: accreditors, error: accreditorsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'acreditador');

      if (accreditorsError) throw accreditorsError;

      if (!accreditors || accreditors.length === 0) {
        return [];
      }

      const userIds = accreditors.map(a => a.user_id);

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Get event completions count for each accreditor
      const { data: eventCounts, error: eventCountsError } = await supabase
        .from('event_accreditors')
        .select('user_id, status, events(event_date)')
        .eq('status', 'completed')
        .in('user_id', userIds);

      if (eventCountsError) throw eventCountsError;

      // Build ranking data
      const rankingData: AccreditorRanking[] = (profiles || []).map(profile => {
        const userEvents = (eventCounts || []).filter(e => e.user_id === profile.id);
        const completedCount = userEvents.length;
        
        // Find the most recent event date
        let lastEventDate: string | null = null;
        userEvents.forEach(e => {
          const eventData = e.events as { event_date: string } | null;
          if (eventData?.event_date) {
            if (!lastEventDate || eventData.event_date > lastEventDate) {
              lastEventDate = eventData.event_date;
            }
          }
        });

        return {
          id: profile.id,
          nombre: profile.nombre,
          apellido: profile.apellido,
          eventos_completados: completedCount,
          ultimo_evento: lastEventDate,
        };
      });

      // Sort by completed events (descending)
      return rankingData
        .sort((a, b) => b.eventos_completados - a.eventos_completados)
        .slice(0, limit);
    }
  });

  const getRankBadge = (position: number) => {
    if (position === 1) return <span className="text-warning font-bold">🥇</span>;
    if (position === 2) return <span className="text-muted-foreground font-bold">🥈</span>;
    if (position === 3) return <span className="text-accent font-bold">🥉</span>;
    return <span className="text-muted-foreground">{position}</span>;
  };

  return (
    <Card className="lg:col-span-2 animate-fade-in-up animation-delay-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Ranking de Acreditadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : ranking && ranking.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Acreditador</TableHead>
                <TableHead className="text-center">Eventos</TableHead>
                <TableHead className="text-right">Último Evento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((accreditor, index) => (
                <TableRow key={accreditor.id}>
                  <TableCell className="font-medium">
                    {getRankBadge(index + 1)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {accreditor.nombre?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <span className="font-medium">
                        {accreditor.nombre} {accreditor.apellido}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {accreditor.eventos_completados}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {accreditor.ultimo_evento
                      ? format(new Date(accreditor.ultimo_evento), 'dd/MM/yyyy', { locale: es })
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No hay acreditadores registrados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los acreditadores aparecerán aquí cuando se asignen a eventos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
