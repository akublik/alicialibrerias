// src/app/(app)/loyalty/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, ShoppingBag, Coins, ArrowRight, Loader2, Star, ArrowDown } from 'lucide-react';
import type { Promotion } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LoyaltyProgramPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setIsLoading(false);
            return;
        }

        const promotionsRef = collection(db, "promotions");
        const q = query(promotionsRef, where("isActive", "==", true));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = new Date();
            const activePromotions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    startDate: data.startDate?.toDate(),
                    endDate: data.endDate?.toDate(),
                } as Promotion;
            }).filter(promo => {
                if (!promo.startDate || !promo.endDate) return false;
                return promo.startDate <= now && promo.endDate >= now;
            });
            
            activePromotions.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            
            setPromotions(activePromotions);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching promotions:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const steps = [
        {
            icon: ShoppingBag,
            title: "1. Compra",
            description: "Explora nuestro catálogo y realiza tus compras como siempre. Cada dólar que gastas se convierte en puntos.",
        },
        {
            icon: Coins,
            title: "2. Acumula",
            description: "Ganas 1 punto por cada dólar gastado. ¡Además, aprovecha nuestras promociones especiales para ganar puntos extra!",
        },
        {
            icon: Gift,
            title: "3. Canjea",
            description: "Usa tus puntos para obtener descuentos directos en tus próximas compras o canjéalos por premios exclusivos en nuestra tienda de canje.",
        }
    ];

    return (
        <div className="animate-fadeIn">
            <section className="relative py-16 md:py-28 text-white">
                 <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: "url('/images/loyalty-banner.jpg')" }}
                    data-ai-hint="people bookstore"
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <Star className="mx-auto h-12 w-12 text-amber-300 mb-4" />
                    <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">
                        Programa de Puntos Alicia Libros
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 mb-6 max-w-3xl mx-auto">
                        Es el programa que recompensa tu fidelidad regalándote puntos por cada dólar de compras que realices en nuestros establecimientos afiliados, que luego puedes canjear por increíbles premios.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                         <a href="#promotions">
                            <Button size="lg" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                                Ver Promociones Activas
                                <ArrowDown className="ml-2 h-5 w-5" />
                            </Button>
                        </a>
                        <Link href="/redemption-store">
                            <Button size="lg" variant="secondary" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                                Ir a la Tienda de Canje
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-12 bg-background">
                <div className="container mx-auto px-4">
                    <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">¿Cómo Funciona?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {steps.map((step, index) => (
                            <Card key={index} className="text-center shadow-md hover:shadow-xl transition-shadow">
                                <CardHeader>
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                                        <step.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="font-headline text-2xl">{step.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{step.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section id="promotions" className="py-12 bg-muted/30 scroll-mt-20">
                <div className="container mx-auto px-4">
                    <h2 className="font-headline text-3xl font-semibold text-center mb-10 text-foreground">Promociones Activas</h2>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : promotions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {promotions.map((promo) => (
                                <Card key={promo.id} className="overflow-hidden flex flex-col group shadow-md hover:shadow-xl transition-shadow">
                                    <CardHeader className="p-0 relative">
                                        <div className="relative w-full aspect-video">
                                            <Image 
                                                src={promo.imageUrl || 'https://placehold.co/600x400.png'} 
                                                alt={promo.name} 
                                                layout="fill" 
                                                objectFit="cover"
                                                className="transition-transform duration-300 group-hover:scale-105"
                                                data-ai-hint={promo.dataAiHint || 'promotion marketing'}
                                            />
                                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        </div>
                                         <div className="absolute bottom-0 left-0 p-4">
                                            <CardTitle className="font-headline text-2xl text-white shadow-lg">{promo.name}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow">
                                        <p className="text-sm text-foreground/80">{promo.description}</p>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 text-xs text-muted-foreground font-medium bg-muted/50">
                                        Válido desde {format(new Date(promo.startDate), 'dd MMM', { locale: es })} hasta {format(new Date(promo.endDate), 'dd MMM, yyyy', { locale: es })}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="text-center py-16">
                            <CardContent className="flex flex-col items-center">
                                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="font-semibold text-foreground">No hay promociones especiales activas en este momento.</p>
                                <p className="text-muted-foreground">¡Pero no te preocupes, siempre ganas puntos con tus compras!</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    );
}
