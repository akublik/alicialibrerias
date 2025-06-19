// src/app/(app)/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { placeholderBooks, placeholderLibraries } from "@/lib/placeholders";
import type { Book, Library } from "@/types";
import { BookCard } from "@/components/BookCard";
import { LibraryCard } from "@/components/LibraryCard";
import { ShoppingBag, Heart, Sparkles, UserCircle, Edit3, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Mock user data
const mockUser = {
  name: "Ana Lectora",
  email: "ana.lectora@example.com",
  joinDate: "Enero 2023",
  avatarUrl: "https://placehold.co/150x150.png",
  dataAiHint: "woman smiling"
};

// Mock purchases
const mockPurchases: Book[] = placeholderBooks.slice(0, 2).map(b => ({...b, id: b.id + "-purchase"}));
const mockFavoriteLibraries: Library[] = placeholderLibraries.slice(0, 2).map(l => ({...l, id: l.id + "-fav"}));
const mockAiRecommendations: Book[] = placeholderBooks.slice(2, 4).map(b => ({...b, id: b.id + "-airec"}));


export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Simulate checking auth status
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);
    if (!authStatus && typeof window !== "undefined") {
       // Temporarily disable redirect for easier testing if login page not fully ready
       // window.location.href = "/login";
       console.log("User not authenticated, would redirect to login.");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };
  
  // if (!isAuthenticated) {
  //   return <div className="container mx-auto px-4 py-8 text-center">Cargando...</div>;
  // }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-8 md:mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-2">
          Mi Espacio Lector
        </h1>
        <p className="text-lg text-foreground/80">
          Bienvenida de nuevo, {mockUser.name}. Aquí puedes gestionar tu actividad en Alicia Lee.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <Image
                src={mockUser.avatarUrl}
                alt={mockUser.name}
                width={120}
                height={120}
                className="rounded-full mx-auto mb-4 border-4 border-primary/30"
                data-ai-hint={mockUser.dataAiHint}
              />
              <CardTitle className="font-headline text-2xl">{mockUser.name}</CardTitle>
              <CardDescription>{mockUser.email}</CardDescription>
              <CardDescription>Miembro desde: {mockUser.joinDate}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full font-body">
                <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil
              </Button>
              <Button variant="destructive" className="w-full font-body" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="purchases" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 h-auto">
              <TabsTrigger value="purchases" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                <ShoppingBag className="mr-2 h-5 w-5" /> Mis Compras
              </TabsTrigger>
              <TabsTrigger value="favorites" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                <Heart className="mr-2 h-5 w-5" /> Librerías Favoritas
              </TabsTrigger>
              <TabsTrigger value="ai-recommendations" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                <Sparkles className="mr-2 h-5 w-5" /> Recomendaciones IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="purchases">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Historial de Compras</CardTitle>
                </CardHeader>
                <CardContent>
                  {mockPurchases.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockPurchases.map(book => <BookCard key={book.id} book={book} />)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aún no has realizado ninguna compra.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Mis Librerías Favoritas</CardTitle>
                </CardHeader>
                <CardContent>
                  {mockFavoriteLibraries.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockFavoriteLibraries.map(library => <LibraryCard key={library.id} library={library} />)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aún no has guardado ninguna librería como favorita.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-recommendations">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Recomendaciones para Ti</CardTitle>
                  <CardDescription>
                    Basado en tus gustos e historial, estos libros podrían encantarte.
                    <Link href="/recommendations" className="ml-2 text-primary hover:underline font-medium">Ajustar preferencias</Link>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mockAiRecommendations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockAiRecommendations.map(book => <BookCard key={book.id} book={book} />)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aún no tenemos recomendaciones para ti. <Link href="/recommendations" className="text-primary hover:underline">¡Cuéntanos tus gustos!</Link></p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
