import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  AlertCircle, 
  Trophy, 
  Wallet,
  ExternalLink,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function SuperadminDashboard() {
  const stats = [
    {
      title: 'Eventos Hoy',
      value: '3',
      icon: Calendar,
      trend: '+2 vs ayer',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Tickets Pendientes',
      value: '7',
      icon: AlertCircle,
      trend: '2 urgentes',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Usuarios Pendientes',
      value: '5',
      icon: Users,
      trend: 'Requieren aprobación',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Rendiciones Abiertas',
      value: '12',
      icon: Wallet,
      trend: '$2.5M pendientes',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const topAcreditadores = [
    { name: 'María González', events: 45, rating: 4.9 },
    { name: 'Carlos Pérez', events: 38, rating: 4.8 },
    { name: 'Ana Rodríguez', events: 35, rating: 4.7 },
    { name: 'Juan Martínez', events: 32, rating: 4.6 },
    { name: 'Laura Sánchez', events: 28, rating: 4.5 },
  ];

  const quickLinks = [
    { label: 'Trello', url: '#', icon: ExternalLink },
    { label: 'HubSpot', url: '#', icon: ExternalLink },
    { label: 'Calendario', url: '#', icon: Calendar },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Superadmin"
        description="Vista general del sistema"
        breadcrumbs={[
          { label: 'Dashboard' },
        ]}
        actions={
          <Button>
            <Users className="w-4 h-4 mr-2" />
            Aprobar usuarios
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover-lift animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Acreditadores */}
        <Card className="lg:col-span-2 animate-fade-in-up animation-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Top 5 Acreditadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAcreditadores.map((acreditador, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted smooth-transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full gradient-primary text-white font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{acreditador.name}</p>
                      <p className="text-sm text-muted-foreground">{acreditador.events} eventos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="font-medium">{acreditador.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links & Actions */}
        <div className="space-y-6">
          <Card className="animate-fade-in-up animation-delay-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Accesos Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted smooth-transition group"
                >
                  <span className="font-medium">{link.label}</span>
                  <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground smooth-transition" />
                </a>
              ))}
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up animation-delay-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-success" />
                Rendiciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Ver todas las rendiciones
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
