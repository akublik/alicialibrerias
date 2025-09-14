// src/app/(library_dashboard)/layout.tsx
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, BookCopy, ShoppingCart, Store, User, CalendarDays, LineChart, Loader2, Coins } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from "react";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { User as AppUser } from "@/types";

const useLibraryAuth = () => {
  const [authStatus, setAuthStatus] = React.useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  React.useEffect(() => {
    if (!auth) {
      setAuthStatus('unauthorized');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data() as AppUser;
        const userRole = userData?.role || (userData as any)?.rol;
        
        if (userDocSnap.exists() && userRole === 'library') {
          setAuthStatus('authorized');
          localStorage.setItem("isLibraryAdminAuthenticated", "true");
        } else {
          setAuthStatus('unauthorized');
        }
      } else {
        setAuthStatus('unauthorized');
        localStorage.removeItem("isLibraryAdminAuthenticated");
      }
    });

    return () => unsubscribe();
  }, []);

  return authStatus;
};

export default function LibraryDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authStatus = useLibraryAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (authStatus === 'unauthorized') {
      router.push("/library-login");
    }
  }, [authStatus, router]);

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
    // The onAuthStateChanged listener will handle the redirect.
  };

  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verificando acceso...</p>
      </div>
    );
  }

  if (authStatus !== 'authorized') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Acceso no autorizado. Redirigiendo...</p>
      </div>
    );
  }
  
  const sidebarNavItems = [
    { title: "Dashboard", href: "/library-admin/dashboard", icon: LayoutDashboard },
    { title: "Mis Libros", href: "/library-admin/books", icon: BookCopy },
    { title: "Pedidos", href: "/library-admin/orders", icon: ShoppingCart },
    { title: "Eventos", href: "/library-admin/events", icon: CalendarDays },
    { title: "Terminal de Puntos", href: "/library-admin/terminal", icon: Coins },
    { title: "Analíticas", href: "/library-admin/analytics", icon: LineChart },
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
                    pathname.startsWith(item.href) && "bg-muted text-primary"
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
