// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { BookOpen, Home, Library, UserCircle, Users, LogIn, ShoppingCart, Menu, Sparkles, Gamepad2, Store, Info, BookHeart, PenSquare, Gift, Star, ChevronDown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";
import { useCart } from "@/context/CartContext"; 
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const useAuth = () => {
  const [authInfo, setAuthInfo] = React.useState<{
    isAuthenticated: boolean;
    userRole: 'reader' | 'library' | 'superadmin' | 'author' | null;
  }>({
    isAuthenticated: false,
    userRole: null,
  });

  React.useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            const userRole = userData.role || (userData as any).rol || null;
            
            const fullUserData = {
              ...userData,
              id: userDocSnap.id,
            };

            setAuthInfo({ isAuthenticated: true, userRole: userRole });
            
            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem("aliciaLibros_user", JSON.stringify(fullUserData));
          } else {
            setAuthInfo({ isAuthenticated: false, userRole: null });
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("aliciaLibros_user");
          }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setAuthInfo({ isAuthenticated: false, userRole: null });
        }
      } else {
        setAuthInfo({ isAuthenticated: false, userRole: null });
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("aliciaLibros_user");
        localStorage.removeItem("isLibraryAdminAuthenticated");
        localStorage.removeItem("aliciaLibros_registeredLibrary");
      }
    });

    return () => unsubscribe();
  }, []);
  
  return authInfo;
};

