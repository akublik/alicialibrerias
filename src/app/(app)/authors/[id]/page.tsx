// src/app/(app)/authors/[id]/page.tsx
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Author } from '@/types';
import AuthorPageClient from '@/components/AuthorPageClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  try {
    if (!db) {
      throw new Error("Database not configured");
    }
    const authorRef = doc(db, "authors", id);
    const authorSnap = await getDoc(authorRef);

    if (!authorSnap.exists()) {
      return {
        title: 'Autor no Encontrado',
      };
    }
 
    const author = authorSnap.data() as Author;
    const description = author.bio?.substring(0, 160) || `Descubre los libros de ${author.name} en Alicia Libros.`;

    return {
      title: author.name,
      description,
      openGraph: {
        title: author.name,
        description: description,
        images: [
          {
            url: author.imageUrl,
            width: 400,
            height: 400,
            alt: `Foto de ${author.name}`,
          },
        ],
        type: 'profile',
        profile: {
          firstName: author.name.split(' ')[0],
          lastName: author.name.split(' ').slice(1).join(' '),
        },
      },
    };
  } catch (error) {
    console.error("Error generating metadata for author:", id, error);
    return {
      title: 'Error al cargar autor',
      description: 'No se pudo cargar la información de este autor.',
    };
  }
}

export default function AuthorDetailsPage() {
  return <AuthorPageClient />;
}
