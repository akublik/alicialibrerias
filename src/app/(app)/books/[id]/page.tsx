// src/app/(app)/books/[id]/page.tsx
import type { Metadata } from 'next';
import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Book } from '@/types';
import BookPageClient from '@/components/BookPageClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const idOrSlug = params.id;
   if (!db) {
    return {
      title: 'Error',
      description: 'La base de datos no está disponible.',
    };
  }

  try {
    let book: Book | null = null;
    
    // Attempt to fetch by slug first
    const q = query(collection(db, "books"), where("slug", "==", idOrSlug), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        book = querySnapshot.docs[0].data() as Book;
    } else {
        // If not found by slug, try fetching by ID
        const docRef = doc(db, "books", idOrSlug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            book = docSnap.data() as Book;
        }
    }

    if (!book) {
      return {
        title: 'Libro no Encontrado',
      };
    }

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
        authors: book.authors,
        isbn: book.isbn,
      },
    };
  } catch (error) {
    console.error("Error generating metadata for book:", idOrSlug, error);
    return {
      title: 'Error al cargar libro',
      description: 'No se pudo cargar la información para este libro.',
    };
  }
}

export default function BookDetailsPage({ params }: { params: { id: string } }) {
    if (!params.id) {
        notFound();
    }
    // We rename `id` to `slug` here to match what the client component expects,
    // even though it can be an ID or a slug.
    return <BookPageClient slug={params.id} />;
}
