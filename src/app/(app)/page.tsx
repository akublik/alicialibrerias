// src/app/(app)/page.tsx
"use client";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookHeart, Users, MapPinned, Sparkles, Loader2, Search } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { Book, HomepageContent, SecondaryBannerSlide } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, doc, getDoc, where, documentId } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";


export default function HomePage() {
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [nationalBooks, setNationalBooks] = useState<Book[]>([]);
  const [nationalSectionTitle, setNationalSectionTitle] = useState("Libros Nacionales");
  const [isLoading, setIsLoading] = useState(true);
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchTerm.trim()) {
          router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      }
  }


  useEffect(() => {
    const fetchData = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      try {
        // --- Fetch Homepage Content ---
        const contentDocRef = doc(db, "homepage_content", "sections");
        const contentDocSnap = await getDoc(contentDocRef);
        
        let featuredBookIds: string[] = [];
        let nationalBookIds: string[] = [];

        if (contentDocSnap.exists()) {
          const contentData = contentDocSnap.data() as HomepageContent;
          setHomepageContent({
            bannerTitle: contentData.bannerTitle || "Bienvenido a Alicia Libros",
            bannerSubtitle: contentData.bannerSubtitle || "Tu portal al universo de las librerías independientes.",
            bannerImageUrl: contentData.bannerImageUrl || "https://placehold.co/1920x1080.png",
            bannerDataAiHint: contentData.bannerDataAiHint || "library pattern",
            featuredBookIds: contentData.featuredBookIds || [],
            secondaryBannerSlides: contentData.secondaryBannerSlides || [],
            nationalSectionTitle: contentData.nationalSectionTitle || "Libros Nacionales",
            nationalBookIds: contentData.nationalBookIds || [],
          });
          if (contentData.featuredBookIds && contentData.featuredBookIds.length > 0) {
            featuredBookIds = contentData.featuredBookIds;
          }
          if (contentData.nationalSectionTitle) {
            setNationalSectionTitle(contentData.nationalSectionTitle);
          }
          if (contentData.nationalBookIds && contentData.nationalBookIds.length > 0) {
            nationalBookIds = contentData.nationalBookIds;
          }
        } else {
           // Default banner if content doc doesn't exist
           setHomepageContent({
             bannerTitle: "Bienvenido a Alicia Libros",
             bannerSubtitle: "Tu portal al universo de las librerías independientes.",
             bannerImageUrl: "https://placehold.co/1920x1080.png",
             bannerDataAiHint: "library pattern",
             featuredBookIds: [],
             secondaryBannerSlides: [],
           });
        }
        
        const booksRef = collection(db, "books");

        // --- Fetch All Books needed in one go if possible ---
        const allNeededIds = [...new Set([...featuredBookIds, ...nationalBookIds])];
        let allBooks: Book[] = [];
        if (allNeededIds.length > 0) {
            const chunks: string[][] = [];
            for (let i = 0; i < allNeededIds.length; i += 30) {
                chunks.push(allNeededIds.slice(i, i + 30));
            }
            const bookPromises = chunks.map(chunk => getDocs(query(booksRef, where(documentId(), "in", chunk))));
            const bookSnapshots = await Promise.all(bookPromises);
            bookSnapshots.forEach(snapshot => {
                snapshot.docs.forEach(doc => {
                    allBooks.push({ id: doc.id, ...doc.data() } as Book);
                });
            });
        }

        // --- Populate Featured Books ---
        if (featuredBookIds.length > 0) {
          const orderedBooks = featuredBookIds.map(id => allBooks.find(b => b.id === id)).filter(Boolean) as Book[];
          setFeaturedBooks(orderedBooks);
        } else {
           const fallbackBooksQuery = query(collection(db, "books"), limit(4));
           const booksSnapshot = await getDocs(fallbackBooksQuery);
           const books: Book[] = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
           setFeaturedBooks(books);
        }

        // --- Populate National Books ---
        if (nationalBookIds.length > 0) {
          const orderedNationalBooks = nationalBookIds.map(id => allBooks.find(b => b.id === id)).filter(Boolean) as Book[];
          setNationalBooks(orderedNationalBooks);
        } else {
          setNationalBooks([]);
        }

      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const platformBenefits = [
    { title: "Descubre Joyas Literarias", description: "Encuentra libros únicos de editoriales independientes y autores emergentes.", icon: BookHeart },
    { title: "Apoya el Talento Local", description: "Cada compra es un impulso a las librerías y autores de tu comunidad.", icon: Users },
    { title: "Explora tu Ciudad", description: "Ubica librerías cercanas y redescubre el placer de visitar espacios llenos de historias.", icon: MapPinned },
    { title: "Recomendaciones Inteligentes", description: "Nuestra IA te ayuda a encontrar tu próxima lectura favorita.", icon: Sparkles },
  ];

  return (
    <div className="animate-fadeIn">
      {/* 1. Banner (Hero Section) */}
      <section className="relative pb-36 md:pb-40 pt-32 md:pt-48 bg-gradient-to-br from-primary/10 via-background to-background">
        {homepageContent ? (
          <>
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url('${homepageContent.bannerImageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} data-ai-hint={homepageContent.bannerDataAiHint}></div>
            <div className="container mx-auto px-4 text-center relative z-10">
              <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 text-primary">
                {homepageContent.bannerTitle}
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
                {homepageContent.bannerSubtitle}
              </p>
               <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/libraries">
                  <Button size="lg" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                    Explorar Librerías
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/recommendations">
                  <Button size="lg" variant="outline" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                    Obtener Recomendaciones
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="container mx-auto px-4 text-center relative z-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          </div>
        )}
      </section>

      {/* Search Bar Section */}
      <section className="container mx-auto px-4 -mt-24 relative z-20">
          <Card className="p-4 md:p-6 shadow-xl border-2 border-primary/10">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="md:col-span-3">
                <Input
                  type="text"
                  placeholder="Busca por título, autor o ISBN..."
                  className="h-12 text-lg w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Buscar libros"
                />
              </div>
              <Button type="submit" size="lg" className="md:col-span-1 h-12 text-base w-full">
                <Search className="mr-2 h-5 w-5" /> Buscar Libros
              </Button>
              <Link href="/libraries" className="md:col-span-1">
                <Button variant="outline" size="lg" className="w-full h-12 text-base">
                  <MapPinned className="mr-2 h-5 w-5" /> Librerías Cercanas
                </Button>
              </Link>
            </form>
          </Card>
      </section>


      {/* Secondary Banner Carousel */}
      {homepageContent?.secondaryBannerSlides && homepageContent.secondaryBannerSlides.length > 0 && (
          <section className="pt-24 pb-12 bg-background">
              <div className="container mx-auto px-4">
                  <Carousel
                      plugins={[autoplay.current]}
                      className="w-full"
                      opts={{ loop: true }}
                  >
                      <CarouselContent>
                          {(homepageContent.secondaryBannerSlides as SecondaryBannerSlide[]).map((slide, index) => {
                            const cardContent = (
                               <Card className="relative aspect-[16/5] w-full overflow-hidden group rounded-lg shadow-lg bg-secondary flex items-center justify-center">
                                  {slide.imageUrl ? (
                                    <Image
                                        src={slide.imageUrl}
                                        alt={slide.title}
                                        layout="fill"
                                        objectFit="cover"
                                        className="transition-transform duration-500 group-hover:scale-105"
                                    />
                                  ) : <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20"></div>}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col items-center justify-end text-center p-6 md:p-10">
                                      <h3 className="font-headline text-2xl md:text-4xl font-bold text-white shadow-2xl">{slide.title}</h3>
                                      <p className="text-md md:text-lg text-white/90 shadow-lg mt-2 max-w-2xl">{slide.subtitle}</p>
                                  </div>
                              </Card>
                            );

                            return (
                              <CarouselItem key={index}>
                                  {slide.linkUrl ? (
                                      <Link href={slide.linkUrl} passHref>
                                          {cardContent}
                                      </Link>
                                  ) : (
                                      <div className="cursor-default">{cardContent}</div>
                                  )}
                              </CarouselItem>
                            );
                          })}
                      </CarouselContent>
                      <CarouselPrevious className="hidden sm:flex left-[-50px]" />
                      <CarouselNext className="hidden sm:flex right-[-50px]" />
                  </Carousel>
              </div>
          </section>
      )}


      {/* 2. Libros Destacados */}
      <section className="pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">Libros Destacados</h2>
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : featuredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} size="small" />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No hay libros destacados en este momento.</p>
          )}
          <div className="text-center mt-10">
            <Link href="/books">
              <Button variant="link" className="text-primary font-body">
                Ver todos los libros <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Libros Nacionales */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">{nationalSectionTitle}</h2>
          {isLoading ? (
             <div className="flex justify-center items-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : nationalBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {nationalBooks.map((book) => (
                <BookCard key={book.id} book={book} size="small" />
              ))}
            </div>
          ) : (
             <p className="text-center text-muted-foreground">No hay libros seleccionados para esta sección.</p>
          )}
        </div>
      </section>
      
      {/* 5. Explicación de la plataforma */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-4 text-foreground">¿Qué es Alicia Libros?</h2>
          <p className="text-center text-lg text-foreground/70 mb-12 max-w-3xl mx-auto">
            Alicia Libros es un marketplace que conecta a lectores apasionados con la riqueza y diversidad de las librerías independientes de Ecuador y Latinoamérica. Fomentamos la lectura, apoyamos la cultura local y te ayudamos a descubrir tu próxima gran aventura literaria.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformBenefits.map(benefit => (
              <div key={benefit.title} className="text-center p-6 bg-card rounded-lg shadow-sm hover:shadow-lg transition-shadow">
                <benefit.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-headline text-xl font-semibold mb-2 text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
