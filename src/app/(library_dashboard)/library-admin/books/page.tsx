// src/app/(library_dashboard)/library-admin/books/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, BookCopy, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { Book } from "@/types";

export default function LibraryBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
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
                    <TableHead className="hidden md:table-cell">Stock</TableHead>
                    <TableHead className="hidden md:table-cell">Precio</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.length > 0 ? books.map((book) => (
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
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell className="line-clamp-2">{book.authors.join(', ')}</TableCell>
                      <TableCell className="hidden md:table-cell">
                         <Badge variant={book.stock && book.stock > 5 ? "secondary" : (book.stock && book.stock > 0 ? "outline" : "destructive")}>
                            {book.stock || 0} en stock
                         </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">${book.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Ver en Tienda</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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
  );
}
