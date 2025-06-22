// src/app/(superadmin_dashboard)/layout.tsx
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Users, Store, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from "react";

// Custom hook to check superadmin auth status on the client-side
const useSuperAdminAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    const userDataString = localStorage.getItem("aliciaLibros_user");
    let userRole = '';
    if (userDataString) {
        try {
            userRole = JSON.parse(userDataString).role;
        } catch (e) {
            console.error(e);
        }
    }
    setIsAuthenticated(authStatus && userRole === 'superadmin');
  }, []);

  return isAuthenticated;
};

export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSuperAdminAuthenticated = useSuperAdminAuthStatus();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (isSuperAdminAuthenticated === false) {
      router.push("/login");
    }
  }, [isSuperAdminAuthenticated, router]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("aliciaLibros_user");
    localStorage.removeItem("isLibraryAdminAuthenticated");
    localStorage.removeItem("aliciaLibros_registeredLibrary");
    router.push("/login");
  };
  
  if (isSuperAdminAuthenticated === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Verificando acceso de Superadmin...</p>
      </div>
    );
  }

  if (!isSuperAdminAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Acceso no autorizado. Redirigiendo...</p>
      </div>
    );
  }
  
  const sidebarNavItems = [
    { title: "Dashboard", href: "/superadmin/dashboard", icon: LayoutDashboard },
    { title: "Gestionar Usuarios", href: "/superadmin/users", icon: Users },
    { title: "Gestionar Librerías", href: "/superadmin/libraries", icon: Store },
    // { title: "Contenido Homepage", href: "/superadmin/content", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/superadmin/dashboard" className="flex items-center gap-2 font-semibold text-destructive">
            <Settings className="h-6 w-6" />
            <span>Superadmin</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <ul className="grid items-start px-4 text-sm font-medium">
            {sidebarNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    pathname === item.href && "bg-muted text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
           <Link href="/superadmin/dashboard" className="flex items-center gap-2 font-semibold text-destructive">
            <Settings className="h-6 w-6" />
            <span>Superadmin</span>
          </Link>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">{children}</main>
      </div>
    </div>
  );
}
