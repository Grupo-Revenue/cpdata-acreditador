import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface HubSpotDeal {
  id: string;
  dealname: string | null;
  nombre_del_evento: string | null;
  tipo_de_evento: string | null;
  cantidad_de_asistentes: string | null;
  locacion_del_evento: string | null;
  hora_de_inicio_y_fin_del_evento: string | null;
  fecha_inicio_del_evento: string | null;
  fecha_fin_del_evento: string | null;
  dealstage: string | null;
}

interface EventEditDialogProps {
  deal: HubSpotDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventEditDialog({ deal, open, onOpenChange }: EventEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nombre_del_evento: '',
    tipo_de_evento: '',
    cantidad_de_asistentes: '',
    locacion_del_evento: '',
    hora_de_inicio_y_fin_del_evento: '',
    fecha_inicio_del_evento: '',
    fecha_fin_del_evento: '',
  });

  useEffect(() => {
    if (deal) {
      setFormData({
        nombre_del_evento: deal.nombre_del_evento ?? '',
        tipo_de_evento: deal.tipo_de_evento ?? '',
        cantidad_de_asistentes: deal.cantidad_de_asistentes ?? '',
        locacion_del_evento: deal.locacion_del_evento ?? '',
        hora_de_inicio_y_fin_del_evento: deal.hora_de_inicio_y_fin_del_evento ?? '',
        fecha_inicio_del_evento: deal.fecha_inicio_del_evento ?? '',
        fecha_fin_del_evento: deal.fecha_fin_del_evento ?? '',
      });
    }
  }, [deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;

    setIsLoading(true);
    try {
      // Build properties object, only include non-empty changed values
      const properties: Record<string, string> = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value.trim() !== '') {
          properties[key] = value.trim();
        }
      }

      const { data, error } = await supabase.functions.invoke('hubspot-update-deal', {
        body: { dealId: deal.id, properties },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Evento actualizado',
        description: 'Los cambios se sincronizaron con HubSpot correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['hubspot-deals'] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'No se pudo actualizar el evento.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
          <DialogDescription>
            Modifica las propiedades del evento. Los cambios se sincronizarán con HubSpot.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dealname">Id</Label>
              <Input id="dealname" value={deal?.dealname ?? ''} disabled className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dealstage">Etapa</Label>
              <Input id="dealstage" value={deal?.dealstage ?? ''} disabled className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nombre_del_evento">Nombre del Evento</Label>
              <Input
                id="nombre_del_evento"
                value={formData.nombre_del_evento}
                onChange={(e) => update('nombre_del_evento', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tipo_de_evento">Tipo</Label>
              <Input
                id="tipo_de_evento"
                value={formData.tipo_de_evento}
                onChange={(e) => update('tipo_de_evento', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cantidad_de_asistentes">Asistentes</Label>
              <Input
                id="cantidad_de_asistentes"
                value={formData.cantidad_de_asistentes}
                onChange={(e) => update('cantidad_de_asistentes', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="locacion_del_evento">Locación</Label>
              <Input
                id="locacion_del_evento"
                value={formData.locacion_del_evento}
                onChange={(e) => update('locacion_del_evento', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hora_de_inicio_y_fin_del_evento">Horario</Label>
              <Input
                id="hora_de_inicio_y_fin_del_evento"
                value={formData.hora_de_inicio_y_fin_del_evento}
                onChange={(e) => update('hora_de_inicio_y_fin_del_evento', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fecha_inicio_del_evento">Fecha Inicio</Label>
              <Input
                id="fecha_inicio_del_evento"
                value={formData.fecha_inicio_del_evento}
                onChange={(e) => update('fecha_inicio_del_evento', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fecha_fin_del_evento">Fecha Fin</Label>
              <Input
                id="fecha_fin_del_evento"
                value={formData.fecha_fin_del_evento}
                onChange={(e) => update('fecha_fin_del_evento', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
