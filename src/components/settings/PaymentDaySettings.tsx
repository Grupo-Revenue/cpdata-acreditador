import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { LoadingState } from '@/components/ui/LoadingState';

const PAYMENT_DAY_OPTIONS = [
  { value: '5', label: 'Día 5 del mes' },
  { value: '15', label: 'Día 15 del mes' },
  { value: '25', label: 'Día 25 del mes' },
];

export function PaymentDaySettings() {
  const [value, setValue] = useState<string>('5');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'payment_day')
        .maybeSingle();
      if (data?.value) setValue(data.value);
      setLoading(false);
    }
    fetch();
  }, []);

  const handleChange = async (newValue: string) => {
    setValue(newValue);
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: 'payment_day', value: newValue, description: 'Día de pago mensual' },
        { onConflict: 'key' }
      );
    if (error) {
      toast.error('Error al guardar el día de pago');
    } else {
      toast.success('Día de pago actualizado');
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
          <CalendarDays className="w-5 h-5" />
          Día de Pago
        </CardTitle>
        <CardDescription>
          Selecciona el día del mes en que se realizan los pagos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={handleChange} className="flex flex-col gap-3">
          {PAYMENT_DAY_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-2">
              <RadioGroupItem value={opt.value} id={`pay-${opt.value}`} />
              <Label htmlFor={`pay-${opt.value}`} className="cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
