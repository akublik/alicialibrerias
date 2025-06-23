// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { BookOpen, Home, Library, UserCircle, Users, LogIn, ShoppingCart, Menu, Sparkles, Gamepad2, Store, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";
import { useCart } from "@/context/CartContext"; 

// Mock authentication status
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  React.useEffect(() => {
    // This effect runs only on the client after hydration
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);
  }, []);
  return { isAuthenticated };
};


export function Navbar() {
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart(); 
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/libraries", label: "Librerías", icon: Library },
    { href: "/about", label: "Nosotros", icon: Info },
    { href: "/recommendations", label: "Recomendaciones IA", icon: Sparkles },
    { href: "/games", label: "Juegos", icon: Gamepad2 },
    { href: "/community", label: "Comunidad", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">Alicia Libros</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
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
          <Link href="/library-login">
            <Button variant="ghost" className="font-body">
              <Store className="mr-2 h-4 w-4" />
              Soy Librería
            </Button>
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" aria-label="Dashboard">
                <UserCircle className="h-6 w-6" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="font-body">
                <LogIn className="mr-2 h-4 w-4" />
                Ingresar
              </Button>
            </Link>
          )}
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
            <SheetContent side="right" className="w-[280px] bg-background p-6">
              <Link href="/" className="flex items-center space-x-2 mb-8">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="font-headline text-2xl font-bold text-primary">Alicia Libros</span>
              </Link>
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
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
              <div className="mt-auto pt-6 border-t">
                <Link href="/library-login" className={cn(
                    "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground mb-2",
                    "text-foreground/80"
                  )}>
                  <Store className="h-5 w-5" />
                  <span>Soy Librería</span>
                </Link>
                {isAuthenticated ? (
                   <Link href="/dashboard" className={cn(
                      "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                       "text-foreground/80"
                    )}>
                      <UserCircle className="h-5 w-5" />
                      <span>Mi Cuenta Lector</span>
                   </Link>
                ) : (
                  <Link href="/register">
                     <Button variant="default" className="w-full font-body mb-2">
                        <LogIn className="mr-2 h-4 w-4" />
                        Ingresar / Registrarse
                      </Button>
                  </Link>
                )}
                <Link href="/cart" passHref>
                  <Button variant="ghost" className="w-full justify-start mt-2 text-foreground/80 hover:bg-accent hover:text-accent-foreground relative">
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
