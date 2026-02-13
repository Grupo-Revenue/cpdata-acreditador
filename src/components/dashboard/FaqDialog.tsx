import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';

interface Faq {
  pregunta: string;
  respuesta: string;
}

interface FaqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaqDialog({ open, onOpenChange }: FaqDialogProps) {
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'faqs')
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return [] as Faq[];
      try {
        return JSON.parse(data.value) as Faq[];
      } catch {
        return [] as Faq[];
      }
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Preguntas Frecuentes
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <LoadingState text="Cargando FAQs..." />
        ) : faqs && faqs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger>{faq.pregunta}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{faq.respuesta}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No hay preguntas frecuentes configuradas.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
