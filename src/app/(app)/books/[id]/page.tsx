// src/app/(app)/books/[slug]/page.tsx
import type { Metadata } from 'next';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Book } from '@/types';
import BookPageClient from '@/components/BookPageClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug;
   if (!db) {
    return {
      title: 'Error',
      description: 'La base de datos no está disponible.',
    };
  }

  try {
    const q = query(collection(db, "books"), where("slug", "==", slug), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        title: 'Libro no Encontrado',
      };
    }

    const book = querySnapshot.docs[0].data() as Book;
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
    console.error("Error generating metadata for book:", slug, error);
    return {
      title: 'Error al cargar libro',
      description: 'No se pudo cargar la información para este libro.',
    };
  }
}

export default function BookDetailsPage({ params }: { params: { slug: string } }) {
    if (!params.slug) {
        notFound();
    }
    return <BookPageClient slug={params.slug} />;
}
