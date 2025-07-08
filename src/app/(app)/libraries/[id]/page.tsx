
// src/app/(app)/libraries/[id]/page.tsx
import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Library } from '@/types';
import LibraryPageClient from '@/components/LibraryPageClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  try {
    if (!db) {
      throw new Error("Database not configured");
    }
    const libraryRef = doc(db, "libraries", id);
    const librarySnap = await getDoc(libraryRef);

    if (!librarySnap.exists()) {
      return {
        title: 'Librería no Encontrada',
      };
    }
 
    const library = librarySnap.data() as Library;
    const description = library.description?.substring(0, 160) || `Explora el catálogo de la librería ${library.name} en Alicia Libros.`;
    
    return {
      title: library.name,
      description: description,
      openGraph: {
        title: library.name,
        description: description,
        images: [
          {
            url: library.imageUrl || 'https://placehold.co/400x300.png',
            width: 400,
            height: 300,
            alt: `Logo de ${library.name}`,
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error generating metadata for library:", id, error);
    return {
      title: 'Error al cargar librería',
      description: 'No se pudo cargar la información de esta librería.',
    };
  }
}

export default function LibraryDetailsPage() {
  return <LibraryPageClient />;
}
