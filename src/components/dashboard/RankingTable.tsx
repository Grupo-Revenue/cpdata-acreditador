import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AttendanceCommentsDialog } from '@/components/events/AttendanceCommentsDialog';

interface AccreditorRanking {
  id: string;
  nombre: string;
  apellido: string;
  total_points: number;
  events_count: number;
}

interface RankingTableProps {
  limit?: number;
}

export function RankingTable({ limit = 10 }: RankingTableProps) {
  const { activeRole } = useAuth();
  const isAdmin = activeRole === 'superadmin' || activeRole === 'administracion';
  const [commentsUser, setCommentsUser] = useState<{ id: string; name: string } | null>(null);

  const { data: ranking, isLoading } = useQuery({
    queryKey: ['accreditor-ranking', limit],
    queryFn: async () => {
      const { data: accreditors, error: accreditorsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'acreditador');

      if (accreditorsError) throw accreditorsError;
      if (!accreditors || accreditors.length === 0) return [];

      const userIds = accreditors.map(a => a.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre, apellido')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const { data: attendance, error: attError } = await supabase
        .from('attendance_records')
        .select('user_id, ranking_points')
        .in('user_id', userIds);

      if (attError) throw attError;

      const rankingData: AccreditorRanking[] = (profiles || []).map(profile => {
        const userRecords = (attendance || []).filter(a => a.user_id === profile.id);
        const totalPoints = userRecords.reduce((sum, r) => sum + (r.ranking_points || 0), 0);

        return {
          id: profile.id,
          nombre: profile.nombre,
          apellido: profile.apellido,
          total_points: totalPoints,
          events_count: userRecords.length,
        };
      });

      return rankingData
        .sort((a, b) => b.total_points - a.total_points)
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
    <>
      <Card className="animate-fade-in-up animation-delay-200">
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
                  <TableHead className="text-center">Puntos</TableHead>
                  <TableHead className="text-center">Eventos</TableHead>
                  {isAdmin && <TableHead className="w-12"></TableHead>}
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
                        {accreditor.total_points}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {accreditor.events_count}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Ver comentarios"
                          onClick={() => setCommentsUser({ id: accreditor.id, name: `${accreditor.nombre} ${accreditor.apellido}` })}
                        >
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay acreditadores registrados</p>
              <p className="text-sm text-muted-foreground mt-1">
                Los acreditadores aparecerán aquí cuando se registre su asistencia
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {commentsUser && (
        <AttendanceCommentsDialog
          open={!!commentsUser}
          onOpenChange={(open) => { if (!open) setCommentsUser(null); }}
          userId={commentsUser.id}
          userName={commentsUser.name}
        />
      )}
    </>
  );
}
