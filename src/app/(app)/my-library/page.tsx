// src/app/(app)/my-library/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, BookHeart, BookX, Search } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import type { DigitalBook } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";

export default function MyLibraryPage() {
  const [myBooks, setMyBooks] = useState<DigitalBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    if (!authStatus) {
      router.push("/login?redirect=/my-library");
      return;
    }

    if (!db) {
      setIsLoading(false);
      return;
    }
    
    // For now, we show all digital books.
    // In a real scenario, you'd fetch user-specific purchases.
    const booksQuery = query(collection(db, "digital_books"));
    
    const unsubscribe = onSnapshot(booksQuery, (snapshot) => {
      const allBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DigitalBook));
      setMyBooks(allBooks);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching digital library:", error);
      toast({ title: "Error al cargar tu biblioteca", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);

  const filteredBooks = useMemo(() => {
    if (!searchTerm) return myBooks;
    return myBooks.filter(book => 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [myBooks, searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-12 text-center">
        <BookHeart className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
          Mi Biblioteca Digital
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          Tus libros, listos para leer en cualquier momento y lugar.
        </p>
         <div className="mt-8 max-w-lg mx-auto">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Buscar en tu biblioteca por título o autor..."
                    className="pl-10 h-12 text-base md:text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </header>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {filteredBooks.map((book) => (
            <Link key={book.id} href={`/reader/${book.id}`} passHref>
                <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl group cursor-pointer">
                    <CardHeader className="p-0">
                        <div className="aspect-[2/3] relative">
                            <Image
                                src={book.coverImageUrl}
                                alt={`Portada de ${book.title}`}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        <CardTitle className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary">
                            {book.title}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1 line-clamp-1">
                            {book.author}
                        </CardDescription>
                    </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <BookX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-headline text-2xl font-semibold text-foreground">
            {searchTerm ? "No se encontraron resultados" : "Tu biblioteca está vacía"}
          </h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm ? `No hay libros que coincidan con "${searchTerm}".` : "Los libros digitales que adquieras aparecerán aquí."}
          </p>
        </div>
      )}
    </div>
  );
}
