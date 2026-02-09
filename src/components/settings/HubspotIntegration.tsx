import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Save, Trash2, Link2 } from 'lucide-react';

export function HubspotIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: setting, isLoading } = useQuery({
    queryKey: ['settings', 'hubspot_token'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'hubspot_token')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const hasToken = !!setting?.value;

  const saveMutation = useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase
        .from('settings')
        .upsert(
          { key: 'hubspot_token', value: token, description: 'Token de acceso privado de HubSpot' },
          { onConflict: 'key' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'hubspot_token'] });
      toast({ title: 'Token guardado', description: 'El token de HubSpot se guardó correctamente.' });
      setTokenInput('');
      setIsEditing(false);
      setShowToken(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo guardar el token.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('settings')
        .delete()
        .eq('key', 'hubspot_token');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'hubspot_token'] });
      toast({ title: 'Token eliminado', description: 'La integración con HubSpot fue desconectada.' });
      setTokenInput('');
      setIsEditing(false);
      setShowToken(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo eliminar el token.', variant: 'destructive' });
    },
  });

  const maskToken = (token: string) => {
    if (token.length <= 8) return '••••••••';
    return '••••••••' + token.slice(-4);
  };

  const handleSave = () => {
    if (!tokenInput.trim()) return;
    saveMutation.mutate(tokenInput.trim());
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setTokenInput('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTokenInput('');
  };

  if (isLoading) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-accent">
                <Link2 className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Integración HubSpot</CardTitle>
                <CardDescription>Configura la conexión con HubSpot para todo el sistema</CardDescription>
              </div>
            </div>
            <Badge variant={hasToken ? 'default' : 'secondary'}>
              {hasToken ? 'Conectado' : 'No configurado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Token de acceso</Label>
            {!isEditing && hasToken ? (
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={showToken ? (setting?.value ?? '') : maskToken(setting?.value ?? '')}
                  className="font-mono"
                />
                <Button variant="ghost" size="icon" onClick={() => setShowToken(!showToken)}>
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type={showToken ? 'text' : 'password'}
                  placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="font-mono"
                />
                <Button variant="ghost" size="icon" onClick={() => setShowToken(!showToken)}>
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            {!isEditing && hasToken ? (
              <>
                <Button variant="outline" onClick={handleStartEdit}>
                  Cambiar Token
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </>
            ) : (
              <>
                {hasToken && (
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleSave} disabled={!tokenInput.trim() || saveMutation.isPending}>
                  <Save className="w-4 h-4 mr-1" />
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar Token'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Eliminar token de HubSpot"
        description="¿Estás seguro de que deseas eliminar el token? Esto desconectará la integración con HubSpot para todo el sistema."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => {
          deleteMutation.mutate();
          setShowDeleteDialog(false);
        }}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
