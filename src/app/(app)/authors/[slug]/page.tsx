// src/app/(app)/authors/[slug]/page.tsx
import type { Metadata } from 'next';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Author } from '@/types';
import AuthorPageClient from '@/components/AuthorPageClient';
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
    const q = query(collection(db, "authors"), where("slug", "==", slug), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        title: 'Autor no Encontrado',
      };
    }
 
    const author = querySnapshot.docs[0].data() as Author;
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
        firstName: author.name.split(' ')[0],
        lastName: author.name.split(' ').slice(1).join(' '),
      },
    };
  } catch (error) {
    console.error("Error generating metadata for author:", slug, error);
    return {
      title: 'Error al cargar autor',
      description: 'No se pudo cargar la información de este autor.',
    };
  }
}

export default function AuthorDetailsPage({ params }: { params: { slug: string } }) {
  if (!params.slug) {
      notFound();
  }
  return <AuthorPageClient slug={params.slug} />;
}
