// src/app/(app)/about/page.tsx
"use client";

import { BookHeart, Users, MapPinned, Sparkles, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AboutUsContent } from '@/types';

export default function AboutPage() {
  const [content, setContent] = useState<AboutUsContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchContent = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      try {
        const contentRef = doc(db, "site_content", "about_us_page");
        const docSnap = await getDoc(contentRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as AboutUsContent);
        } else {
          // Set default content if nothing is in Firestore yet
          setContent({
            headerTitle: "Sobre Alicia Libros",
            headerSubtitle: "Nuestra pasión es conectar a lectores con la magia de las librerías independientes, fomentando la cultura y el amor por la lectura en cada rincón de Latinoamérica.",
            headerImageUrl: "https://placehold.co/1920x1080.png?text=Book+Pattern",
            headerDataAiHint: "subtle pattern",
            missionTitle: "Nuestra Misión",
            missionParagraph1: "En Alicia Libros, creemos que cada librería independiente es un tesoro cultural, un espacio único que ofrece mucho más que libros: ofrece comunidad, descubrimiento y pasión por las historias. Nuestra misión es ser el puente que une estos valiosos espacios con lectores ávidos de nuevas aventuras literarias.",
            missionParagraph2: "Buscamos fortalecer el ecosistema del libro en Ecuador y Latinoamérica, proporcionando herramientas tecnológicas a las librerías para que puedan prosperar y llegar a más personas, mientras ofrecemos a los lectores una plataforma intuitiva y enriquecedora para explorar, conectar y comprar.",
            missionImageUrl: "https://placehold.co/600x400.png",
            missionDataAiHint: "diverse team discussion",
            team: [
              { name: 'Elena Rodriguez', role: 'Fundadora y CEO', imageUrl: 'https://placehold.co/200x200.png?text=Elena', dataAiHint: 'woman professional' },
              { name: 'Carlos Vega', role: 'Director de Tecnología', imageUrl: 'https://placehold.co/200x200.png?text=Carlos', dataAiHint: 'man tech' },
              { name: 'Sofía Torres', role: 'Encargada de Comunidad', imageUrl: 'https://placehold.co/200x200.png?text=Sofia', dataAiHint: 'woman community' },
            ]
          });
        }
      } catch (error) {
        console.error("Error fetching about page content:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        No se pudo cargar el contenido.
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url('${content.headerImageUrl}')` }} data-ai-hint={content.headerDataAiHint}></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 text-primary">
            {content.headerTitle}
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            {content.headerSubtitle}
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-headline text-3xl font-semibold text-foreground mb-6">{content.missionTitle}</h2>
              <p className="text-lg text-foreground/70 mb-4 leading-relaxed">
                {content.missionParagraph1}
              </p>
              <p className="text-lg text-foreground/70 leading-relaxed">
                {content.missionParagraph2}
              </p>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
                <Image src={content.missionImageUrl} alt="Equipo de Alicia Libros trabajando" layout="fill" objectFit="cover" data-ai-hint={content.missionDataAiHint} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-12 text-foreground">¿Por Qué Alicia Libros?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Amor por los Libros", description: "Compartimos una profunda pasión por la lectura y el valor de las historias.", icon: BookHeart },
              { title: "Apoyo a lo Local", description: "Impulsamos a las librerías independientes, corazón de nuestras comunidades.", icon: Users },
              { title: "Descubrimiento Continuo", description: "Te ayudamos a encontrar joyas literarias y autores que te sorprenderán.", icon: Sparkles },
              { title: "Conexión Cultural", description: "Facilitamos el acceso a la diversidad literaria de Latinoamérica.", icon: MapPinned },
            ].map(benefit => (
              <div key={benefit.title} className="text-center p-6 bg-card rounded-lg shadow-sm hover:shadow-lg transition-shadow">
                <benefit.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-headline text-xl font-semibold mb-2 text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-12 text-foreground">Nuestro Equipo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {content.team.map((member) => (
              <Card key={member.name} className="text-center overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="relative w-full h-56 bg-gray-200">
                     <Image src={member.imageUrl} alt={member.name} layout="fill" objectFit="cover" data-ai-hint={member.dataAiHint}/>
                </div>
                <div className="p-6">
                  <h3 className="font-headline text-xl font-medium text-foreground">{member.name}</h3>
                  <p className="text-sm text-primary font-semibold">{member.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}