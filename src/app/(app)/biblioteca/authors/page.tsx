// src/app/(app)/biblioteca/authors/page.tsx
"use client";

import { AuthorCard } from "@/components/AuthorCard";
import { db } from "@/lib/firebase";
import type { Author } from "@/types";
import { collection, onSnapshot } from "firebase/firestore";
import { Loader2, PenSquare } from "lucide-react";
import { useState, useEffect } from "react";

export default function AuthorsPage() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setIsLoading(false);
            return;
        }
        const unsubscribe = onSnapshot(collection(db, "authors"), (snapshot) => {
            const authorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author));
            setAuthors(authorsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
            <header className="mb-12 text-center">
                <PenSquare className="mx-auto h-16 w-16 text-primary mb-4" />
                <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
                    Nuestros Autores
                </h1>
                <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
                    Explora los perfiles y obras de los talentosos autores que forman parte de nuestra comunidad literaria.
                </p>
            </header>

            {isLoading ? (
                 <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : authors.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {authors.map((author) => (
                        <AuthorCard key={author.id} author={author} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground">No hay autores para mostrar en este momento.</p>
            )}
        </div>
    );
}
