// src/app/(superadmin_dashboard)/superadmin/digital-library/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookHeart, Loader2, AlertTriangle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { DigitalBook } from "@/types";

export default function ManageDigitalLibraryPage() {
  const [digitalBooks, setDigitalBooks] = useState<DigitalBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setError("La conexión con la base de datos no está disponible.");
      setIsLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, "digital_books"), (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DigitalBook));
      setDigitalBooks(booksData);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching digital books:", err);
      toast({ title: "Error al cargar libros digitales", variant: "destructive", description: err.message });
      setError(err.message);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  return (
      <div className="container mx-auto px-4 py-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
              <BookHeart className="mr-3 h-8 w-8" />
              Gestionar Biblioteca Digital
            </h1>
            <p className="text-lg text-foreground/80">
              Añade, edita o elimina los libros disponibles en formato digital.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/superadmin/digital-library/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Libro Digital
              </Button>
            </Link>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Catálogo Digital</CardTitle>
            <CardDescription>Estado de la carga de datos.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando libros...</p>
              </div>
            )}
            {!isLoading && error && (
                 <div className="text-center py-10 text-destructive bg-destructive/10 rounded-md">
                    <AlertTriangle className="mx-auto h-8 w-8 mb-2"/>
                    <p className="font-semibold">Ocurrió un error al cargar los datos:</p>
                    <p className="font-mono text-sm mt-1">{error}</p>
                 </div>
            )}
            {!isLoading && !error && (
                 <div className="text-center py-10">
                    <h3 className="text-2xl font-bold text-primary">Diagnóstico Completado</h3>
                    <p className="text-lg mt-2">Se encontraron <span className="font-bold">{digitalBooks.length}</span> libros en la biblioteca digital.</p>
                    {digitalBooks.length === 0 && <p className="text-muted-foreground mt-2">Puedes añadir un libro nuevo para empezar.</p>}
                 </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}