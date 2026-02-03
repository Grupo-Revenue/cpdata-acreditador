import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar } from 'lucide-react';

export default function EventsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Eventos"
        description="Gestión de eventos y acreditaciones"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Eventos' },
        ]}
      />

      <EmptyState
        icon={Calendar}
        title="Sin eventos"
        description="Los eventos aparecerán aquí cuando se agreguen al sistema."
      />
    </AppShell>
  );
}
