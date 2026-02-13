import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { LoadingState } from '@/components/ui/LoadingState';

export function GlosaModelSettings() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'modelo_glosa')
        .maybeSingle();
      if (data?.value) setValue(data.value);
      setLoading(false);
    }
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: 'modelo_glosa', value, description: 'Modelo de glosa para boletas SII' },
        { onConflict: 'key' }
      );
    setSaving(false);
    if (error) {
      toast.error('Error al guardar el modelo de glosa');
    } else {
      toast.success('Modelo de glosa actualizado');
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
          <FileText className="w-5 h-5" />
          Modelo de Glosa
        </CardTitle>
        <CardDescription>
          Texto de referencia para que los usuarios sepan qué escribir en la glosa al emitir su boleta en SII
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escriba aquí el modelo de glosa..."
          rows={6}
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </CardContent>
    </Card>
  );
}
