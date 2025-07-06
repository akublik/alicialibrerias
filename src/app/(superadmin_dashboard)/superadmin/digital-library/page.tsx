// src/app/(superadmin_dashboard)/superadmin/digital-library/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, BookHeart, Loader2, Trash2, Edit, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { DigitalBook } from "@/types";

export default function ManageDigitalLibraryPage() {
  const [digitalBooks, setDigitalBooks] = useState<DigitalBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookToDelete, setBookToDelete] = useState<DigitalBook | null>(null);
  const { toast } = useToast();

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, "digital_books"), (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DigitalBook));
      setDigitalBooks(booksData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching digital books:", error);
      toast({ title: "Error al cargar libros digitales", variant: "destructive" });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleDelete = async () => {
    if (!bookToDelete) return;
    try {
      await deleteDoc(doc(db, "digital_books", bookToDelete.id));
      toast({ title: "Libro digital eliminado", description: `"${bookToDelete.title}" fue eliminado.` });
    } catch (error: any) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } finally {
      setBookToDelete(null);
    }
  };

  const handleImportZip = () => {
    if (!zipFile) {
      toast({ title: "No se ha seleccionado ningún archivo", variant: "destructive" });
      return;
    }

    toast({
      title: "Funcionalidad en Desarrollo",
      description: "La importación desde ZIP está preparada. El siguiente paso requiere lógica de servidor (Cloud Function) para procesar el archivo.",
      duration: 8000
    });
    
    setZipFile(null);
    setIsImportDialogOpen(false);
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
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Importar desde ZIP
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importar Libro Digital desde .ZIP</DialogTitle>
                  <DialogDescription>
                    Sube un archivo .zip que contenga el archivo EPUB y la imagen de portada. El sistema los procesará automáticamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    id="zip-file" 
                    type="file" 
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)} 
                  />
                  {zipFile && <p className="text-sm text-muted-foreground mt-2">Archivo seleccionado: {zipFile.name}</p>}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsImportDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleImportZip} disabled={!zipFile}>
                    Importar Libro
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            <CardDescription>Mostrando {digitalBooks.length} libros en la biblioteca digital.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">Portada</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Categorías</TableHead>
                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {digitalBooks.length > 0 ? digitalBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt={`Portada de ${book.title}`}
                          className="aspect-[2/3] rounded-md object-cover"
                          height="75"
                          src={book.coverImageUrl}
                          width="50"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{book.format || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={book.categories?.join(', ')}>
                        {book.categories?.join(', ') || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/superadmin/digital-library/edit/${book.id}`}>
                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setBookToDelete(book)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No hay libros en la biblioteca digital.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!bookToDelete} onOpenChange={(open) => !open && setBookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este libro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminará "{bookToDelete?.title}" de la biblioteca digital para todos los usuarios.
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
