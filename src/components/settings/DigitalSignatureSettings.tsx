import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PenTool } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { LoadingState } from '@/components/ui/LoadingState';

export function DigitalSignatureSettings() {
  const [contractText, setContractText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'digital_signature_text')
        .maybeSingle();
      if (data?.value) {
        setContractText(data.value);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: 'digital_signature_text', value: contractText, description: 'Texto del contrato para firma digital' },
        { onConflict: 'key' }
      );
    setSaving(false);
    if (error) {
      toast.error('Error al guardar el texto del contrato');
    } else {
      toast.success('Texto del contrato actualizado');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingState text="Cargando texto del contrato..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="w-5 h-5" />
          Texto del Contrato
        </CardTitle>
        <CardDescription>
          Este texto aparecerá cuando un acreditador o supervisor firme digitalmente su contrato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Escriba aquí el texto del contrato que verán los usuarios al firmar..."
          value={contractText}
          onChange={(e) => setContractText(e.target.value)}
          rows={15}
          className="font-mono text-sm"
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </CardContent>
    </Card>
  );
}
