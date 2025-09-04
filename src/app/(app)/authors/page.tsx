// src/app/(app)/authors/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Bot, Target, Megaphone, UserPlus, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react';
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

  const features = [
    {
      icon: Bot,
      title: "Generación por IA",
      description: "Crea un plan de marketing completo en segundos, analizando los detalles de tu libro para ofrecerte las mejores estrategias."
    },
    {
      icon: Target,
      title: "Análisis de Audiencia",
      description: "Descubre quiénes son tus lectores ideales y cómo llegar a ellos de manera efectiva a través de diferentes canales."
    },
    {
      icon: Megaphone,
      title: "Contenido para Redes",
      description: "Obtén publicaciones listas para usar en tus redes sociales, diseñadas para captar la atención y generar expectación."
    }
  ];

  return (
    <div className="animate-fadeIn">
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 text-primary">
            Centro de Autores
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            Potencia el lanzamiento de tu libro con nuestra herramienta de marketing inteligente. Genera un plan completo, desde eslóganes hasta publicaciones en redes sociales, todo con la ayuda de la IA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated && user?.role === 'author' ? (
               <Link href="/authors/dashboard">
                <Button size="lg" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                  Ir a mi Panel de Autor <LayoutDashboard className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/author-login">
                  <Button size="lg" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                    Crear mi Plan de Marketing <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                 <Link href="/author-register">
                  <Button size="lg" variant="secondary" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                    Regístrate gratis como autor <UserPlus className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

       <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-12 text-foreground">¿Cómo te ayudamos a lanzar tu libro?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center shadow-md hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
