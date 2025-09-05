
// src/app/(app)/authors/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookCopy, Rocket, Wand2, BarChart2, LayoutDashboard, FileSignature, DollarSign, Printer, Globe } from "lucide-react";
import type { User } from '@/types';

export default function AuthorsHomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);
    if (authStatus) {
      const userDataString = localStorage.getItem("aliciaLibros_user");
      if (userDataString) {
        setUser(JSON.parse(userDataString));
      }
    }
  }, []);

  const benefits = [
    {
      icon: BookCopy,
      title: "Publicación Profesional",
      items: ["Digital + Impresión bajo demanda", "Control total sobre tu libro y ventas"]
    },
    {
      icon: Rocket,
      title: "Experiencia de Lanzamiento Real",
      items: ["Eventos con librerías asociadas", "Streaming y firma de libros", "Actividades con lectores"]
    },
    {
      icon: Wand2,
      title: "Marketing y Comunidad",
      items: ["Asistente IA de lanzamiento", "Generador de booktrailers y piezas gráficas", "Conexión directa con tu público"]
    },
    {
      icon: BarChart2,
      title: "Métricas y Seguimiento",
      items: ["Panel en tiempo real con ventas y visitas", "Sugerencias de IA para mejorar tu estrategia"]
    }
  ];
  
  const timelineSteps = [
    { number: "01", title: "Sube tu Manuscrito", description: "Prepara tu obra para publicación digital e impresión bajo demanda." },
    { number: "02", title: "Plan de Lanzamiento con IA", description: "Obtén un checklist y un plan de marketing personalizado para tu libro." },
    { number: "03", title: "Publicación", description: "Tu libro disponible en alicialibros.com y en nuestra red de librerías asociadas." },
    { number: "04", title: "Evento de Lanzamiento", description: "Organiza firmas de libros, presentaciones y eventos en streaming." },
    { number: "05", title: "Post-Lanzamiento", description: "Interactúa con tu comunidad, gestiona reseñas y analiza tus métricas de venta." },
  ];
  
  const commercialConditions = [
      {
          icon: FileSignature,
          title: "Editorial y Derechos",
          points: [
              "Alicialibros.com actuará como editor de la obra.",
              "Los derechos de explotación comercial pertenecerán a Alicialibros.com, garantizando la distribución y venta en todos los canales disponibles.",
              "El autor conserva la propiedad intelectual y moral de su obra."
          ]
      },
      {
          icon: DollarSign,
          title: "Reparto de Ganancias",
          points: [
              "El autor recibirá el 75% de las ganancias netas por cada libro vendido."
          ]
      },
      {
          icon: Printer,
          title: "Costos de Impresión",
          points: [
              "El sistema funciona con impresión bajo demanda (POD).",
              "El costo de impresión único para el autor será de $50.",
              "Sin tirajes mínimos ni inversión inicial."
          ]
      },
      {
          icon: Globe,
          title: "Canales de Distribución",
          points: [
              "La obra será ofrecida en Alicialibros.com.",
              "Distribución extendida a librerías asociadas en Latinoamérica y España.",
              "Disponibilidad en formato digital e impreso."
          ]
      }
  ]

  const renderAuthButtons = () => {
    if (isAuthenticated && user?.role === 'author') {
      return (
        <Link href="/authors/dashboard">
          <Button size="lg" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
            Ir a mi Panel de Autor <LayoutDashboard className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      );
    }
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/author-register">
          <Button size="lg" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
            Publica tu libro hoy <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <Link href="/author-login">
          <Button size="lg" variant="outline" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
            Ya soy autor, ingresar
          </Button>
        </Link>
      </div>
    );
  };
  
  return (
    <div className="animate-fadeIn">
      <section className="relative py-16 md:py-20 overflow-hidden bg-background">
         <div className="absolute inset-0 z-0 opacity-50">
            <video
              src="/videos/authors-background.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent z-10"></div>
        <div className="container mx-auto px-4 text-center relative z-20">
          <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 text-primary drop-shadow-lg">
            no solo publica tu libro...lánzalo y conecta con tu audiencia!
          </h1>
          <p className="text-lg md:text-xl text-foreground/90 mb-8 max-w-3xl mx-auto drop-shadow-lg">
            Alicialibros.com te permite publicar digital y físico, organizar eventos de lanzamiento y vivir la experiencia completa de tu libro.
          </p>
          {renderAuthButtons()}
        </div>
      </section>

       <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center shadow-md hover:shadow-xl transition-shadow bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                    <benefit.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-headline text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {benefit.items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
            <h2 className="font-headline text-3xl font-semibold text-center mb-12 text-foreground">Cómo Funciona</h2>
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-1/2 top-4 hidden h-[calc(100%-2rem)] w-0.5 bg-primary/20 md:block" aria-hidden="true"></div>
                <div className="space-y-12">
                    {timelineSteps.map((step, index) => (
                        <div key={index} className="relative">
                            <div className="flex flex-col md:flex-row items-center justify-center">
                                <div className={`flex w-full md:w-1/2 ${index % 2 === 0 ? 'justify-center md:justify-end md:pr-8' : 'justify-center md:justify-start md:pl-8 md:order-2'}`}>
                                    <div className="w-full max-w-sm">
                                        <Card className="shadow-lg">
                                            <CardContent className="p-6">
                                                <h3 className="font-headline text-xl font-semibold text-primary mb-2">{step.number}. {step.title}</h3>
                                                <p className="text-muted-foreground">{step.description}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                                <div className={`flex-shrink-0 my-4 md:my-0 md:order-1 ${index % 2 === 0 ? '' : 'md:order-first'}`}>
                                    <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md z-10 relative">
                                        {step.number}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg p-6 md:p-8 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="font-headline text-3xl text-center text-primary">Condiciones Comerciales de Publicación con Alicia</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {commercialConditions.map((condition) => (
                        <div key={condition.title}>
                            <h3 className="font-headline text-xl font-semibold text-foreground flex items-center gap-2 mb-3">
                               <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full"><condition.icon className="h-5 w-5 text-primary"/></div>
                                {condition.title}
                            </h3>
                            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                                {condition.points.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
