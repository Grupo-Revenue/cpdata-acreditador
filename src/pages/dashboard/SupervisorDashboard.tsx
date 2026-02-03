import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  CheckCircle,
  Clock
} from 'lucide-react';

export default function SupervisorDashboard() {
  const stats = [
    {
      title: 'Eventos Supervisando',
      value: '5',
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Acreditadores Asignados',
      value: '12',
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Completados Hoy',
      value: '8',
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Pendientes',
      value: '4',
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Supervisor"
        description="Control de eventos y acreditadores"
        breadcrumbs={[
          { label: 'Dashboard' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover-lift animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="animate-fade-in-up animation-delay-200">
        <CardHeader>
          <CardTitle>Estado de Acreditadores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            El estado de los acreditadores asignados aparecerá aquí.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
