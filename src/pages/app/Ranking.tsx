import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Trophy } from 'lucide-react';

export default function RankingPage() {
  return (
    <AppShell>
      <PageHeader
        title="Ranking"
        description="Ranking de acreditadores"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Ranking' },
        ]}
      />

      <EmptyState
        icon={Trophy}
        title="Sin datos de ranking"
        description="El ranking de acreditadores aparecerá aquí."
      />
    </AppShell>
  );
}
