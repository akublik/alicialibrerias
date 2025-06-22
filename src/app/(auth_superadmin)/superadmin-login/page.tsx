// src/app/(auth_superadmin)/superadmin-login/page.tsx
import { LibraryLoginForm } from '@/components/auth_library/LibraryLoginForm';
import { Settings } from 'lucide-react';

export default function SuperAdminLoginPage() {
  return (
    <LibraryLoginForm
      title="Acceso Superadmin"
      description="Ingresa tus credenciales de superadministrador."
      icon={<Settings className="mx-auto h-12 w-12 text-destructive mb-4" />}
      hideFooterLinks={true}
    />
  );
}
