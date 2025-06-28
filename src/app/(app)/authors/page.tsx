// src/app/(app)/authors/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { Author } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { Loader2, PenSquare, Search } from "lucide-react";
import { AuthorCard } from "@/components/AuthorCard";
import { Input } from "@/components/ui/input";

export default function AuthorsPage() {
  const [allAuthors, setAllAuthors] = useState<Author[]>([]);
  const [filteredAuthors, setFilteredAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAuthors = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const authorsRef = collection(db, "authors");
        const q = query(authorsRef);
        const querySnapshot = await getDocs(q);
        const authors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author));
        setAllAuthors(authors);
        setFilteredAuthors(authors);
      } catch (error) {
        console.error("Error fetching authors:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuthors();
  }, []);

  useEffect(() => {
    const results = allAuthors.filter(author =>
      author.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAuthors(results);
  }, [searchTerm, allAuthors]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <header className="mb-12 text-center">
        <PenSquare className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
          Nuestros Autores
        </h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          Descubre las mentes creativas detrás de tus libros favoritos.
        </p>
         <div className="mt-8 max-w-lg mx-auto">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Buscar autores por nombre..."
                    className="pl-10 h-12 text-base md:text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Buscar autores"
                />
            </div>
        </div>
      </header>

      {isLoading ? (
        <div className="text-center py-24">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Cargando autores...</p>
        </div>
      ) : filteredAuthors.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredAuthors.map((author) => (
            <AuthorCard key={author.id} author={author} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-headline text-2xl font-semibold text-foreground">No se encontraron autores</h3>
          <p className="text-muted-foreground">
            {searchTerm ? `No hay autores que coincidan con "${searchTerm}".` : "No hay autores registrados."}
          </p>
        </div>
      )}
    </div>
  );
}
