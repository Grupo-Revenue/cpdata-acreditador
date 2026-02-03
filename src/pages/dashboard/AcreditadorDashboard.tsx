import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  FileText, 
  Trophy,
  Clock
} from 'lucide-react';

export default function AcreditadorDashboard() {
  const stats = [
    {
      title: 'Mis Eventos',
      value: '3',
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Boletas Pendientes',
      value: '5',
      icon: FileText,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Mi Ranking',
      value: '#12',
      icon: Trophy,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Horas Este Mes',
      value: '48h',
      icon: Clock,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Mi Dashboard"
        description="Resumen de tu actividad"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in-up animation-delay-200">
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Tus eventos asignados aparecerán aquí.
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animation-delay-300">
          <CardHeader>
            <CardTitle>Boletas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Tus boletas por enviar aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
