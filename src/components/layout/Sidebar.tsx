import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Shield,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Wallet,
  HeadphonesIcon,
  Trophy,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  description: string;
  href: string;
  roles?: string[];
  permissionKey?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', description: 'Resumen general y métricas', href: '/app/dashboard', permissionKey: 'nav.dashboard' },
  { icon: Users, label: 'Usuarios', description: 'Gestionar acreditadores y roles', href: '/app/users', permissionKey: 'nav.users' },
  { icon: Calendar, label: 'Eventos', description: 'Eventos y asignación de equipos', href: '/app/events', permissionKey: 'nav.events' },
  { icon: FileText, label: 'Boletas', description: 'Subir y gestionar boletas', href: '/app/invoices', permissionKey: 'nav.invoices' },
  { icon: Wallet, label: 'Rendiciones', description: 'Control de gastos y rendiciones', href: '/app/reimbursements', permissionKey: 'nav.reimbursements' },
  { icon: HeadphonesIcon, label: 'Soporte', description: 'Tickets de ayuda y consultas', href: '/app/support', permissionKey: 'nav.support' },
  { icon: Trophy, label: 'Ranking', description: 'Ranking de acreditadores', href: '/app/ranking', permissionKey: 'nav.ranking' },
  { icon: Settings, label: 'Configuración', description: 'Parámetros del sistema', href: '/app/settings', roles: ['superadmin'] },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const location = useLocation();
  const { roles, activeRole, signOut, profile } = useAuth();
  const { canAccess, isLoading: permissionsLoading } = usePermissions();

  const filteredNavItems = navItems.filter(item => {
    if (item.permissionKey) {
      if (!canAccess(item.permissionKey)) return false;
    } else if (item.roles) {
      if (!(activeRole ? item.roles.includes(activeRole) : false)) return false;
    }
    return true;
  });

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname.startsWith(item.href);
    const Icon = item.icon;

    const content = (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg smooth-transition',
          collapsed ? '' : 'py-2.5',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm">{item.label}</span>
            <span className={cn(
              'text-xs truncate',
              isActive ? 'text-sidebar-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {item.description}
            </span>
          </div>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border smooth-transition flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-b border-sidebar-border',
        collapsed && 'justify-center'
      )}>
        <div className="p-1.5 rounded-lg gradient-primary">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sidebar-foreground">Acreditación</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {permissionsLoading && activeRole !== 'superadmin' ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg',
                collapsed ? 'justify-center' : ''
              )}
            >
              <div className="w-5 h-5 rounded bg-muted animate-pulse shrink-0" />
              {!collapsed && <div className="h-4 rounded bg-muted animate-pulse flex-1" />}
            </div>
          ))
        ) : (
          filteredNavItems.map(item => (
            <NavItemComponent key={item.href} item={item} />
          ))
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* User info */}
        {!collapsed && profile && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile.nombre} {profile.apellido}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile.email}
            </p>
          </div>
        )}

        {/* Logout button */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={signOut}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive smooth-transition',
                collapsed && 'justify-center'
              )}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="font-medium">Cerrar sesión</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium">
              Cerrar sesión
            </TooltipContent>
          )}
        </Tooltip>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapse(!collapsed)}
          className="w-full justify-center"
        >
          <ChevronLeft className={cn(
            'w-4 h-4 smooth-transition',
            collapsed && 'rotate-180'
          )} />
        </Button>
      </div>
    </aside>
  );
}
