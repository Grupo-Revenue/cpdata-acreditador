import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { RankingTable } from '@/components/dashboard/RankingTable';

export default function RankingPage() {
  return (
    <AppShell>
      <PageHeader
        title="Ranking"
        description="Ranking de acreditadores por puntos de asistencia"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Ranking' },
        ]}
      />

      <RankingTable limit={50} />
    </AppShell>
  );
}
