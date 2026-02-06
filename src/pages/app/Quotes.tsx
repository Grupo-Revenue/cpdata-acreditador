import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText } from 'lucide-react';

export default function QuotesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Cotizaciones"
        description="Gestión de cotizaciones"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Cotizaciones' },
        ]}
      />

      <EmptyState
        icon={FileText}
        title="Módulo de cotizaciones"
        description="Las cotizaciones aparecerán aquí."
      />
    </AppShell>
  );
}
