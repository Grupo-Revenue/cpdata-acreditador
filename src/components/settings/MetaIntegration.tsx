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
import { Eye, EyeOff, Save, Trash2, MessageCircle } from 'lucide-react';

const META_KEYS = ['meta_access_token', 'meta_phone_number_id'] as const;

export function MetaIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tokenInput, setTokenInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', 'meta'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', [...META_KEYS]);
      if (error) throw error;
      const map: Record<string, string | null> = {};
      data?.forEach((s) => { map[s.key] = s.value; });
      return map;
    },
  });

  const hasConfig = !!(settings?.meta_access_token && settings?.meta_phone_number_id);

  const saveMutation = useMutation({
    mutationFn: async ({ token, phone }: { token: string; phone: string }) => {
      const rows = [
        { key: 'meta_access_token', value: token, description: 'Token de acceso de Meta' },
        { key: 'meta_phone_number_id', value: phone, description: 'Phone Number ID de WhatsApp Business' },
      ];
      for (const row of rows) {
        const { error } = await supabase.from('settings').upsert(row, { onConflict: 'key' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'meta'] });
      toast({ title: 'Configuración guardada', description: 'La integración con Meta fue configurada correctamente.' });
      setTokenInput('');
      setPhoneInput('');
      setIsEditing(false);
      setShowToken(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo guardar la configuración.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('settings').delete().in('key', [...META_KEYS]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'meta'] });
      toast({ title: 'Configuración eliminada', description: 'La integración con Meta fue desconectada.' });
      setTokenInput('');
      setPhoneInput('');
      setIsEditing(false);
      setShowToken(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo eliminar la configuración.', variant: 'destructive' });
    },
  });

  const maskValue = (val: string) => {
    if (val.length <= 8) return '••••••••';
    return '••••••••' + val.slice(-4);
  };

  const handleSave = () => {
    if (!tokenInput.trim() || !phoneInput.trim()) return;
    saveMutation.mutate({ token: tokenInput.trim(), phone: phoneInput.trim() });
  };

  if (isLoading) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-accent">
                <MessageCircle className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Integración Meta / WhatsApp</CardTitle>
                <CardDescription>Configura la conexión con WhatsApp Business API</CardDescription>
              </div>
            </div>
            <Badge variant={hasConfig ? 'default' : 'secondary'}>
              {hasConfig ? 'Conectado' : 'No configurado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token */}
          <div className="space-y-2">
            <Label>Token de acceso de Meta</Label>
            {!isEditing && hasConfig ? (
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={showToken ? (settings?.meta_access_token ?? '') : maskValue(settings?.meta_access_token ?? '')}
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
                  placeholder="EAAxxxxxxxx..."
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

          {/* Phone Number ID */}
          <div className="space-y-2">
            <Label>Phone Number ID</Label>
            {!isEditing && hasConfig ? (
              <Input readOnly value={settings?.meta_phone_number_id ?? ''} className="font-mono" />
            ) : (
              <Input
                placeholder="123456789012345"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="font-mono"
              />
            )}
          </div>

          <div className="flex gap-2 justify-end">
            {!isEditing && hasConfig ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Cambiar configuración
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={deleteMutation.isPending}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </>
            ) : (
              <>
                {hasConfig && (
                  <Button variant="ghost" onClick={() => { setIsEditing(false); setTokenInput(''); setPhoneInput(''); }}>
                    Cancelar
                  </Button>
                )}
                <Button onClick={handleSave} disabled={!tokenInput.trim() || !phoneInput.trim() || saveMutation.isPending}>
                  <Save className="w-4 h-4 mr-1" />
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Eliminar integración Meta"
        description="¿Estás seguro de que deseas eliminar la configuración? Esto desconectará la integración con WhatsApp Business."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => { deleteMutation.mutate(); setShowDeleteDialog(false); }}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
