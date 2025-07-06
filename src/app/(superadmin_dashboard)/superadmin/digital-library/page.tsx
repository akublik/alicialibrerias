// src/app/(superadmin_dashboard)/superadmin/digital-library/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookHeart, Loader2, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { DigitalBook } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from "next/image";

export default function ManageDigitalLibraryPage() {
  const [digitalBooks, setDigitalBooks] = useState<DigitalBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [itemToDelete, setItemToDelete] = useState<DigitalBook | null>(null);

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
  
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
        await deleteDoc(doc(db, "digital_books", itemToDelete.id));
        toast({
            title: "Libro Eliminado",
            description: `Se ha eliminado "${itemToDelete.title}" de la biblioteca digital.`
        });
    } catch (error: any) {
        toast({
            title: "Error al eliminar",
            description: error.message,
            variant: "destructive"
        });
    } finally {
        setItemToDelete(null);
    }
  };

  return (
    <>
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
            <CardDescription>Mostrando {digitalBooks.length} libros en la biblioteca.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Portada</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Autor</TableHead>
                            <TableHead>Formato</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {digitalBooks.length > 0 ? digitalBooks.map(book => (
                            <TableRow key={book.id}>
                                <TableCell>
                                    <Image src={book.coverImageUrl} alt={`Portada de ${book.title}`} width={50} height={75} className="rounded-md object-cover aspect-[2/3]"/>
                                </TableCell>
                                <TableCell className="font-medium">{book.title}</TableCell>
                                <TableCell>{book.author}</TableCell>
                                <TableCell><Badge variant="outline">{book.format}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="icon">
                                        <Link href={`/superadmin/digital-library/edit/${book.id}`}><Edit className="h-4 w-4"/><span className="sr-only">Editar</span></Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setItemToDelete(book)}>
                                        <Trash2 className="h-4 w-4"/><span className="sr-only">Eliminar</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">No hay libros en la biblioteca digital.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </div>

       <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible y eliminará el libro "{itemToDelete?.title}" permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
