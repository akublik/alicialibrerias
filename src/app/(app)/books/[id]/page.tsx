// src/app/(app)/books/[id]/page.tsx
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Book } from '@/types';
import BookPageClient from '@/components/BookPageClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  try {
    if (!db) {
      throw new Error("Database not configured");
    }
    const bookRef = doc(db, "books", id);
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) {
      return {
        title: 'Libro no Encontrado',
      };
    }

    const book = bookSnap.data() as Book;
    const description = book.description?.substring(0, 160) || `Encuentra el libro ${book.title} de ${book.authors.join(', ')} en Alicia Libros.`;

    return {
      title: book.title,
      description: description,
      openGraph: {
        title: book.title,
        description: description,
        images: [
          {
            url: book.imageUrl,
            width: 400,
            height: 600,
            alt: `Portada de ${book.title}`,
          },
        ],
        type: 'book',
        book: {
          authors: book.authors,
          isbn: book.isbn,
        },
      },
    };
  } catch (error) {
    console.error("Error generating metadata for book:", id, error);
    return {
      title: 'Error al cargar libro',
      description: 'No se pudo cargar la información para este libro.',
    };
  }
}

export default function BookDetailsPage() {
    return <BookPageClient />;
}
