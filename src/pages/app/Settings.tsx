import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { RolesManager } from '@/components/settings/RolesManager';
import { PaymentDaySettings } from '@/components/settings/PaymentDaySettings';
import { GlosaModelSettings } from '@/components/settings/GlosaModelSettings';
import { HubspotIntegration } from '@/components/settings/HubspotIntegration';
import { MetaIntegration } from '@/components/settings/MetaIntegration';
import { WhatsappTemplatesManager } from '@/components/settings/WhatsappTemplatesManager';
import { FaqSettings } from '@/components/settings/FaqSettings';
import { DigitalSignatureSettings } from '@/components/settings/DigitalSignatureSettings';
import { PermissionsSettings } from '@/components/settings/PermissionsSettings';
import { ProfileFieldsSettings } from '@/components/settings/ProfileFieldsSettings';
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
          <TabsTrigger value="permisos">Permisos</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="whatsapp">Plantillas WhatsApp</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="firma-digital">Firma Digital</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <PaymentDaySettings />
          <GlosaModelSettings />
          <ProfileFieldsSettings />
          <RolesManager />
        </TabsContent>

        <TabsContent value="permisos">
          <PermissionsSettings />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <HubspotIntegration />
          <MetaIntegration />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsappTemplatesManager />
        </TabsContent>

        <TabsContent value="faqs">
          <FaqSettings />
        </TabsContent>

        <TabsContent value="firma-digital">
          <DigitalSignatureSettings />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
