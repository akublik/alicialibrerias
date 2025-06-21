
// src/app/(app)/libraries/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { Library, Book } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Phone, Mail, Search, BookOpen, ArrowLeft, Heart, CalendarDays as CalendarDaysIcon, Loader2 } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

const googleMapsApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// SVG Icons for social media
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
);

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 8v5a5 5 0 0 1-5 5H8.5a4.5 4.5 0 0 1 0-9H13v5a2 2 0 0 0 2 2h3"></path>
  </svg>
);


export default function LibraryDetailsPage() {
  const params = useParams();
  const libraryId = params.id as string;
  const { toast } = useToast();

  const [library, setLibrary] = useState<Library | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]); 
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!libraryId || !db) {
      setIsLoading(false);
      return;
    };
    
    const fetchLibraryData = async () => {
        setIsLoading(true);
        try {
            // Fetch library details
            const libraryRef = doc(db, "libraries", libraryId);
            const librarySnap = await getDoc(libraryRef);

            if (librarySnap.exists()) {
                const foundLibrary = { id: librarySnap.id, ...librarySnap.data() } as Library;
                setLibrary(foundLibrary);
                
                // Fetch books for this library
                const booksRef = collection(db, "books");
                const q = query(booksRef, where("libraryId", "==", libraryId));
                const booksSnapshot = await getDocs(q);
                const libraryBooks = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
                setBooks(libraryBooks);

                // Check favorite status from localStorage
                if (typeof window !== "undefined") {
                    setIsFavorite(localStorage.getItem(`fav-lib-${foundLibrary.id}`) === 'true');
                }
            } else {
                console.error("No such library document!");
            }
        } catch (error) {
            console.error("Error fetching library data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchLibraryData();
  }, [libraryId]);
  
  const toggleFavorite = () => {
    if (library && typeof window !== "undefined") {
      const newFavStatus = !isFavorite;
      setIsFavorite(newFavStatus);
      if (newFavStatus) {
        localStorage.setItem(`fav-lib-${library.id}`, 'true');
        toast({ title: "Añadida a Favoritos", description: `${library.name} ha sido añadida a tus librerías favoritas.` });
      } else {
        localStorage.removeItem(`fav-lib-${library.id}`);
        toast({ title: "Eliminada de Favoritos", description: `${library.name} ha sido eliminada de tus librerías favoritas.` });
      }
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

  const { name, location, description, address, phone, email, imageUrl, dataAiHint, instagram, facebook, tiktok } = library;

  const hasSocials = instagram || facebook || tiktok;

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
            data-ai-hint={dataAiHint || 'library exterior'}
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
        <div className="md:col-span-1 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start">
                <MapPin className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">{address} - <a href={`https://maps.google.com/?q=${encodeURIComponent(address || '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver en mapa</a></span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground/80">Lunes a Sábado: 9am - 7pm</span> {/* Placeholder */}
              </div>
              {phone && 
              <div className="flex items-center">
                <Phone className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <a href={`tel:${phone}`} className="text-primary hover:underline">{phone}</a>
              </div>
              }
              {email && 
              <div className="flex items-center">
                <Mail className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <a href={`mailto:${email}`} className="text-primary hover:underline break-all">
                  {email}
                </a>
              </div>
              }
              {hasSocials && (
                <div className="flex items-center space-x-2 pt-4 border-t">
                  {instagram && <Button asChild variant="outline" size="icon"><a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon className="h-5 w-5" /></a></Button>}
                  {facebook && <Button asChild variant="outline" size="icon"><a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FacebookIcon className="h-5 w-5" /></a></Button>}
                  {tiktok && <Button asChild variant="outline" size="icon"><a href={tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><TikTokIcon className="h-5 w-5" /></a></Button>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Ubicación en el Mapa</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative w-full aspect-video rounded-b-lg overflow-hidden bg-muted">
                    {googleMapsApiKey ? (
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(address || name)}`}
                            title={`Ubicación de ${name}`}
                            aria-label={`Ubicación de ${name}`}
                        ></iframe>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                            <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm font-semibold text-foreground">Mapa no disponible</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                La clave de API para Google Maps no está configurada.
                            </p>
                        </div>
                    )}
                </div>
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
                       <p className="text-muted-foreground">Esta librería aún no ha publicado libros.</p>
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
