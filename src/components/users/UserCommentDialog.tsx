import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function UserCommentDialog({ open, onOpenChange, userId, userName }: UserCommentDialogProps) {
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!comment.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_comments' as any)
        .insert({ user_id: userId, comment: comment.trim() });

      if (error) throw error;

      toast({
        title: 'Comentario guardado',
        description: `Comentario registrado para ${userName}.`,
      });

      setComment('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el comentario.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Comentario para {userName}
          </DialogTitle>
          <DialogDescription>
            Este comentario será visible en el ranking del usuario.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Escribe un comentario..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !comment.trim()}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
