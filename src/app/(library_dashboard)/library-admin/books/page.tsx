// src/app/(library_dashboard)/library-admin/books/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, BookCopy, Loader2, Edit, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Book } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function LibraryBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [bookToAction, setBookToAction] = useState<Book | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    const userDataString = localStorage.getItem("aliciaLibros_user");
    if (!userDataString) {
      setIsLoading(false);
      console.warn("User data not found in localStorage.");
      return;
    }
    
    const userData = JSON.parse(userDataString);
    const libraryId = userData.libraryId;
    
    if (!libraryId) {
      setIsLoading(false);
      console.warn("Library ID not found for the current user.");
      return;
    }

    const booksRef = collection(db, "books");
    const q = query(booksRef, where("libraryId", "==", libraryId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const libraryBooks: Book[] = [];
      querySnapshot.forEach((doc) => {
        libraryBooks.push({ id: doc.id, ...doc.data() } as Book);
      });
      setBooks(libraryBooks);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching books: ", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (book: Book) => {
    if (!db) return;
    setIsActionLoading(true);
    setBookToAction(book);
    const newStatus = (book.status ?? 'published') === 'published' ? 'unpublished' : 'published';
    const bookRef = doc(db, "books", book.id);
    try {
      await updateDoc(bookRef, { status: newStatus });
      toast({
        title: "Estado Actualizado",
        description: `El libro "${book.title}" ahora está ${newStatus === 'published' ? 'publicado' : 'no publicado'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setBookToAction(null);
    }
  };

  const handleDeleteBook = async () => {
    if (!bookToAction || !db) return;
    setIsActionLoading(true);
    const bookRef = doc(db, "books", bookToAction.id);
    // Note: Deleting the cover image from storage is not implemented here.
    try {
      await deleteDoc(bookRef);
      toast({
        title: "Libro Eliminado",
        description: `El libro "${bookToAction.title}" ha sido eliminado.`,
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setIsDeleteDialogOpen(false);
      setBookToAction(null);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 animate-fadeIn">
         <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center">
              <BookCopy className="mr-3 h-8 w-8"/>
              Mis Libros
            </h1>
            <p className="text-lg text-foreground/80">
              Gestiona el inventario de tu librería.
            </p>
          </div>
          <div className="flex gap-2">
              <Link href="/library-admin/books/new">
                  <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Libro
                  </Button>
              </Link>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Inventario de Libros</CardTitle>
            <CardDescription>
              Mostrando {books.length} libros en tu inventario.
            </CardDescription>
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
                      <TableHead className="hidden w-[100px] sm:table-cell">
                        <span className="sr-only">Imagen</span>
                      </TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Autor(es)</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden md:table-cell">Stock</TableHead>
                      <TableHead className="hidden md:table-cell">Precio</TableHead>
                      <TableHead>
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.length > 0 ? books.map((book) => {
                      const status = book.status ?? 'published';
                      return (
                      <TableRow key={book.id}>
                        <TableCell className="hidden sm:table-cell">
                          <Image
                            alt={`Portada de ${book.title}`}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={book.imageUrl}
                            width="64"
                            data-ai-hint={book.dataAiHint || 'book cover'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {book.isFeatured && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Libro Destacado</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <span>{book.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="line-clamp-2">{book.authors.join(', ')}</TableCell>
                        <TableCell>
                          <Badge variant={status === 'published' ? "secondary" : "destructive"}>
                            {status === 'published' ? 'Publicado' : 'No Publicado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                           <Badge variant={book.stock && book.stock > 5 ? "secondary" : (book.stock && book.stock > 0 ? "outline" : "destructive")}>
                              {book.stock || 0} en stock
                           </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">${book.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isActionLoading && bookToAction?.id === book.id}>
                                {isActionLoading && bookToAction?.id === book.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/library-admin/books/edit/${book.id}`}>
                                  <Edit className="mr-2 h-4 w-4" /> Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(book)}>
                                {status === 'published' ? (
                                  <><EyeOff className="mr-2 h-4 w-4" /> Despublicar</>
                                ) : (
                                  <><Eye className="mr-2 h-4 w-4" /> Publicar</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => {
                                  setBookToAction(book);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )}) : (
                       <TableRow>
                          <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                              No tienes ningún libro en tu inventario todavía.
                          </TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el libro
              "{bookToAction?.title}" de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookToAction(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isActionLoading}
            >
              {isActionLoading && bookToAction?.id === bookToAction?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sí, eliminar libro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
