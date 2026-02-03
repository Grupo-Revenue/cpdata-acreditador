import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wallet } from 'lucide-react';

export default function ReimbursementsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Rendiciones"
        description="Gestión de rendiciones de gastos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Rendiciones' },
        ]}
      />

      <EmptyState
        icon={Wallet}
        title="Sin rendiciones"
        description="Las rendiciones aparecerán aquí cuando se creen."
      />
    </AppShell>
  );
}
