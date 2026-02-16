import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PenTool, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { LoadingState } from '@/components/ui/LoadingState';
import { DEFAULT_CONTRACT_TEMPLATE, CONTRACT_VARIABLES } from '@/lib/contract-utils';
import { Badge } from '@/components/ui/badge';

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

  const handleLoadDefault = () => {
    setContractText(DEFAULT_CONTRACT_TEMPLATE);
    toast.info('Plantilla por defecto cargada. Recuerde guardar los cambios.');
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5" />
            Texto del Contrato
          </CardTitle>
          <CardDescription>
            Este texto aparecerá cuando un acreditador o supervisor firme digitalmente su contrato.
            Use las variables entre llaves dobles para insertar datos dinámicos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadDefault}>
              <FileText className="h-4 w-4 mr-2" />
              Cargar plantilla por defecto
            </Button>
          </div>
          <Textarea
            placeholder="Escriba aquí el texto del contrato que verán los usuarios al firmar..."
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            rows={18}
            className="font-mono text-sm"
          />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Variables disponibles</CardTitle>
          <CardDescription>
            Estas variables se reemplazan automáticamente con los datos del usuario y evento al momento de firmar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CONTRACT_VARIABLES.map((v) => (
              <div key={v.key} className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">{v.key}</Badge>
                <span className="text-sm text-muted-foreground">{v.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
