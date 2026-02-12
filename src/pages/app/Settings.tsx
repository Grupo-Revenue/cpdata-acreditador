import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { RolesManager } from '@/components/settings/RolesManager';
import { PaymentDaySettings } from '@/components/settings/PaymentDaySettings';
import { HubspotIntegration } from '@/components/settings/HubspotIntegration';
import { MetaIntegration } from '@/components/settings/MetaIntegration';
import { WhatsappTemplatesManager } from '@/components/settings/WhatsappTemplatesManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="whatsapp">Plantillas WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <PaymentDaySettings />
          <RolesManager />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <HubspotIntegration />
          <MetaIntegration />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsappTemplatesManager />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
