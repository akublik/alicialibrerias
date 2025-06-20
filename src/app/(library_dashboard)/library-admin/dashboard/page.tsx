// src/app/(library_dashboard)/library-admin/dashboard/page.tsx
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookCopy, ShoppingCart, BarChart3, PlusCircle, Store } from "lucide-react";
import { useEffect, useState } from "react"; 

export default function LibraryAdminDashboardPage() {
  const [libraryName, setLibraryName] = useState<string>("Tu Librería");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLibraryData = localStorage.getItem("aliciaLibros_registeredLibrary");
      if (storedLibraryData) {
          try {
              const libDetails = JSON.parse(storedLibraryData);
              if (libDetails && libDetails.name) {
                setLibraryName(libDetails.name);
                console.log("Dashboard: Library name set to:", libDetails.name);
              } else {
                // Fallback if name is not in the main object for some reason
                const oldName = localStorage.getItem("mockRegisteredLibraryName");
                if (oldName) setLibraryName(oldName);
              }
          } catch (e) {
              console.error("Error parsing registered library data for dashboard:", e);
              const oldName = localStorage.getItem("mockRegisteredLibraryName");
              if (oldName) setLibraryName(oldName);
          }
      } else {
          // Fallback if new key doesn't exist at all
          const oldName = localStorage.getItem("mockRegisteredLibraryName");
          if (oldName) {
            setLibraryName(oldName);
            console.log("Dashboard: Using fallback library name:", oldName);
          } else {
            console.log("Dashboard: No library name found in localStorage.");
          }
      }
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <header className="mb-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
          Bienvenido al Panel de {libraryName}
        </h1>
        <p className="text-lg text-foreground/80">
          Gestiona tus libros, pedidos y perfil desde aquí.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Libros Activos</CardTitle>
            <BookCopy className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">
              +5 esta semana {/* Placeholder */}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">
              +3 nuevos hoy {/* Placeholder */}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,250.00</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">
              Comparado con $980.00 el mes pasado {/* Placeholder */}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="font-headline text-2xl font-semibold text-foreground mb-4">Acciones Rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/library-admin/books/new">
            <Button size="lg" className="w-full justify-start text-base py-6 shadow-sm hover:shadow-md transition-shadow">
              <PlusCircle className="mr-3 h-5 w-5" /> Añadir Nuevo Libro
            </Button>
          </Link>
           <Link href="/library-admin/orders">
            <Button size="lg" variant="outline" className="w-full justify-start text-base py-6 shadow-sm hover:shadow-md transition-shadow">
              <ShoppingCart className="mr-3 h-5 w-5" /> Ver Pedidos
            </Button>
          </Link>
          <Link href="/library-admin/profile">
             <Button size="lg" variant="outline" className="w-full justify-start text-base py-6 shadow-sm hover:shadow-md transition-shadow">
              <Store className="mr-3 h-5 w-5" /> Editar Perfil de Librería
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
