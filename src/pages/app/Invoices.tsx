import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Boletas"
        description="Gestión de boletas y documentos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Boletas' },
        ]}
      />

      <EmptyState
        icon={FileText}
        title="Sin boletas"
        description="Las boletas aparecerán aquí cuando se registren."
      />
    </AppShell>
  );
}
