import { AppRole } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Shield, Settings, Eye, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; description: string }> = {
  superadmin: { label: 'Superadmin', icon: Shield, description: 'Acceso completo al sistema' },
  administracion: { label: 'Administración', icon: Settings, description: 'Gestión administrativa' },
  supervisor: { label: 'Supervisor', icon: Eye, description: 'Supervisión de eventos' },
  acreditador: { label: 'Acreditador', icon: BadgeCheck, description: 'Acreditación en terreno' },
};

interface RoleSelectDialogProps {
  open: boolean;
  roles: AppRole[];
  onSelect: (role: AppRole) => void;
}

export function RoleSelectDialog({ open, roles, onSelect }: RoleSelectDialogProps) {
  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Hide the close button via CSS
        style={{ position: 'fixed' }}
      >
        {/* Hide the default close X button */}
        <style>{`.absolute.right-4.top-4 { display: none !important; }`}</style>
        <DialogHeader>
          <DialogTitle className="text-center">Selecciona tu rol</DialogTitle>
          <DialogDescription className="text-center">
            Elige con qué rol deseas ingresar al sistema
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {roles.map((role) => {
            const config = roleConfig[role];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <button
                key={role}
                onClick={() => onSelect(role)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border border-border',
                  'hover:bg-accent hover:border-primary/50 smooth-transition',
                  'text-left w-full'
                )}
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{config.label}</p>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
