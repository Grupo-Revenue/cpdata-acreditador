import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { LoadingState } from '@/components/ui/LoadingState';

export type ProfileVisibleFields = Record<string, boolean>;

const FIELD_GROUPS = [
  {
    label: 'Información personal',
    fields: [
      { key: 'telefono', label: 'Teléfono' },
      { key: 'referencia_contacto', label: 'Referencia de contacto' },
    ],
  },
  {
    label: 'Información adicional',
    fields: [
      { key: 'idioma', label: 'Idiomas' },
      { key: 'altura', label: 'Estatura' },
      { key: 'talla_polera', label: 'Talla de polera' },
      { key: 'fecha_nacimiento', label: 'Fecha de nacimiento' },
      { key: 'comuna', label: 'Comuna' },
      { key: 'disponibilidad_horaria', label: 'Disponibilidad horaria' },
      { key: 'instagram', label: 'Instagram' },
      { key: 'facebook', label: 'Facebook' },
      { key: 'universidad', label: 'Universidad' },
      { key: 'carrera', label: 'Carrera' },
      { key: 'semestre', label: 'Semestre' },
    ],
  },
  {
    label: 'Contacto de emergencia',
    fields: [
      { key: 'contacto_emergencia_nombre', label: 'Nombre del contacto' },
      { key: 'contacto_emergencia_email', label: 'Email del contacto' },
      { key: 'contacto_emergencia_telefono', label: 'Celular del contacto' },
    ],
  },
  {
    label: 'Datos bancarios',
    fields: [
      { key: 'banco', label: 'Banco' },
      { key: 'tipo_cuenta', label: 'Tipo de cuenta' },
      { key: 'numero_cuenta', label: 'Número de cuenta' },
    ],
  },
];

const ALL_FIELD_KEYS = FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

function buildDefaults(): ProfileVisibleFields {
  return Object.fromEntries(ALL_FIELD_KEYS.map((k) => [k, true]));
}

export function ProfileFieldsSettings() {
  const [fields, setFields] = useState<ProfileVisibleFields>(buildDefaults());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'profile_visible_fields')
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          setFields({ ...buildDefaults(), ...parsed });
        } catch {
          // keep defaults
        }
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleToggle = async (key: string, checked: boolean) => {
    const updated = { ...fields, [key]: checked };
    setFields(updated);

    const { error } = await supabase
      .from('settings')
      .upsert(
        {
          key: 'profile_visible_fields',
          value: JSON.stringify(updated),
          description: 'Campos visibles en el perfil de usuario',
        },
        { onConflict: 'key' }
      );

    if (error) {
      toast.error('Error al guardar la configuración');
      setFields({ ...fields }); // revert
    } else {
      toast.success('Configuración actualizada');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingState text="Cargando configuración..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          Campos del Perfil
        </CardTitle>
        <CardDescription>
          Activa o desactiva los campos que se mostrarán en el perfil de todos los usuarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {FIELD_GROUPS.map((group) => (
          <div key={group.label} className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {group.label}
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.fields.map((f) => (
                <div key={f.key} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <Label htmlFor={`field-${f.key}`} className="cursor-pointer text-sm">
                    {f.label}
                  </Label>
                  <Switch
                    id={`field-${f.key}`}
                    checked={fields[f.key] ?? true}
                    onCheckedChange={(checked) => handleToggle(f.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

