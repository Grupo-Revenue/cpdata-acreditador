import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { LoadingState } from '@/components/ui/LoadingState';

type Priority = 'alta' | 'media' | 'baja';

interface Category {
  name: string;
  priority: Priority;
}

export function TicketCategoriesSettings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'ticket_categories')
        .maybeSingle();
      if (data?.value) {
        try {
          setCategories(JSON.parse(data.value));
        } catch {}
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleSave = async () => {
    const cleaned = categories.filter((c) => c.name.trim());
    setSaving(true);
    const { error } = await supabase
      .from('settings')
      .upsert(
        {
          key: 'ticket_categories',
          value: JSON.stringify(cleaned),
          description: 'Categorías de tickets de soporte con su prioridad asociada',
        },
        { onConflict: 'key' }
      );
    setSaving(false);
    if (error) {
      toast.error('Error al guardar las categorías');
    } else {
      toast.success('Categorías actualizadas');
      setCategories(cleaned);
    }
  };

  const addCategory = () => setCategories([...categories, { name: '', priority: 'media' }]);
  const removeCategory = (index: number) => setCategories(categories.filter((_, i) => i !== index));
  const updateCategory = (index: number, field: keyof Category, value: string) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value as any };
    setCategories(updated);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingState text="Cargando categorías..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Clasificación de Tickets de Soporte
        </CardTitle>
        <CardDescription>
          Define categorías y su prioridad. Al crear un ticket, la prioridad se asignará automáticamente según la categoría elegida.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay categorías configuradas.</p>
        )}
        {categories.map((cat, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 border rounded-lg">
            <Input
              placeholder="Nombre de la categoría (ej. Boletas)"
              value={cat.name}
              onChange={(e) => updateCategory(index, 'name', e.target.value)}
              className="flex-1"
            />
            <Select value={cat.priority} onValueChange={(v) => updateCategory(index, 'priority', v)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive"
              onClick={() => removeCategory(index)}
              title="Eliminar categoría"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" onClick={addCategory}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar categoría
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
