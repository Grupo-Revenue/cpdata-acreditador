import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, type AppRole } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TopbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function Topbar({ onMenuClick, sidebarCollapsed }: TopbarProps) {
  const { profile, signOut, roles } = useAuth();

  const initials = profile
    ? `${profile.nombre.charAt(0)}${profile.apellido.charAt(0)}`
    : '??';

  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    administracion: 'Administración',
    supervisor: 'Supervisor',
    acreditador: 'Acreditador',
  };

  // Obtener el rol principal (el de mayor jerarquía)
  const getPrimaryRole = () => {
    const hierarchy: AppRole[] = ['superadmin', 'administracion', 'supervisor', 'acreditador'];
    for (const role of hierarchy) {
      if (roles.includes(role)) {
        return roleLabels[role] || role;
      }
    }
    return null;
  };

  const primaryRole = getPrimaryRole();

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          {/* Role badge */}
          {primaryRole && (
            <span className="hidden sm:inline-flex text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
              {primaryRole}
            </span>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.foto_url || undefined} alt={profile?.nombre} />
                  <AvatarFallback className="gradient-primary text-white text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.nombre} {profile?.apellido}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {roles.map(role => (
                      <span
                        key={role}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                      >
                        {roleLabels[role] || role}
                      </span>
                    ))}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={signOut}
              >
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
