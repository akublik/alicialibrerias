// src/app/(app)/libraries/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { placeholderLibraries, placeholderBooks } from '@/lib/placeholders';
import type { Library, Book } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Phone, Mail, ExternalLink, Search, BookOpen, ArrowLeft, Heart, CalendarDays as CalendarDaysIcon } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// const NEWLY_REGISTERED_LIBRARY_ID = "newly-registered-library"; // ID usado para localStorage
const NEW_LIBRARY_ID_LOCALSTORAGE_KEY = "newly-registered-library-details-temp";

export default function LibraryDetailsPage() {
  const params = useParams();
  const libraryId = params.id as string;

  const [library, setLibrary] = useState<Library | null>(null);
  const [books, setBooks] = useState<Book[]>([]); 
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    console.log("LibraryDetailsPage: loading for ID:", libraryId);
    if (libraryId) {
      let foundLibrary: Library | null = null;
      // Intenta cargar desde localStorage si el ID coincide con el que usamos para el registro temporal
      // Esto es principalmente para la UX inmediata post-registro.
      // Para librerías ya persistidas, se debería cargar desde Firestore.
      if (typeof window !== "undefined") {
        const storedLibraryData = localStorage.getItem(NEW_LIBRARY_ID_LOCALSTORAGE_KEY);
        if (storedLibraryData) {
          try {
            const tempRegisteredLib = JSON.parse(storedLibraryData) as Library;
            if (tempRegisteredLib.id === libraryId) { // Comparamos el ID guardado con el ID de la URL
              foundLibrary = tempRegisteredLib;
              console.log("LibraryDetailsPage: Loaded library from localStorage (temp post-register):", foundLibrary);
            }
          } catch (e) {
            console.error("LibraryDetailsPage: Error parsing registered library data for details page:", e);
          }
        }
      }
      
      // Si no se encontró en localStorage (o el ID no coincide), busca en los placeholders
      // A futuro, aquí se haría una consulta a Firestore con el libraryId
      if (!foundLibrary) {
        foundLibrary = placeholderLibraries.find(l => l.id === libraryId) || null;
        if (foundLibrary) {
          console.log("LibraryDetailsPage: Found library in placeholders:", foundLibrary);
        }
      }
      
      setLibrary(foundLibrary);

      if (foundLibrary) {
        // Mock books para esta librería (a futuro, se cargarían desde Firestore)
        setBooks(placeholderBooks.sort(() => 0.5 - Math.random()).slice(0, 6).map(b => ({...b, id: `${b.id}-lib-${foundLibrary?.id}`})));
        if (typeof window !== "undefined") {
          setIsFavorite(localStorage.getItem(`fav-lib-${foundLibrary.id}`) === 'true');
        }
      } else {
         console.log("LibraryDetailsPage: Library not found for ID:", libraryId);
      }
    }
  }, [libraryId]);
  
  const toggleFavorite = () => {
    if (library && typeof window !== "undefined") {
      const newFavStatus = !isFavorite;
      setIsFavorite(newFavStatus);
      if (newFavStatus) {
        localStorage.setItem(`fav-lib-${library.id}`, 'true');
      } else {
        localStorage.removeItem(`fav-lib-${library.id}`);
      }
      // Simple toast feedback, can be enhanced
      alert(newFavStatus ? `${library.name} añadida a favoritos.` : `${library.name} eliminada de favoritos.`);
    }
  };

  if (!library) {
    return <div className="container mx-auto px-4 py-8 text-center">Cargando librería... o librería no encontrada para el ID: {libraryId}. (Nota: Las librerías nuevas se guardan en Firestore, esta página aún carga principalmente de placeholders o localStorage temporal).</div>;
  }

  const { name, location, description } = library;
  const imageUrl = library.imageUrl || `https://placehold.co/800x400.png?text=${encodeURIComponent(name)}`;
  const dataAiHint = library.dataAiHint || 'library large view';
  const libraryAddress = (library as any).address || location; 
  const libraryPhone = (library as any).phone || "No disponible";
  const libraryEmailDomain = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '');
  const libraryEmail = (library as any).email || `info@${libraryEmailDomain || 'libreria'}.com`;


  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <Link href="/libraries" className="inline-flex items-center text-primary hover:underline mb-6 font-body">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al directorio
      </Link>

      <Card className="mb-8 md:mb-12 shadow-xl overflow-hidden">
        <div className="relative h-64 md:h-96 w-full">
          <Image
            src={imageUrl}
            alt={`Imagen de ${name}`}
            layout="fill"
            objectFit="cover"
            priority
            data-ai-hint={dataAiHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        </div>
        <CardHeader className={"relative -mt-24 md:-mt-32 z-10 p-6 md:p-8 bg-background/80 backdrop-blur-sm rounded-t-lg m-4 md:m-6"}>
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <CardTitle className="font-headline text-3xl md:text-4xl font-bold text-primary mb-1">{name}</CardTitle>
              <CardDescription className="text-lg text-foreground/80 flex items-center">
                <MapPin className="mr-2 h-5 w-5" /> {location}
              </CardDescription>
            </div>
             <Button onClick={toggleFavorite} variant={isFavorite ? "default" : "outline"} size="lg" className="mt-4 sm:mt-0 shrink-0 font-body">
                <Heart className={`mr-2 h-5 w-5 ${isFavorite ? 'fill-current text-destructive' : ''}`} />
                {isFavorite ? 'Favorita' : 'Agregar a Favoritos'}
            </Button>
          </div>
        </CardHeader>
        {description && (
          <CardContent className="p-6 md:p-8 pt-0 md:pt-0">
            <p className="text-foreground/90 leading-relaxed">{description}</p>
          </CardContent>
        )}
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <div className="md:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center">
                <MapPin className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground/80">{libraryAddress} - <a href={`https://maps.google.com/?q=${encodeURIComponent(libraryAddress)}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver en mapa</a></span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground/80">Lunes a Sábado: 9am - 7pm</span> {/* Placeholder */}
              </div>
              <div className="flex items-center">
                <Phone className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <a href={`tel:${libraryPhone}`} className="text-primary hover:underline">{libraryPhone}</a>
              </div>
              <div className="flex items-center">
                <Mail className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <a href={`mailto:${libraryEmail}`} className="text-primary hover:underline break-all">
                  {libraryEmail}
                </a>
              </div>
               <Button variant="outline" className="w-full mt-4 font-body">
                  <ExternalLink className="mr-2 h-4 w-4" /> Visitar Sitio Web {/* Placeholder */}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="catalog" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6 bg-muted/50 p-1 h-auto">
              <TabsTrigger value="catalog" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                <BookOpen className="mr-2 h-5 w-5" /> Catálogo de Libros ({books.length})
              </TabsTrigger>
              <TabsTrigger value="events" className="py-2.5 font-body text-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                <CalendarDaysIcon className="mr-2 h-5 w-5" /> Próximos Eventos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="catalog">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Libros Disponibles en {name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {books.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {books.map((book) => (
                        <BookCard key={book.id} book={book} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                       <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                       <p className="text-muted-foreground">No hay libros en el catálogo de esta librería actualmente.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Eventos en {name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <CalendarDaysIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay eventos programados próximamente. ¡Visítanos pronto para novedades!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
