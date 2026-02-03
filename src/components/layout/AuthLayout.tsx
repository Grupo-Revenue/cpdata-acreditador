import { ReactNode } from 'react';
import { Shield } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Shield className="w-8 h-8" />
            </div>
            <span className="text-xl font-semibold">Sistema de Acreditación</span>
          </div>
          
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Gestión integral de acreditación
            </h1>
            <p className="text-lg text-white/80">
              Administra eventos, acreditadores, boletas y rendiciones en una sola plataforma.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>© {new Date().getFullYear()} Sistema de Acreditación</span>
            <span>•</span>
            <span>Todos los derechos reservados</span>
          </div>
        </div>

        {/* Decoración */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo móvil */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-2 rounded-xl gradient-primary">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-semibold">Sistema de Acreditación</span>
          </div>

          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <h2 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-muted-foreground mt-2">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
