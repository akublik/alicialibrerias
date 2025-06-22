// src/app/(app)/libraries/[id]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { Library, Book, LibraryEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Phone, Mail, Search, BookOpen, ArrowLeft, Heart, CalendarDays as CalendarDaysIcon, Loader2, CalendarPlus } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
  const [events, setEvents] = useState<LibraryEvent[]>([]);
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
                const qBooks = query(booksRef, where("libraryId", "==", libraryId));
                const booksSnapshot = await getDocs(qBooks);
                const libraryBooks = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
                setBooks(libraryBooks);
                
                // Fetch events for this library
                const eventsRef = collection(db, "events");
                const qEvents = query(eventsRef, where("libraryId", "==", libraryId));
                const eventsSnapshot = await getDocs(qEvents);
                const libraryEvents = eventsSnapshot.docs.map(doc => ({ 
                  id: doc.id, 
                  ...doc.data(),
                  date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString() : doc.data().date,
                } as LibraryEvent));
                // Sort events by date, future events first
                libraryEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setEvents(libraryEvents);

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

  const createGoogleCalendarLink = (event: LibraryEvent, libraryAddress: string) => {
    if (!event.date) return '#';
    const startTime = new Date(event.date);
    // Assume event is 1 hour long for simplicity
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const toGoogleFormat = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d{3}/g, '');
    };

    const eventTitle = encodeURIComponent(event.title);
    const eventDetails = encodeURIComponent(event.description);
    const eventLocation = encodeURIComponent(libraryAddress);

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${toGoogleFormat(startTime)}/${toGoogleFormat(endTime)}&details=${eventDetails}&location=${eventLocation}`;
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

      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-md border-4 border-primary/20 flex-shrink-0">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={`Logo de ${name}`}
                layout="fill"
                objectFit="cover"
                priority
                data-ai-hint={dataAiHint || 'library logo'}
              />
            )}
          </div>
          <div className="flex-grow text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-1">{name}</h1>
                <p className="text-lg text-foreground/80 flex items-center justify-center sm:justify-start">
                  <MapPin className="mr-2 h-5 w-5" /> {location}
                </p>
              </div>
              <Button onClick={toggleFavorite} variant="outline" size="lg" className="shrink-0 font-body">
                <Heart className={cn("mr-2 h-5 w-5", isFavorite && "fill-primary text-primary")} />
                {isFavorite ? 'Favorita' : 'Agregar a Favoritos'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {description && (
        <Card className="mb-8 md:mb-12 shadow-lg">
          <CardContent className="p-6">
            <p className="text-foreground/90 leading-relaxed">{description}</p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <div className="md:col-span-1 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start">
                <MapPin className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">{address}</span>
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
                                No se ha proporcionado una clave de API de Google Maps.
                            </p>
                             <p className="text-xs text-muted-foreground mt-2">
                                Si eres el administrador, revisa la consola del navegador (F12) para ver errores específicos si la clave ya fue añadida.
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
                <CalendarDaysIcon className="mr-2 h-5 w-5" /> Próximos Eventos ({events.length})
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
                <CardContent>
                  {events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {events.map((event) => (
                        <Card key={event.id} className="flex flex-col overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                          <div className="relative w-full aspect-video">
                            <Image src={event.imageUrl} alt={event.title} layout="fill" objectFit="cover" data-ai-hint={event.dataAiHint || 'event promo'}/>
                          </div>
                          <CardHeader className="p-4 pb-2">
                              <CardTitle className="font-headline text-lg text-primary">{event.title}</CardTitle>
                              <CardDescription className="text-sm text-muted-foreground font-medium flex items-center pt-1">
                                  <CalendarDaysIcon className="mr-2 h-4 w-4" />
                                  {format(new Date(event.date), "PPP 'a las' p", { locale: es })}
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                              <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-3">{event.description}</p>
                          </CardContent>
                          <CardFooter className="p-4 pt-0 mt-auto">
                              <a 
                                  href={createGoogleCalendarLink(event, library.address || library.name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full"
                              >
                                  <Button variant="outline" className="w-full font-body">
                                      <CalendarPlus className="mr-2 h-4 w-4" />
                                      Añadir al Calendario
                                  </Button>
                              </a>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CalendarDaysIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No hay eventos programados próximamente. ¡Visítanos pronto para novedades!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
