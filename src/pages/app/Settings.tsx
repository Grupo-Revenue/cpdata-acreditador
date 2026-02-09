import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { RolesManager } from '@/components/settings/RolesManager';
import { HubspotIntegration } from '@/components/settings/HubspotIntegration';

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Configuración"
        description="Parámetros del sistema"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Configuración' },
        ]}
      />

      <div className="space-y-6">
        <RolesManager />
        <HubspotIntegration />
      </div>
    </AppShell>
  );
}
