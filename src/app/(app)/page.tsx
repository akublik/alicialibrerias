
// src/app/(app)/page.tsx
"use client";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";
import { SearchBar } from "@/components/SearchBar";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookHeart, Users, MapPinned, Sparkles, Loader2 } from "lucide-react";
import { LibraryCard } from "@/components/LibraryCard";
import { useEffect, useState, useRef } from "react";
import type { Book, Library, Author, HomepageContent, SecondaryBannerSlide } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, doc, getDoc, where, documentId } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";


export default function HomePage() {
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [featuredAuthors, setFeaturedAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

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

        if (contentDocSnap.exists()) {
          const contentData = contentDocSnap.data();
          setHomepageContent({
            bannerTitle: contentData.bannerTitle || "Bienvenido a Alicia Libros",
            bannerSubtitle: contentData.bannerSubtitle || "Tu portal al universo de las librerías independientes.",
            bannerImageUrl: contentData.bannerImageUrl || "https://placehold.co/1920x1080.png",
            bannerDataAiHint: contentData.bannerDataAiHint || "library pattern",
            featuredBookIds: contentData.featuredBookIds || [],
            secondaryBannerSlides: contentData.secondaryBannerSlides || []
          });
          if (contentData.featuredBookIds && contentData.featuredBookIds.length > 0) {
            featuredBookIds = contentData.featuredBookIds;
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

        // --- Fetch Featured Books ---
        if (featuredBookIds.length > 0) {
          const booksRef = collection(db, "books");
          // Firestore 'in' query is limited to 30 elements, but we only need 4.
          const booksQuery = query(booksRef, where(documentId(), "in", featuredBookIds));
          const booksSnapshot = await getDocs(booksQuery);
          const books = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
          // Preserve order from featuredBookIds
          const orderedBooks = featuredBookIds.map(id => books.find(b => b.id === id)).filter(Boolean) as Book[];
          setFeaturedBooks(orderedBooks);
        } else {
           // Fallback if no featured books are set
           const fallbackBooksQuery = query(collection(db, "books"), limit(4));
           const booksSnapshot = await getDocs(fallbackBooksQuery);
           const books: Book[] = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
           setFeaturedBooks(books);
        }

        // Fetch Authors
        const authorsRef = collection(db, "authors");
        const authorsQuery = query(authorsRef, limit(4));
        const authorsSnapshot = await getDocs(authorsQuery);
        const authors: Author[] = authorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author));
        setFeaturedAuthors(authors);

      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (term: string) => {
    console.log("Searching for:", term);
  };

  const platformBenefits = [
    { title: "Descubre Joyas Literarias", description: "Encuentra libros únicos de editoriales independientes y autores emergentes.", icon: BookHeart },
    { title: "Apoya el Talento Local", description: "Cada compra es un impulso a las librerías y autores de tu comunidad.", icon: Users },
    { title: "Explora tu Ciudad", description: "Ubica librerías cercanas y redescubre el placer de visitar espacios llenos de historias.", icon: MapPinned },
    { title: "Recomendaciones Inteligentes", description: "Nuestra IA te ayuda a encontrar tu próxima lectura favorita.", icon: Sparkles },
  ];

  return (
    <div className="animate-fadeIn">
      {/* 1. Banner (Hero Section) */}
      <section className="relative py-32 md:py-48 bg-gradient-to-br from-primary/10 via-background to-background pt-24 md:pt-40">
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
            </div>
          </>
        ) : (
          <div className="container mx-auto px-4 text-center relative z-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8 relative z-10">
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
      </section>

      {/* Secondary Banner Carousel */}
      {homepageContent?.secondaryBannerSlides && homepageContent.secondaryBannerSlides.length > 0 && (
          <section className="pb-12 pt-8 bg-muted/30">
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
      <section className="py-16 bg-background">
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

      {/* 3. Autores Destacados */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">Autores Destacados</h2>
          {isLoading ? (
             <div className="flex justify-center items-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : featuredAuthors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {featuredAuthors.map((author) => (
                <div key={author.id} className="text-center group">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden shadow-lg mb-4 border-4 border-primary/20 group-hover:border-primary transition-colors">
                    {author.imageUrl && (
                      <Image
                        src={author.imageUrl}
                        alt={author.name}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={author.dataAiHint}
                      />
                    )}
                  </div>
                  <h3 className="font-headline text-lg font-medium text-foreground group-hover:text-primary transition-colors">{author.name}</h3>
                  <p className="text-xs text-muted-foreground px-2 line-clamp-2">{author.bio}</p>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-center text-muted-foreground">No hay autores destacados para mostrar.</p>
          )}
        </div>
      </section>

      {/* 4. Buscador Librerías */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-4 text-foreground">Encuentra tu Librería</h2>
          <p className="text-center text-lg text-foreground/70 mb-8 max-w-xl mx-auto">
            Busca entre decenas de librerías independientes y descubre tu próximo rincón literario favorito.
          </p>
          <SearchBar onSearch={handleSearch} className="max-w-2xl mx-auto" />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
                <div className="sm:col-span-2 lg:col-span-3 flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : null }
          </div>
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
