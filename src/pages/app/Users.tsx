import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Users, Check, X, RefreshCw, UserPlus, Upload, MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UsersTable } from '@/components/users/UsersTable';
import { UserEditDialog } from '@/components/users/UserEditDialog';
import { UserRolesDialog } from '@/components/users/UserRolesDialog';
import { UserCreateDialog } from '@/components/users/UserCreateDialog';
import { UserBulkUploadDialog } from '@/components/users/UserBulkUploadDialog';
import { UserCommentDialog } from '@/components/users/UserCommentDialog';
import { UserWithRoles } from '@/components/users/types';

interface PendingUser {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  referencia_contacto: string | null;
  created_at: string;
}

interface WhatsappTemplate {
  id: string;
  name: string;
  body_text: string;
  language: string;
  status: string;
}

export default function UsersPage() {
  const { hasRole } = useAuth();
  const isSuperadmin = hasRole('superadmin');

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dialog states
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [managingRolesUser, setManagingRolesUser] = useState<UserWithRoles | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithRoles | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [commentingUser, setCommentingUser] = useState<UserWithRoles | null>(null);

  // Bulk WhatsApp states
  const [showBulkWhatsappDialog, setShowBulkWhatsappDialog] = useState(false);
  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsappTemplate[]>([]);
  const [bulkWhatsappTemplate, setBulkWhatsappTemplate] = useState<string>('');
  const [selectedWhatsappUsers, setSelectedWhatsappUsers] = useState<Set<string>>(new Set());
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkWhatsappSearch, setBulkWhatsappSearch] = useState('');
  const [bulkWhatsappRoleFilter, setBulkWhatsappRoleFilter] = useState('');
  
  const { toast } = useToast();

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los usuarios pendientes.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    if (!isSuperadmin) return;
    
    setIsLoadingAll(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        ...profile,
        roles: (userRoles?.filter((r) => r.user_id === profile.id).map((r) => r.role) || []) as AppRole[],
      }));

      setAllUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching all users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los usuarios.',
      });
    } finally {
      setIsLoadingAll(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
    if (isSuperadmin) {
      fetchAllUsers();
    }
  }, [isSuperadmin]);

  const handleRefresh = () => {
    fetchPendingUsers();
    if (isSuperadmin) {
      fetchAllUsers();
    }
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      // Update approval status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      // Check if user already has roles assigned
      const { data: existingRoles, error: rolesCheckError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', selectedUser.id);

      if (rolesCheckError) throw rolesCheckError;

      // Only assign default role if user has no roles
      if (!existingRoles || existingRoles.length === 0) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: selectedUser.id, role: 'acreditador' });

        if (roleError) throw roleError;
      }

      // Send welcome WhatsApp message
      const phone = selectedUser.telefono?.trim();
      if (phone) {
        try {
          const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              template_name: 'msg_bienvenida',
              template_language: 'es',
              to_phone: phone,
              parameters: [selectedUser.nombre],
            },
          });
          if (whatsappError) {
            console.error('WhatsApp send error:', whatsappError);
            toast({
              variant: 'default',
              title: 'Usuario aprobado',
              description: `${selectedUser.nombre} fue aprobado, pero no se pudo enviar el WhatsApp de bienvenida.`,
            });
          } else {
            toast({
              title: 'Usuario aprobado',
              description: `${selectedUser.nombre} ${selectedUser.apellido} ha sido aprobado y se envió el WhatsApp de bienvenida.`,
            });
          }
        } catch (e) {
          console.error('WhatsApp send exception:', e);
          toast({
            title: 'Usuario aprobado',
            description: `${selectedUser.nombre} fue aprobado, pero falló el envío del WhatsApp.`,
          });
        }
      } else {
        toast({
          title: 'Usuario aprobado',
          description: `${selectedUser.nombre} ${selectedUser.apellido} ha sido aprobado. No tiene teléfono para enviar WhatsApp.`,
        });
      }

      handleRefresh();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo aprobar el usuario.',
      });
    } finally {
      setIsProcessing(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false, approval_status: 'rejected' })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Usuario rechazado',
        description: `${selectedUser.nombre} ${selectedUser.apellido} ha sido rechazado.`,
      });

      handleRefresh();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo rechazar el usuario.',
      });
    } finally {
      setIsProcessing(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: deletingUser.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Usuario eliminado',
        description: `${deletingUser.nombre || deletingUser.email} ha sido eliminado completamente.`,
      });

      handleRefresh();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'No se pudo eliminar el usuario.',
      });
    } finally {
      setIsDeleting(false);
      setDeletingUser(null);
    }
  };

  // Bulk WhatsApp
  const openBulkWhatsappDialog = async () => {
    // Fetch approved templates
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('id, name, body_text, language, status')
      .eq('status', 'approved');

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las plantillas.' });
      return;
    }

    if (!data || data.length === 0) {
      toast({ variant: 'destructive', title: 'Sin plantillas', description: 'No hay plantillas aprobadas disponibles.' });
      return;
    }

    setWhatsappTemplates(data);
    setBulkWhatsappTemplate('');
    // Pre-select all users with phone
    const usersWithPhone = allUsers.filter(u => !!u.telefono?.trim());
    setSelectedWhatsappUsers(new Set(usersWithPhone.map(u => u.id)));
    setBulkWhatsappSearch('');
    setShowBulkWhatsappDialog(true);
  };

  const usersWithPhone = allUsers.filter(u => !!u.telefono?.trim());
  const filteredUsersWithPhone = usersWithPhone.filter(u => {
    if (!bulkWhatsappSearch.trim()) return true;
    const search = bulkWhatsappSearch.toLowerCase();
    const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
    return fullName.includes(search) || u.telefono?.includes(bulkWhatsappSearch.trim());
  });

  const handleBulkWhatsappSend = async () => {
    if (!bulkWhatsappTemplate || selectedWhatsappUsers.size === 0) return;

    const template = whatsappTemplates.find(t => t.id === bulkWhatsappTemplate);
    if (!template) return;

    setIsSendingBulk(true);
    let sent = 0;
    let failed = 0;

    const targets = usersWithPhone.filter(u => selectedWhatsappUsers.has(u.id));

    for (const user of targets) {
      try {
        const { error } = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            template_name: template.name,
            template_language: template.language || 'es',
            to_phone: user.telefono!.trim(),
            parameters: [user.nombre],
          },
        });
        if (error) {
          failed++;
          console.error(`Failed to send to ${user.nombre}:`, error);
        } else {
          sent++;
        }
      } catch (e) {
        failed++;
        console.error(`Exception sending to ${user.nombre}:`, e);
      }
    }

    setIsSendingBulk(false);
    setShowBulkWhatsappDialog(false);

    toast({
      title: 'Envío masivo completado',
      description: `Enviados: ${sent} | Fallidos: ${failed}`,
    });
  };

  const toggleWhatsappUser = (userId: string) => {
    setSelectedWhatsappUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllWhatsappUsers = () => {
    const allFilteredSelected = filteredUsersWithPhone.every(u => selectedWhatsappUsers.has(u.id));
    setSelectedWhatsappUsers(prev => {
      const next = new Set(prev);
      filteredUsersWithPhone.forEach(u => {
        if (allFilteredSelected) next.delete(u.id);
        else next.add(u.id);
      });
      return next;
    });
  };

  const filterByRole = (role: AppRole) => allUsers.filter(u => u.roles.includes(role));

  const RoleTabContent = ({ role, title, icon }: { role: AppRole; title: string; icon: string }) => {
    const filtered = filterByRole(role);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {title}
            {filtered.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({filtered.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAll ? (
            <LoadingState text="Cargando usuarios..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={`Sin ${title.toLowerCase()}`}
              description={`No hay usuarios con el rol de ${title.toLowerCase()}.`}
            />
          ) : (
            <UsersTable
              users={filtered}
              onEdit={(user) => setEditingUser(user)}
              onManageRoles={(user) => setManagingRolesUser(user)}
              onDelete={(user) => setDeletingUser(user)}
              onComment={(user) => setCommentingUser(user)}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  const PendingUsersContent = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Usuarios Pendientes de Aprobación
          {pendingUsers.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({pendingUsers.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState text="Cargando usuarios..." />
        ) : pendingUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin usuarios pendientes"
            description="No hay usuarios esperando aprobación."
          />
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-muted/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {user.nombre} {user.apellido}
                    </p>
                    <StatusBadge status="pending" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    RUT: {user.rut} • {user.email}
                  </p>
                  {user.telefono && (
                    <p className="text-sm text-muted-foreground">Tel: {user.telefono}</p>
                  )}
                  {user.referencia_contacto && (
                    <p className="text-sm text-muted-foreground">
                      Ref: {user.referencia_contacto}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Registrado: {new Date(user.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setActionType('approve');
                    }}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setSelectedUser(user);
                      setActionType('reject');
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const AllUsersContent = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Todos los Usuarios
          {allUsers.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({allUsers.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingAll ? (
          <LoadingState text="Cargando usuarios..." />
        ) : allUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin usuarios"
            description="No hay usuarios en el sistema."
          />
        ) : (
          <UsersTable
            users={allUsers}
            onEdit={(user) => setEditingUser(user)}
            onManageRoles={(user) => setManagingRolesUser(user)}
            onDelete={(user) => setDeletingUser(user)}
            onComment={(user) => setCommentingUser(user)}
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppShell>
      <PageHeader
        title="Gestión de Usuarios"
        description="Aprobar y gestionar usuarios del sistema"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app/dashboard' },
          { label: 'Usuarios' },
        ]}
        actions={
          <div className="flex gap-2">
            {isSuperadmin && (
              <>
                <Button variant="outline" onClick={openBulkWhatsappDialog}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enviar WhatsApp
                </Button>
                <Button variant="outline" onClick={() => setIsBulkUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Cargar Usuarios
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading || isLoadingAll}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading || isLoadingAll ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        }
      />

      {isSuperadmin ? (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="pending">
              Pendientes
              {pendingUsers.length > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {pendingUsers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">Todos los Usuarios</TabsTrigger>
            <TabsTrigger value="acreditadores">
              Acreditadores
              {filterByRole('acreditador').length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({filterByRole('acreditador').length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="supervisores">
              Supervisores
              {filterByRole('supervisor').length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({filterByRole('supervisor').length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="administradores">
              Administración
              {filterByRole('administracion').length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({filterByRole('administracion').length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            <PendingUsersContent />
          </TabsContent>
          <TabsContent value="all">
            <AllUsersContent />
          </TabsContent>
          <TabsContent value="acreditadores">
            <RoleTabContent role="acreditador" title="Acreditadores" icon="" />
          </TabsContent>
          <TabsContent value="supervisores">
            <RoleTabContent role="supervisor" title="Supervisores" icon="" />
          </TabsContent>
          <TabsContent value="administradores">
            <RoleTabContent role="administracion" title="Administración" icon="" />
          </TabsContent>
        </Tabs>
      ) : (
        <PendingUsersContent />
      )}

      <ConfirmDialog
        open={actionType === 'approve' && !!selectedUser}
        onOpenChange={() => {
          setSelectedUser(null);
          setActionType(null);
        }}
        title="Aprobar usuario"
        description={`¿Estás seguro de aprobar a ${selectedUser?.nombre} ${selectedUser?.apellido}? Se aprobará el acceso. Si no tiene roles asignados, se le asignará Acreditador por defecto.`}
        confirmLabel="Aprobar"
        onConfirm={handleApprove}
        isLoading={isProcessing}
      />

      <ConfirmDialog
        open={actionType === 'reject' && !!selectedUser}
        onOpenChange={() => {
          setSelectedUser(null);
          setActionType(null);
        }}
        title="Rechazar usuario"
        description={`¿Estás seguro de rechazar a ${selectedUser?.nombre} ${selectedUser?.apellido}? El usuario será desactivado.`}
        confirmLabel="Rechazar"
        variant="destructive"
        onConfirm={handleReject}
        isLoading={isProcessing}
      />

      <UserEditDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSuccess={handleRefresh}
      />

      <UserRolesDialog
        user={managingRolesUser}
        open={!!managingRolesUser}
        onOpenChange={(open) => !open && setManagingRolesUser(null)}
        onSuccess={handleRefresh}
      />

      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="Eliminar usuario"
        description={`¿Estás seguro de eliminar a ${deletingUser?.nombre || deletingUser?.email}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
      />

      <UserCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleRefresh}
      />

      <UserBulkUploadDialog
        open={isBulkUploadDialogOpen}
        onOpenChange={setIsBulkUploadDialogOpen}
        onSuccess={handleRefresh}
      />

      {commentingUser && (
        <UserCommentDialog
          open={!!commentingUser}
          onOpenChange={(open) => !open && setCommentingUser(null)}
          userId={commentingUser.id}
          userName={`${commentingUser.nombre} ${commentingUser.apellido}`.trim()}
        />
      )}

      {/* Bulk WhatsApp Dialog */}
      <Dialog open={showBulkWhatsappDialog} onOpenChange={setShowBulkWhatsappDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar WhatsApp Masivo</DialogTitle>
            <DialogDescription>Selecciona una plantilla y los destinatarios para enviar mensajes.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Plantilla</label>
              <Select value={bulkWhatsappTemplate} onValueChange={setBulkWhatsappTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {whatsappTemplates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bulkWhatsappTemplate && (
                <p className="text-xs text-muted-foreground border rounded p-2 bg-muted/30">
                  {whatsappTemplates.find(t => t.id === bulkWhatsappTemplate)?.body_text}
                </p>
              )}
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Destinatarios ({selectedWhatsappUsers.size} de {usersWithPhone.length})
                </label>
                <Button variant="ghost" size="sm" onClick={toggleAllWhatsappUsers}>
                  {filteredUsersWithPhone.every(u => selectedWhatsappUsers.has(u.id)) && filteredUsersWithPhone.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={bulkWhatsappSearch}
                  onChange={(e) => setBulkWhatsappSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[300px] border rounded-md p-2">
                {filteredUsersWithPhone.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {usersWithPhone.length === 0 ? 'No hay usuarios con teléfono registrado.' : 'No se encontraron resultados.'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filteredUsersWithPhone.map(user => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedWhatsappUsers.has(user.id)}
                          onCheckedChange={() => toggleWhatsappUser(user.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.nombre} {user.apellido}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.telefono}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkWhatsappDialog(false)} disabled={isSendingBulk}>
              Cancelar
            </Button>
            <Button
              onClick={handleBulkWhatsappSend}
              disabled={!bulkWhatsappTemplate || selectedWhatsappUsers.size === 0 || isSendingBulk}
            >
              {isSendingBulk ? 'Enviando...' : `Enviar a ${selectedWhatsappUsers.size} usuario${selectedWhatsappUsers.size !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
