-- =============================================
-- FASE 2: Base de Datos Supabase - Bootstrap
-- =============================================

-- 2.1 Crear enum para estados de aprobación
CREATE TYPE public.approval_status AS ENUM ('pending', 'preapproved', 'approved');

-- 2.2 Crear enum para roles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'administracion', 'supervisor', 'acreditador');

-- 2.3 Tabla de perfiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rut TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT,
    email TEXT NOT NULL,
    referencia_contacto TEXT,
    foto_url TEXT,
    approval_status public.approval_status NOT NULL DEFAULT 'pending',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.4 Tabla de roles (para referencia y descripciones)
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name public.app_role UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.5 Tabla de asignación de roles a usuarios
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 2.6 Tabla de configuración del sistema
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- FUNCIONES DE UTILIDAD
-- =============================================

-- Función para verificar si un usuario tiene un rol específico (SECURITY DEFINER para evitar recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Función para verificar si un usuario es admin (superadmin o administracion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('superadmin', 'administracion')
    )
$$;

-- Función para obtener todos los roles de un usuario
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
$$;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger para actualizar updated_at en profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at en settings
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Usuarios pueden actualizar su propio perfil (excepto approval_status)
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Admins pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Políticas para ROLES
-- Todos los usuarios autenticados pueden ver los roles
CREATE POLICY "Authenticated users can view roles"
    ON public.roles
    FOR SELECT
    TO authenticated
    USING (true);

-- Políticas para USER_ROLES
-- Usuarios pueden ver sus propios roles
CREATE POLICY "Users can view own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins pueden ver todos los roles de usuarios
CREATE POLICY "Admins can view all user roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Admins pueden gestionar roles de usuarios
CREATE POLICY "Admins can manage user roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Políticas para SETTINGS
-- Todos los usuarios autenticados pueden leer settings
CREATE POLICY "Authenticated users can view settings"
    ON public.settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Solo superadmins pueden modificar settings
CREATE POLICY "Superadmins can manage settings"
    ON public.settings
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'superadmin'));

-- =============================================
-- SEED DATA
-- =============================================

-- Insertar los 4 roles base
INSERT INTO public.roles (name, description) VALUES
    ('superadmin', 'Administrador del sistema con acceso total'),
    ('administracion', 'Personal de administración con acceso a gestión'),
    ('supervisor', 'Supervisor de eventos y acreditadores'),
    ('acreditador', 'Personal de acreditación en eventos');

-- Insertar configuraciones iniciales
INSERT INTO public.settings (key, value, description) VALUES
    ('system_name', 'Sistema de Acreditación', 'Nombre del sistema'),
    ('max_file_size_mb', '10', 'Tamaño máximo de archivos en MB'),
    ('default_approval_status', 'pending', 'Estado por defecto al registrar usuario');