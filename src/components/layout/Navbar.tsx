// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { BookOpen, Home, Library, UserCircle, Users, LogIn, ShoppingCart, Menu, Sparkles, Gamepad2, Store, Info, BookHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";
import { useCart } from "@/context/CartContext"; 

const useAuth = () => {
  const [authInfo, setAuthInfo] = React.useState<{
    isAuthenticated: boolean;
    userRole: 'reader' | 'library' | 'superadmin' | null;
  }>({
    isAuthenticated: false,
    userRole: null,
  });

  React.useEffect(() => {
    // This effect runs only on the client after hydration
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    const userDataString = localStorage.getItem("aliciaLibros_user");
    let role = null;
    if (authStatus && userDataString) {
      try {
        const user = JSON.parse(userDataString);
        role = user.role || user.rol; // Accommodate legacy 'rol' typo
      } catch (e) {
        console.error("Error parsing user data from localStorage", e);
      }
    }
    setAuthInfo({ isAuthenticated: authStatus, userRole: role });
  }, []);
  
  return authInfo;
};


export function Navbar() {
  const { isAuthenticated, userRole } = useAuth();
  const { itemCount } = useCart(); 
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Inicio", icon: Home, roles: ['reader', 'library', 'superadmin', null] },
    { href: "/libraries", label: "Librerías", icon: Library, roles: ['reader', 'library', 'superadmin', null] },
    { href: "/my-library", label: "Mi Biblioteca", icon: BookHeart, roles: ['reader', 'library', 'superadmin', null] },
    { href: "/about", label: "Nosotros", icon: Info, roles: ['reader', 'library', 'superadmin', null] },
    { href: "/recommendations", label: "Recomendaciones IA", icon: Sparkles, roles: ['reader', 'library', 'superadmin', null] },
    { href: "/games", label: "Juegos", icon: Gamepad2, roles: ['reader', 'library', 'superadmin', null] },
    { href: "/community", label: "Comunidad", icon: Users, roles: ['reader', 'library', 'superadmin', null] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(userRole));


  const getDashboardLink = () => {
    if (userRole === 'library') return '/library-admin/dashboard';
    if (userRole === 'superadmin') return '/superadmin/dashboard';
    return '/dashboard'; // Default for readers
  };
  
  const renderAuthButtons = () => {
    if (isAuthenticated) {
        if (userRole === 'reader') {
             return (
                <Link href={getDashboardLink()}>
                  <Button variant="outline" className="font-body">
                     <UserCircle className="mr-2 h-4 w-4" />
                     Soy Lector
                  </Button>
                </Link>
             )
        }
        // This covers 'library' and 'superadmin'
        return (
            <Link href={getDashboardLink()}>
              <Button variant="outline" className="font-body">
                 <UserCircle className="mr-2 h-4 w-4" />
                 Mi Panel
              </Button>
            </Link>
        )
    }
    
    // Not authenticated
    return (
      <>
        <Link href="/library-login">
          <Button variant="ghost" className="font-body">
            <Store className="mr-2 h-4 w-4" />
            Soy Librería
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" className="font-body">
            <LogIn className="mr-2 h-4 w-4" />
            Soy Lector
          </Button>
        </Link>
      </>
    );
  }

  const renderMobileAuthButtons = () => {
    if (isAuthenticated) {
      if (userRole === 'reader') {
          return (
             <Link href={getDashboardLink()} className={cn(
                "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                 "text-foreground/80"
              )}>
                <UserCircle className="h-5 w-5" />
                <span>Soy Lector</span>
             </Link>
          )
      }
      // This covers 'library' and 'superadmin'
      return (
         <Link href={getDashboardLink()} className={cn(
            "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
             "text-foreground/80"
          )}>
            <UserCircle className="h-5 w-5" />
            <span>Mi Panel</span>
         </Link>
      )
    }

    // Not authenticated
    return (
      <>
        <Link href="/library-login" className={cn(
            "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            "text-foreground/80"
          )}>
          <Store className="h-5 w-5" />
          <span>Soy Librería</span>
        </Link>
         <Link href="/login" className={cn(
            "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
             "text-foreground/80"
          )}>
          <LogIn className="h-5 w-5" />
          <span>Soy Lector</span>
        </Link>
      </>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">Alicia Libros</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {visibleNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "transition-colors hover:text-primary",
                pathname === item.href ? "text-primary font-semibold" : "text-foreground/70"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center space-x-3">
          {renderAuthButtons()}
          <Link href="/cart" passHref>
             <Button variant="ghost" size="icon" aria-label="Carrito" className="relative">
               <ShoppingCart className="h-6 w-6" />
               {itemCount > 0 && (
                 <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                   {itemCount}
                 </span>
               )}
             </Button>
           </Link>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background p-6 flex flex-col">
              <SheetHeader className="text-left">
                <SheetTitle asChild>
                  <Link href="/" className="flex items-center space-x-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <span className="font-headline text-2xl font-bold text-primary">Alicia Libros</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-8">
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === item.href ? "bg-accent text-accent-foreground" : "text-foreground/80"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="mt-auto pt-6 border-t flex flex-col space-y-2">
                {renderMobileAuthButtons()}
                <Link href="/cart" passHref>
                  <Button variant="ghost" className="w-full justify-start text-foreground/80 hover:bg-accent hover:text-accent-foreground relative px-3 py-2 h-auto text-base font-medium">
                    <ShoppingCart className="mr-3 h-5 w-5" />
                    <span>Carrito</span>
                     {itemCount > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                        {itemCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
