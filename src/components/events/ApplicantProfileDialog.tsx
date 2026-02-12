import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface ProfileData {
  nombre: string;
  apellido: string;
  rut: string;
  email: string;
  telefono: string | null;
  referencia_contacto: string | null;
  idioma: string | null;
  altura: string | null;
  universidad: string | null;
  carrera: string | null;
  banco: string | null;
  numero_cuenta: string | null;
  tipo_cuenta: string | null;
  ranking: number | null;
  foto_url: string | null;
  role: string;
}

interface ApplicantProfileDialogProps {
  profile: ProfileData | null;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm rounded-md bg-muted px-3 py-2">{value || '—'}</p>
    </div>
  );
}

export function ApplicantProfileDialog({ profile, onClose }: ApplicantProfileDialogProps) {
  if (!profile) return null;

  const initials = `${profile.nombre?.[0] ?? ''}${profile.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <Dialog open={!!profile} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.foto_url ?? undefined} alt={`${profile.nombre} ${profile.apellido}`} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{profile.nombre} {profile.apellido}</DialogTitle>
              <Badge variant="secondary" className="mt-1">{profile.role}</Badge>
            </div>
          </div>
          <DialogDescription className="sr-only">Perfil del postulante</DialogDescription>
        </DialogHeader>

        {/* Cuenta */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Cuenta</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="RUT" value={profile.rut} />
            <Field label="Email" value={profile.email} />
          </div>
        </div>

        {/* Personal */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Personal</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono" value={profile.telefono} />
            <Field label="Referencia de contacto" value={profile.referencia_contacto} />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Idiomas</p>
              <div className="flex flex-wrap gap-1.5 rounded-md bg-muted px-3 py-2 min-h-[36px]">
                {profile.idioma ? profile.idioma.split(',').map(s => s.trim()).filter(Boolean).map((lang, i) => (
                  <Badge key={i} variant="secondary">{lang}</Badge>
                )) : <span className="text-sm">—</span>}
              </div>
            </div>
            <Field label="Altura" value={profile.altura} />
          </div>
        </div>

        {/* Académico */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Académico</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Universidad" value={profile.universidad} />
            <Field label="Carrera" value={profile.carrera} />
          </div>
        </div>

        {/* Bancario */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Bancario</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Banco" value={profile.banco} />
            <Field label="Número de cuenta" value={profile.numero_cuenta} />
            <Field label="Tipo de cuenta" value={profile.tipo_cuenta} />
          </div>
        </div>

        {/* Ranking */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Ranking</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ranking" value={profile.ranking?.toString()} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
