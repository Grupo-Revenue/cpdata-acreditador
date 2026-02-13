import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { HelpCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { LoadingState } from '@/components/ui/LoadingState';

interface Faq {
  pregunta: string;
  respuesta: string;
}

export function FaqSettings() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'faqs')
        .maybeSingle();
      if (data?.value) {
        try {
          setFaqs(JSON.parse(data.value));
        } catch {}
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
        { key: 'faqs', value: JSON.stringify(faqs), description: 'Preguntas frecuentes para acreditadores' },
        { onConflict: 'key' }
      );
    setSaving(false);
    if (error) {
      toast.error('Error al guardar las FAQs');
    } else {
      toast.success('FAQs actualizadas');
    }
  };

  const addFaq = () => setFaqs([...faqs, { pregunta: '', respuesta: '' }]);

  const removeFaq = (index: number) => setFaqs(faqs.filter((_, i) => i !== index));

  const updateFaq = (index: number, field: keyof Faq, value: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingState text="Cargando FAQs..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Preguntas Frecuentes (FAQs)
        </CardTitle>
        <CardDescription>
          Preguntas y respuestas visibles para los acreditadores desde su dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Pregunta {index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeFaq(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Pregunta"
              value={faq.pregunta}
              onChange={(e) => updateFaq(index, 'pregunta', e.target.value)}
            />
            <Textarea
              placeholder="Respuesta"
              value={faq.respuesta}
              onChange={(e) => updateFaq(index, 'respuesta', e.target.value)}
              rows={3}
            />
          </div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" onClick={addFaq}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar FAQ
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
