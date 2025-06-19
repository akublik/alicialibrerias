// src/app/(app)/page.tsx
"use client";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/BookCard";
import { SearchBar } from "@/components/SearchBar";
import { placeholderBooks, ecuadorianAuthors, placeholderLibraries } from "@/lib/placeholders";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookHeart, Users, MapPinned, Sparkles } from "lucide-react";
import { LibraryCard } from "@/components/LibraryCard";

export default function HomePage() {
  const handleSearch = (term: string) => {
    // TODO: Implement search logic or navigation
    console.log("Searching for:", term);
    // router.push(`/libraries?search=${term}`);
  };

  const platformBenefits = [
    { title: "Descubre Joyas Literarias", description: "Encuentra libros únicos de editoriales independientes y autores emergentes.", icon: BookHeart },
    { title: "Apoya el Talento Local", description: "Cada compra es un impulso a las librerías y autores de tu comunidad.", icon: Users },
    { title: "Explora tu Ciudad", description: "Ubica librerías cercanas y redescubre el placer de visitar espacios llenos de historias.", icon: MapPinned },
    { title: "Recomendaciones Inteligentes", description: "Nuestra IA te ayuda a encontrar tu próxima lectura favorita.", icon: Sparkles },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url('https://placehold.co/1920x1080.png?text=Alicia+Lee+Background')", backgroundSize: 'cover', backgroundPosition: 'center' }} data-ai-hint="library pattern"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 text-primary">
            Bienvenido a Alicia Lee
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            Tu portal al universo de las librerías independientes. Descubre, conecta y apoya la cultura literaria local.
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
      </section>

      {/* Featured Books Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">Libros Destacados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {placeholderBooks.slice(0, 4).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/books">
              <Button variant="link" className="text-primary font-body">
                Ver todos los libros <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Platform Explanation Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-4 text-foreground">¿Qué es Alicia Lee?</h2>
          <p className="text-center text-lg text-foreground/70 mb-12 max-w-3xl mx-auto">
            Alicia Lee es un marketplace que conecta a lectores apasionados con la riqueza y diversidad de las librerías independientes de Ecuador y Latinoamérica. Fomentamos la lectura, apoyamos la cultura local y te ayudamos a descubrir tu próxima gran aventura literaria.
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

      {/* Ecuadorian Authors Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">Autores Ecuatorianos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {ecuadorianAuthors.map((author) => (
              <div key={author.id} className="text-center group">
                <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden shadow-lg mb-4 border-4 border-primary/20 group-hover:border-primary transition-colors">
                  <Image
                    src={author.imageUrl}
                    alt={author.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={author.dataAiHint}
                  />
                </div>
                <h3 className="font-headline text-lg font-medium text-foreground group-hover:text-primary transition-colors">{author.name}</h3>
                <p className="text-xs text-muted-foreground px-2 line-clamp-2">{author.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Library Search Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-4 text-foreground">Encuentra tu Librería</h2>
          <p className="text-center text-lg text-foreground/70 mb-8 max-w-xl mx-auto">
            Busca entre decenas de librerías independientes y descubre tu próximo rincón literario favorito.
          </p>
          <SearchBar onSearch={handleSearch} className="max-w-2xl mx-auto" />
           <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {placeholderLibraries.slice(0,3).map(library => (
              <LibraryCard key={library.id} library={library} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
