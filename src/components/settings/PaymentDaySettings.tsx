import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { LoadingState } from '@/components/ui/LoadingState';

export function PaymentDaySettings() {
  const [days, setDays] = useState<[number, number, number]>([5, 15, 25]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'payment_days')
        .maybeSingle();
      if (data?.value) {
        const parsed = data.value.split(',').map(Number);
        if (parsed.length === 3 && parsed.every((n) => n >= 1 && n <= 28)) {
          setDays(parsed as [number, number, number]);
        }
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleChange = async (index: number, raw: string) => {
    const num = parseInt(raw, 10);
    if (isNaN(num) || num < 1 || num > 28) return;

    const updated = [...days] as [number, number, number];
    updated[index] = num;

    // Validate: no duplicates
    if (new Set(updated).size !== 3) {
      toast.error('Los días no pueden repetirse');
      return;
    }

    // Sort ascending
    const sorted = [...updated].sort((a, b) => a - b) as [number, number, number];
    setDays(sorted);

    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: 'payment_days', value: sorted.join(','), description: 'Días de pago mensuales' },
        { onConflict: 'key' }
      );
    if (error) {
      toast.error('Error al guardar los días de pago');
    } else {
      toast.success('Días de pago actualizados');
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
          Días de Pago
        </CardTitle>
        <CardDescription>
          Define los 3 días del mes en que se realizan los pagos (valores entre 1 y 28)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {days.map((day, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Label htmlFor={`pay-day-${i}`}>Día {i + 1}</Label>
              <Input
                id={`pay-day-${i}`}
                type="number"
                min={1}
                max={28}
                value={day}
                onChange={(e) => handleChange(i, e.target.value)}
                className="w-20"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
