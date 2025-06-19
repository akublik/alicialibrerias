// src/app/(library_dashboard)/layout.tsx
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, BookCopy, ShoppingCart, Store, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from "react";

// Custom hook to check library admin auth status on the client-side
const useLibraryAuthStatus = () => {
  // Initialize with undefined to signify "not yet checked"
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // This effect runs only on the client after hydration
    const authStatus = localStorage.getItem("isLibraryAdminAuthenticated") === "true";
    setIsAuthenticated(authStatus);
  }, []); // Empty dependency array means it runs once on mount

  return isAuthenticated;
};

export default function LibraryDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLibraryAdminAuthenticated = useLibraryAuthStatus();
  const router = useRouter();
  const pathname = usePathname();

  // This useEffect will handle the redirect if not authenticated,
  // after isLibraryAdminAuthenticated has been determined on the client.
  React.useEffect(() => {
    // Only redirect if isLibraryAdminAuthenticated is explicitly false (not undefined)
    if (isLibraryAdminAuthenticated === false) {
      router.push("/library-login");
    }
  }, [isLibraryAdminAuthenticated, router]);

  const handleLogout = () => {
    localStorage.removeItem("isLibraryAdminAuthenticated");
    // The redirect will be handled by the useEffect above once isLibraryAdminAuthenticated updates or
    // simply by navigating away, the layout will re-evaluate.
    router.push("/library-login");
  };

  // If auth status is not yet determined (still undefined), render a loading state.
  // This ensures server and initial client render match.
  if (isLibraryAdminAuthenticated === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Verificando acceso...</p> {/* Or a more sophisticated loader/spinner */}
      </div>
    );
  }

  // If determined to be not authenticated, the useEffect above will initiate a redirect.
  // Render a message while redirecting.
  if (!isLibraryAdminAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Acceso no autorizado. Redirigiendo al inicio de sesión...</p>
      </div>
    );
  }
  
  // If authenticated, render the actual dashboard layout
  const sidebarNavItems = [
    { title: "Dashboard", href: "/library-admin/dashboard", icon: LayoutDashboard },
    { title: "Mis Libros", href: "/library-admin/books", icon: BookCopy },
    { title: "Pedidos", href: "/library-admin/orders", icon: ShoppingCart },
    { title: "Perfil Librería", href: "/library-admin/profile", icon: Store },
  ];

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/library-admin/dashboard" className="flex items-center gap-2 font-semibold text-primary">
            <Store className="h-6 w-6" />
            <span>Panel Librería</span>
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
           <Link href="/library-admin/dashboard" className="flex items-center gap-2 font-semibold text-primary">
            <Store className="h-6 w-6" />
            <span>Panel Librería</span>
          </Link>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">{children}</main>
      </div>
    </div>
  );
}
