import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeadphonesIcon } from 'lucide-react';

export default function SupportPage() {
  return (
    <AppShell>
      <PageHeader
        title="Soporte"
        description="Tickets de soporte y ayuda"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Soporte' },
        ]}
      />

      <EmptyState
        icon={HeadphonesIcon}
        title="Sin tickets"
        description="Los tickets de soporte aparecerán aquí."
      />
    </AppShell>
  );
}
