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
import { MoreHorizontal, PlusCircle, BookCopy } from "lucide-react";
import { placeholderBooks } from "@/lib/placeholders";
import type { Book } from "@/types";

export default function LibraryBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    // In a real app, you would fetch this data from Firestore based on the logged-in library's ID.
    const libraryBooks = placeholderBooks.map(book => ({
      ...book,
      stock: Math.floor(Math.random() * 20) + 1 // Add random stock for demo
    }));
    setBooks(libraryBooks);
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
            Mostrando {books.length} de {books.length} libros en total.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {books.map((book) => (
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
                     <Badge variant={book.stock && book.stock > 5 ? "secondary" : "destructive"}>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
