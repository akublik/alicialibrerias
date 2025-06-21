// src/app/(app)/libraries/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { placeholderBooks, placeholderLibraries } from '@/lib/placeholders';
import type { Library, Book } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Phone, Mail, ExternalLink, Search, BookOpen, ArrowLeft, Heart, CalendarDays as CalendarDaysIcon, Loader2 } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Define a new type for the extended library object we will use in this page
type LibraryDetails = Library & {
  address?: string;
  phone?: string;
  email?: string;
};

export default function LibraryDetailsPage() {
  const params = useParams();
  const libraryId = params.id as string;

  const [library, setLibrary] = useState<LibraryDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]); 
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!libraryId) {
      setIsLoading(false);
      return;
    };
    
    setIsLoading(true);
    let foundLibrary: LibraryDetails | null = null;
    
    // Check localStorage first for the newly registered library
    const registeredLibraryData = localStorage.getItem("aliciaLibros_registeredLibrary");
    if (registeredLibraryData) {
      try {
        const newLibrary: LibraryDetails = JSON.parse(registeredLibraryData);
        if (newLibrary.id === libraryId) {
          foundLibrary = {
            ...newLibrary,
            address: newLibrary.address || "Dirección no disponible",
            phone: newLibrary.phone || "Teléfono no disponible",
            email: newLibrary.email || "Email no disponible",
          };
        }
      } catch (e) {
        console.error("Error parsing registered library from localStorage", e);
      }
    }
    
    // If not found in localStorage, check placeholder data
    if (!foundLibrary) {
      const placeholder = placeholderLibraries.find(l => l.id === libraryId);
      if (placeholder) {
        foundLibrary = {
          ...placeholder,
          address: "Dirección de ejemplo",
          phone: "123-456-7890",
          email: "ejemplo@libreria.com"
        };
      }
    }

    setLibrary(foundLibrary);

    if (foundLibrary) {
      // Mock books for this library
      setBooks(placeholderBooks.sort(() => 0.5 - Math.random()).slice(0, 6).map(b => ({...b, id: `${b.id}-lib-${foundLibrary?.id}`})));
      
      if (typeof window !== "undefined") {
        setIsFavorite(localStorage.getItem(`fav-lib-${foundLibrary.id}`) === 'true');
      }
    }

    setIsLoading(false);
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
      alert(newFavStatus ? `${library.name} añadida a favoritos.` : `${library.name} eliminada de favoritos.`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center flex flex-col justify-center items-center min-h-[60vh]">
        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-lg text-muted-foreground">Cargando detalles de la librería...</p>
      </div>
    );
  }

  if (!library) {
    return <div className="container mx-auto px-4 py-8 text-center">No se pudo encontrar la librería. Por favor, verifica el enlace o vuelve al directorio.</div>;
  }

  const { name, location, description, address, phone, email, imageUrl, dataAiHint } = library;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <Link href="/libraries" className="inline-flex items-center text-primary hover:underline mb-6 font-body">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al directorio
      </Link>

      <Card className="mb-8 md:mb-12 shadow-xl overflow-hidden">
        <div className="relative h-64 md:h-96 w-full">
          <Image
            src={imageUrl!}
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
                <span className="text-foreground/80">{address} - <a href={`https://maps.google.com/?q=${encodeURIComponent(address || '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver en mapa</a></span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground/80">Lunes a Sábado: 9am - 7pm</span> {/* Placeholder */}
              </div>
              <div className="flex items-center">
                <Phone className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <a href={`tel:${phone}`} className="text-primary hover:underline">{phone}</a>
              </div>
              <div className="flex items-center">
                <Mail className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <a href={`mailto:${email}`} className="text-primary hover:underline break-all">
                  {email}
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
