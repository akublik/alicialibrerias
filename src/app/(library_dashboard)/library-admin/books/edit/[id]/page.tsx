// src/app/(library_dashboard)/library-admin/books/edit/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';

export default function EditBookPage() {
  const params = useParams();
  const bookId = params.id as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-headline text-3xl font-bold text-primary mb-4">
        Editar Libro
      </h1>
      <p className="text-muted-foreground">
        Editando el libro con ID: {bookId}
      </p>
      <p className="mt-4">
        El formulario para editar los detalles del libro se implementará aquí.
      </p>
    </div>
  );
}
