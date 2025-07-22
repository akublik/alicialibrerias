// src/components/LibraryPageClient.tsx
"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { Library, Book, LibraryEvent, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Phone, Mail, Search, BookOpen, ArrowLeft, Heart, CalendarDays as CalendarDaysIcon, Loader2, CalendarPlus, UserPlus, QrCode, ChevronsDown } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp, deleteDoc, limit, setDoc, increment } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import { Separator } from '@/components/ui/separator';

const ITEMS_PER_LOAD = 12;

// SVG Icons for social media
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
);

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 8v5a5 5 0 0 1-5 5H8.5a4.5 4.5 0 0 1 0-9H13v5a2 2 0 0 0 2 2h3"></path>
  </svg>
);


export default function LibraryPageClient() {
  const params = useParams();
  const libraryId = params.id as string;
  const { toast } = useToast();

  const [library, setLibrary] = useState<Library | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]); 
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteDocId, setFavoriteDocId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);


  // State for event registration dialog
  const [selectedEvent, setSelectedEvent] = useState<LibraryEvent | null>(null);
  const [registrationName, setRegistrationName] = useState('');
  const [registrationWhatsapp, setRegistrationWhatsapp] = useState('');
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const featuredBooks = useMemo(() => {
    return books.filter(book => book.isFeatured).slice(0, 8);
  }, [books]);

  const filteredBooks = useMemo(() => {
    if (!searchTerm) {
        return books;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return books.filter(book => 
        book.title.toLowerCase().includes(lowercasedTerm) ||
        book.authors.some(author => author.toLowerCase().includes(lowercasedTerm)) ||
        book.categories?.some(category => category.toLowerCase().includes(lowercasedTerm))
    );
  }, [books, searchTerm]);
  
  const currentBooks = useMemo(() => {
    return filteredBooks.slice(0, visibleCount);
  }, [filteredBooks, visibleCount]);
  
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchTerm]);

  useEffect(() => {
    const fetchLibraryData = async () => {
      if (!libraryId || !db) {
        setIsLoading(false);
        return;
      };

      // Get user from localStorage
      const userDataString = localStorage.getItem("aliciaLibros_user");
      if (userDataString) {
          try {
              setUser(JSON.parse(userDataString));
          } catch(e) {
              console.error("Failed to parse user data", e);
              setUser(null);
          }
      }
      
      setIsLoading(true);
      try {
          // Fetch library details
          const libraryRef = doc(db, "libraries", libraryId);
          const librarySnap = await getDoc(libraryRef);

          if (librarySnap.exists()) {
              const foundLibrary = { id: librarySnap.id, ...librarySnap.data() } as Library;
              setLibrary(foundLibrary);
              
              // Log visit
              logVisit(libraryId);

              // Fetch books for this library
              const booksRef = collection(db, "books");
              const qBooks = query(booksRef, where("libraryId", "==", libraryId));
              const booksSnapshot = await getDocs(qBooks);
              const libraryBooks = booksSnapshot.docs.map(doc => ({ 
                  id: doc.id,
                  ...doc.data(),
                  libraryName: foundLibrary.name,
                  libraryLocation: foundLibrary.location,
              } as Book));
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

              // Check favorite status from Firestore if user is logged in
              const currentUserData = localStorage.getItem("aliciaLibros_user");
              if (currentUserData) {
                  try {
                      const currentUser = JSON.parse(currentUserData);
                      if (currentUser && currentUser.id) {
                          const favRef = collection(db, 'userFavorites');
                          const qFav = query(favRef, where('userId', '==', currentUser.id), where('libraryId', '==', libraryId), limit(1));
                          const favSnapshot = await getDocs(qFav);
                          if (!favSnapshot.empty) {
                              setIsFavorite(true);
                              setFavoriteDocId(favSnapshot.docs[0].id);
                          }
                      }
                  } catch (e) {
                      console.error("Failed to check favorite status", e);
                  }
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
  
  const logVisit = async (id: string) => {
    if (!id || !db) return;
    const sessionKey = `visited-library-${id}`;
    if (sessionStorage.getItem(sessionKey)) {
      return; // Already visited this session
    }
    
    try {
      const analyticsRef = doc(db, "libraryAnalytics", id);
      await setDoc(analyticsRef, {
        visitCount: increment(1)
      }, { merge: true });
      sessionStorage.setItem(sessionKey, 'true');
    } catch (error) {
      console.error("Error logging library visit:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
        toast({
            title: "Inicia sesión para añadir favoritos",
            description: "Solo los usuarios registrados pueden guardar librerías como favoritas.",
            variant: "destructive",
        });
        return;
    }
    if (!library || !db) return;

    if (isFavorite && favoriteDocId) {
      // Unfavorite
      await deleteDoc(doc(db, 'userFavorites', favoriteDocId));
      setIsFavorite(false);
      setFavoriteDocId(null);
      toast({ title: "Eliminada de Favoritos", description: `${library.name} ha sido eliminada de tus librerías favoritas.` });
    } else {
      // Favorite
      const favRef = await addDoc(collection(db, 'userFavorites'), {
        userId: user.id,
        libraryId: library.id,
        createdAt: serverTimestamp(),
      });
      setIsFavorite(true);
      setFavoriteDocId(favRef.id);
      toast({ title: "Añadida a Favoritos", description: `${library.name} ha sido añadida a tus librerías favoritas.` });
    }
  };

  const handleEventRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationName.trim() || !registrationWhatsapp.trim() || !selectedEvent || !library) return;
    if (!db) {
        toast({ title: "Error de conexión", variant: "destructive" });
        return;
    }

    setIsSubmittingRegistration(true);
    try {
        await addDoc(collection(db, "eventRegistrations"), {
            eventId: selectedEvent.id,
            libraryId: library.id,
            name: registrationName,
            whatsapp: registrationWhatsapp,
            createdAt: serverTimestamp(),
        });
        toast({ title: "¡Registro Exitoso!", description: `Te has registrado a "${selectedEvent.title}". La librería se pondrá en contacto si es necesario.` });
        setSelectedEvent(null);
        setRegistrationName('');
        setRegistrationWhatsapp('');
    } catch (error: any) {
        toast({ title: "Error en el registro", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmittingRegistration(false);
    }
  };
  
  const createGoogleCalendarLink = (event: LibraryEvent, libraryAddress: string) => {
    if (!event || !event.date) return "#";
    
    const startTime = new Date(event.date);

    if (isNaN(startTime.getTime())) {
      console.error("Invalid event date provided to createGoogleCalendarLink:", event.date);
      return "#";
    }

    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Assume 1 hour duration
    
    const toGoogleFormat = (date: Date) => {
      // This check is the definitive fix.
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toISOString().replace(/-|:|\.\d{3}/g, '');
    };

    const googleStartTime = toGoogleFormat(startTime);
    const googleEndTime = toGoogleFormat(endTime);

    // If formatting fails, don't generate a broken link.
    if (!googleStartTime || !googleEndTime) {
      return "#";
    }

    const eventTitle = encodeURIComponent(event.title);
    const eventDetails = encodeURIComponent(event.description);
    const eventLocation = encodeURIComponent(libraryAddress);

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${googleStartTime}/${googleEndTime}&details=${eventDetails}&location=${eventLocation}`;
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
        <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden bg-card shadow-lg p-4 flex justify-center items-center">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30" 
              style={{ backgroundImage: `url('/images/library-background.jpg')` }}
              data-ai-hint="bookstore background"
            ></div>
           {imageUrl && (
              <Image
                src={imageUrl}
                alt={`Logo de ${name}`}
                width={300}
                height={150}
                className="object-contain h-full w-auto relative z-10"
                priority
                data-ai-hint={dataAiHint || 'library logo'}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-6">
                <h1 className="font-headline text-3xl md:text-5xl font-bold text-primary shadow-2xl">{name}</h1>
                 <p className="text-lg text-foreground/80 flex items-center mt-2">
                  <MapPin className="mr-2 h-5 w-5" /> {location}
                </p>
            </div>
             <div className="absolute top-4 right-4">
                 <Button onClick={toggleFavorite} variant="secondary" size="lg" className="shrink-0 font-body shadow-md">
                    <Heart className={cn("mr-2 h-5 w-5", isFavorite && "fill-primary text-primary")} />
                    {isFavorite ? 'Favorita' : 'Agregar a Favoritos'}
                </Button>
            </div>
        </div>
      </header>

      {description && (
        <Card className="mb-8 md:mb-12 shadow-lg">
          <CardContent className="p-6">
            <p className="text-foreground/90 leading-relaxed text-center text-lg">{description}</p>
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
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || name)}`} target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-primary hover:underline">
                  {address}
                </a>
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
                <CardTitle className="font-headline text-xl flex items-center">
                    <QrCode className="mr-2 h-5 w-5 text-primary"/>
                    Código de Lealtad
                </CardTitle>
                 <CardDescription>Escanea este código en la librería para acumular puntos o identificarte.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-6">
                {library.id ? (
                    <div className="p-4 bg-white rounded-lg">
                      <QRCodeSVG value={library.id} size={160} />
                    </div>
                ) : (
                    <p className="text-muted-foreground">No se pudo generar el código.</p>
                )}
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
                <CardContent className="pt-6">
                  {featuredBooks.length > 0 && (
                    <div className="mb-10">
                      <h3 className="font-headline text-2xl font-semibold text-foreground mb-6 text-center md:text-left">Libros Destacados</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {featuredBooks.map((book) => (
                          <BookCard key={book.id} book={book} />
                        ))}
                      </div>
                      <Separator className="my-8" />
                    </div>
                  )}

                  <CardTitle className="font-headline text-xl mb-6">Catálogo Completo</CardTitle>
                  <div className="mb-6 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                          type="text"
                          placeholder="Buscar en el catálogo por título, autor o categoría..."
                          className="pl-10 h-11"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  {currentBooks.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {currentBooks.map((book) => (
                          <BookCard key={book.id} book={book} />
                        ))}
                      </div>
                       {visibleCount < filteredBooks.length && (
                        <div className="text-center mt-12">
                          <Button onClick={() => setVisibleCount(prev => prev + ITEMS_PER_LOAD)} size="lg">
                            <ChevronsDown className="mr-2 h-5 w-5" />
                            Ver más
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                       <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                       <h3 className="text-xl font-semibold">No se encontraron libros</h3>
                       <p className="text-muted-foreground">
                         {searchTerm ? `No hay libros que coincidan con "${searchTerm}".` : "Esta librería aún no ha publicado libros."}
                       </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Eventos en ${name}</CardTitle>
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
                          <CardFooter className="p-4 pt-0 mt-auto flex-col sm:flex-row gap-2">
                              <Button variant="default" className="w-full font-body" onClick={() => setSelectedEvent(event)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Registrarme
                              </Button>
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

       <Dialog open={!!selectedEvent} onOpenChange={(isOpen) => { if (!isOpen) setSelectedEvent(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrarme en "{selectedEvent?.title}"</DialogTitle>
              <DialogDescription>
                Deja tus datos para que la librería sepa que estás interesado/a.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEventRegistration}>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Nombre</Label>
                      <Input id="name" value={registrationName} onChange={(e) => setRegistrationName(e.target.value)} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="whatsapp" className="text-right">WhatsApp</Label>
                      <Input id="whatsapp" value={registrationWhatsapp} onChange={(e) => setRegistrationWhatsapp(e.target.value)} className="col-span-3" required />
                  </div>
              </div>
              <DialogFooter>
                  <Button type="submit" disabled={isSubmittingRegistration}>
                      {isSubmittingRegistration ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                      Confirmar Registro
                  </Button>
              </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>

    </div>
  );
}