export function Navbar() {
  const { isAuthenticated, userRole } = useAuth();
  const { itemCount } = useCart(); 
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const getDashboardLink = () => {
    if (userRole === 'library') return '/library-admin/dashboard';
    if (userRole === 'superadmin') return '/superadmin/dashboard';
    if (userRole === 'author') return '/authors/dashboard';
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
        return (
            <Link href={getDashboardLink()}>
              <Button variant="outline" className="font-body">
                 <UserCircle className="mr-2 h-4 w-4" />
                 Mi Panel
              </Button>
            </Link>
        )
    }
    
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

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const renderMobileAuthButtons = () => {
    if (isAuthenticated) {
      if (userRole === 'reader') {
          return (
             <Link href={getDashboardLink()} onClick={handleMobileLinkClick} className={cn(
                "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                 "text-foreground/80"
              )}>
                <UserCircle className="h-5 w-5" />
                <span>Soy Lector</span>
             </Link>
          )
      }
      return (
         <Link href={getDashboardLink()} onClick={handleMobileLinkClick} className={cn(
            "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
             "text-foreground/80"
          )}>
            <UserCircle className="h-5 w-5" />
            <span>Mi Panel</span>
         </Link>
      )
    }

    return (
      <>
        <Link href="/library-login" onClick={handleMobileLinkClick} className={cn(
            "flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
            "text-foreground/80"
          )}>
          <Store className="h-5 w-5" />
          <span>Soy Librería</span>
        </Link>
         <Link href="/login" onClick={handleMobileLinkClick} className={cn(
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
          <Link href="/" className={cn("transition-colors hover:text-primary", pathname === "/" ? "text-primary font-semibold" : "text-foreground/70")}>Inicio</Link>
          <Link href="/libraries" className={cn("transition-colors hover:text-primary", pathname === "/libraries" ? "text-primary font-semibold" : "text-foreground/70")}>Librerías</Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" className={cn("p-0 h-auto hover:bg-transparent transition-colors hover:text-primary focus-visible:ring-0", (pathname.startsWith('/my-library') || pathname.startsWith('/biblioteca')) ? "text-primary font-semibold" : "text-foreground/70")}>
                Biblioteca <ChevronDown className="relative top-[1px] ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild><Link href="/my-library">Mi Biblioteca Digital</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/biblioteca/authors">Autores</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/authors" className={cn("transition-colors hover:text-primary", pathname.startsWith("/authors") ? "text-primary font-semibold" : "text-foreground/70")}>Centro de Autores</Link>
          
          <Link href="/about" className={cn("transition-colors hover:text-primary", pathname === "/about" ? "text-primary font-semibold" : "text-foreground/70")}>Nosotros</Link>
          <Link href="/recommendations" className={cn("transition-colors hover:text-primary", pathname === "/recommendations" ? "text-primary font-semibold" : "text-foreground/70")}>Recomendaciones IA</Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" className={cn("p-0 h-auto hover:bg-transparent transition-colors hover:text-primary focus-visible:ring-0", (pathname.startsWith('/community') || pathname.startsWith('/games')) ? "text-primary font-semibold" : "text-foreground/70")}>
                Comunidad <ChevronDown className="relative top-[1px] ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild><Link href="/community">Reseñas y Clubes</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/games">Juegos Literarios</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" className={cn("p-0 h-auto hover:bg-transparent transition-colors hover:text-primary focus-visible:ring-0", (pathname.startsWith('/loyalty') || pathname.startsWith('/redemption-store')) ? "text-primary font-semibold" : "text-foreground/70")}>
                Programa de Puntos <ChevronDown className="relative top-[1px] ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild><Link href="/loyalty">Beneficios y Promociones</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/redemption-store">Tienda de Canje</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background p-6 flex flex-col">
              <SheetHeader className="text-left">
                <SheetTitle asChild>
                  <Link href="/" onClick={handleMobileLinkClick} className="flex items-center space-x-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <span className="font-headline text-2xl font-bold text-primary">Alicia Libros</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-2 mt-8">
                 <Link href="/" onClick={handleMobileLinkClick} className={cn("flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground", pathname === "/" ? "bg-accent text-accent-foreground" : "text-foreground/80")}><Home className="h-5 w-5" /><span>Inicio</span></Link>
                 <Link href="/libraries" onClick={handleMobileLinkClick} className={cn("flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground", pathname === "/libraries" ? "bg-accent text-accent-foreground" : "text-foreground/80")}><Library className="h-5 w-5" /><span>Librerías</span></Link>
                 
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="biblioteca" className="border-b-0">
                      <AccordionTrigger className={cn("flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground no-underline", (pathname.startsWith('/my-library') || pathname.startsWith('/biblioteca')) ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:no-underline")}>
                        <BookHeart className="h-5 w-5" />
                        <span>Biblioteca</span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8 pt-2 pb-0 flex flex-col space-y-2">
                        <Link href="/my-library" onClick={handleMobileLinkClick} className={cn("flex items-center text-sm p-2 rounded-md hover:bg-accent", pathname === '/my-library' ? 'font-semibold' : 'text-muted-foreground')}>Mi Biblioteca Digital</Link>
                        <Link href="/biblioteca/authors" onClick={handleMobileLinkClick} className={cn("flex items-center text-sm p-2 rounded-md hover:bg-accent", pathname === '/biblioteca/authors' ? 'font-semibold' : 'text-muted-foreground')}>Autores</Link>
                      </AccordionContent>
                    </AccordionItem>
                 </Accordion>
                 
                 <Link href="/authors" onClick={handleMobileLinkClick} className={cn("flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground", pathname.startsWith("/authors") ? "bg-accent text-accent-foreground" : "text-foreground/80")}><Rocket className="h-5 w-5" /><span>Centro de Autores</span></Link>
                 <Link href="/about" onClick={handleMobileLinkClick} className={cn("flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground", pathname === "/about" ? "bg-accent text-accent-foreground" : "text-foreground/80")}><Info className="h-5 w-5" /><span>Nosotros</span></Link>
                 <Link href="/recommendations" onClick={handleMobileLinkClick} className={cn("flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground", pathname === "/recommendations" ? "bg-accent text-accent-foreground" : "text-foreground/80")}><Sparkles className="h-5 w-5" /><span>Recomendaciones IA</span></Link>
                 
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="comunidad" className="border-b-0">
                      <AccordionTrigger className={cn("flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground no-underline", (pathname.startsWith('/community') || pathname.startsWith('/games')) ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:no-underline")}>
                        <Users className="h-5 w-5" />
                        <span>Comunidad</span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8 pt-2 pb-0 flex flex-col space-y-2">
                        <Link href="/community" onClick={handleMobileLinkClick} className={cn("flex items-center text-sm p-2 rounded-md hover:bg-accent", pathname === '/community' ? 'font-semibold' : 'text-muted-foreground')}>Reseñas y Clubes</Link>
                        <Link href="/games" onClick={handleMobileLinkClick} className={cn("flex items-center text-sm p-2 rounded-md hover:bg-accent", pathname === '/games' ? 'font-semibold' : 'text-muted-foreground')}>Juegos Literarios</Link>
                      </AccordionContent>
                    </AccordionItem>
                 </Accordion>

                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="puntos" className="border-b-0">
                      <AccordionTrigger className={cn("flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground no-underline", (pathname.startsWith('/loyalty') || pathname.startsWith('/redemption-store')) ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:no-underline")}>
                        <Star className="h-5 w-5" />
                        <span>Programa de Puntos</span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8 pt-2 pb-0 flex flex-col space-y-2">
                        <Link href="/loyalty" onClick={handleMobileLinkClick} className={cn("flex items-center text-sm p-2 rounded-md hover:bg-accent", pathname === '/loyalty' ? 'font-semibold' : 'text-muted-foreground')}>Beneficios y Promociones</Link>
                        <Link href="/redemption-store" onClick={handleMobileLinkClick} className={cn("flex items-center text-sm p-2 rounded-md hover:bg-accent", pathname === '/redemption-store' ? 'font-semibold' : 'text-muted-foreground')}>Tienda de Canje</Link>
                      </AccordionContent>
                    </AccordionItem>
                </Accordion>
              </nav>
              <div className="mt-auto pt-6 border-t flex flex-col space-y-2">
                {renderMobileAuthButtons()}
                <Link href="/cart" onClick={handleMobileLinkClick} passHref>
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
