// src/app/(app)/about/page.tsx
"use client";

import { BookHeart, Users, MapPinned, Sparkles, Loader2, Award, BookOpen, Globe, HeartHandshake, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AboutUsContent, FeatureListItem } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const iconMap: { [key: string]: React.ElementType } = {
  BookHeart,
  Users,
  MapPinned,
  Sparkles,
  Award,
  BookOpen,
  Globe,
  HeartHandshake,
};

export default function AboutPage() {
  const [content, setContent] = useState<AboutUsContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const defaultContent: AboutUsContent = {
    headerTitle: "Sobre Alicia Libros",
    headerSubtitle: "Nuestra pasión es conectar a lectores con la magia de las librerías independientes, fomentando la cultura y el amor por la lectura en cada rincón de Latinoamérica.",
    headerImageUrl: "https://placehold.co/1920x1080.png?text=Book+Pattern",
    headerDataAiHint: "subtle pattern",
    missionTitle: "Nuestra Misión",
    missionParagraph1: "Conectar a lectores de todo el mundo con la riqueza y diversidad de las librerías independientes de Latinoamérica, fortaleciendo la cultura local y el amor por la lectura.",
    missionParagraph2: "A través de una plataforma tecnológica intuitiva, ofrecemos a las librerías las herramientas para prosperar en el mundo digital y a los lectores una puerta de entrada para descubrir, comprar y vivir nuevas historias.",
    missionImageUrl: "https://placehold.co/600x400.png",
    missionDataAiHint: "diverse team discussion",
    featuresTitle: "Beneficios y Funcionalidades de la Plataforma",
    featuresForLibraries: [
        { feature: "Gestión de inventario centralizada y en tiempo real." },
        { feature: "Importación masiva de libros mediante archivos CSV." },
        { feature: "Panel de administración para gestionar pedidos y clientes." },
        { feature: "Creación y promoción de eventos literarios." },
        { feature: "Herramientas de marketing con IA para generar contenido." },
        { feature: "Estadísticas de venta y analíticas de búsqueda." },
    ],
    featuresForReaders: [
        { feature: "Compra en línea de un extenso catálogo de librerías locales." },
        { feature: "Programa de puntos y lealtad con promociones exclusivas." },
        { feature: "Recomendaciones de libros personalizadas por IA." },
        { feature: "Biblioteca digital para leer y conversar con tus libros." },
        { feature: "Participación en una comunidad activa de lectores." },
        { feature: "Descubrimiento de eventos y actividades culturales." },
    ],
    team: [
      { name: 'Elena Rodriguez', role: 'Fundadora y CEO', imageUrl: 'https://placehold.co/200x200.png?text=Elena', dataAiHint: 'woman professional' },
      { name: 'Carlos Vega', role: 'Director de Tecnología', imageUrl: 'https://placehold.co/200x200.png?text=Carlos', dataAiHint: 'man tech' },
      { name: 'Sofía Torres', role: 'Encargada de Comunidad', imageUrl: 'https://placehold.co/200x200.png?text=Sofia', dataAiHint: 'woman community' },
    ],
    whyUsTitle: "¿Por Qué Alicia Libros?",
    benefits: [
      { title: "Amor por los Libros", description: "Compartimos una profunda pasión por la lectura y el valor de las historias.", icon: 'BookHeart' },
      { title: "Apoyo a lo Local", description: "Impulsamos a las librerías independientes, corazón de nuestras comunidades.", icon: 'Users' },
      { title: "Descubrimiento Continuo", description: "Te ayudamos a encontrar joyas literarias y autores que te sorprenderán.", icon: 'Sparkles' },
      { title: "Conexión Cultural", description: "Facilitamos el acceso a la diversidad literaria de Latinoamérica.", icon: 'MapPinned' },
    ]
  };

  useEffect(() => {
    const fetchContent = async () => {
      if (!db) {
        console.error("Firestore DB is not available.");
        setContent(defaultContent);
        setIsLoading(false);
        return;
      }
      try {
        const contentRef = doc(db, "site_content", "about_us_page");
        const docSnap = await getDoc(contentRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const mergedContent: AboutUsContent = {
              ...defaultContent,
              headerTitle: data.headerTitle || defaultContent.headerTitle,
              headerSubtitle: data.headerSubtitle || defaultContent.headerSubtitle,
              headerImageUrl: data.headerImageUrl || defaultContent.headerImageUrl,
              headerDataAiHint: data.headerDataAiHint || defaultContent.headerDataAiHint,
              missionTitle: data.missionTitle || defaultContent.missionTitle,
              missionParagraph1: data.missionParagraph1 || defaultContent.missionParagraph1,
              missionParagraph2: data.missionParagraph2 || defaultContent.missionParagraph2,
              missionImageUrl: data.missionImageUrl || defaultContent.missionImageUrl,
              missionDataAiHint: data.missionDataAiHint || defaultContent.missionDataAiHint,
              featuresTitle: data.featuresTitle || defaultContent.featuresTitle,
              featuresForLibraries: data.featuresForLibraries && data.featuresForLibraries.length > 0 ? data.featuresForLibraries : defaultContent.featuresForLibraries,
              featuresForReaders: data.featuresForReaders && data.featuresForReaders.length > 0 ? data.featuresForReaders : defaultContent.featuresForReaders,
              team: data.team && data.team.length > 0 ? data.team : defaultContent.team,
              whyUsTitle: data.whyUsTitle || defaultContent.whyUsTitle,
              benefits: data.benefits && data.benefits.length > 0 ? data.benefits : defaultContent.benefits,
          };
          setContent(mergedContent);
        } else {
          setContent(defaultContent);
        }
      } catch (error) {
        console.error("Error fetching about page content:", error);
        setContent(defaultContent);
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
            <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">
                {content.featuresTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-3 text-primary">
                            <BookOpen className="h-7 w-7"/> Para Librerías
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {content.featuresForLibraries.map((item, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0"/>
                                <span className="text-foreground/80">{item.feature}</span>
                            </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                 <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-3 text-primary">
                            <Users className="h-7 w-7"/> Para Lectores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {content.featuresForReaders.map((item, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0"/>
                                <span className="text-foreground/80">{item.feature}</span>
                            </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
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
                     <Image src={member.imageUrl || 'https://placehold.co/200x200.png'} alt={member.name} layout="fill" objectFit="cover" data-ai-hint={member.dataAiHint}/>
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
