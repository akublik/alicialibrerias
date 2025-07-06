// src/app/(app)/loyalty/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, ShoppingBag, Coins, ArrowRight, Loader2, Star } from 'lucide-react';
import type { Promotion } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
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

        const now = new Date();
        const promotionsRef = collection(db, "promotions");
        const q = query(
            promotionsRef, 
            where("isActive", "==", true),
            where("endDate", ">=", now),
            orderBy("endDate", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activePromotions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    startDate: data.startDate?.toDate(),
                    endDate: data.endDate?.toDate(),
                } as Promotion;
            }).filter(promo => new Date(promo.startDate) <= now); // Final client-side check for start date
            
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
            <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
                <div className="container mx-auto px-4 text-center">
                    <Star className="mx-auto h-16 w-16 text-primary mb-6" />
                    <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 text-primary">
                        Programa de Puntos Alicia Libros
                    </h1>
                    <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
                        Es el programa que recompensa tu fidelidad regalándote puntos por cada dólar de compras que realices, que luego puedes canjear por increíbles premios y descuentos.
                    </p>
                    <Link href="/register">
                        <Button size="lg" className="font-body text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                            Únete Ahora y Empieza a Ganar
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            <section className="py-16 bg-background">
                <div className="container mx-auto px-4">
                    <h2 className="font-headline text-3xl font-semibold text-center mb-12 text-foreground">¿Cómo Funciona?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <h2 className="font-headline text-3xl font-semibold text-center mb-12 text-foreground">Promociones Activas</h2>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : promotions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {promotions.map((promo) => (
                                <Card key={promo.id} className="overflow-hidden flex flex-col group">
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
                                             <div className="absolute inset-0 bg-black/40"></div>
                                        </div>
                                         <div className="absolute bottom-0 left-0 p-4">
                                            <CardTitle className="font-headline text-2xl text-white shadow-lg">{promo.name}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 flex-grow">
                                        <p className="text-sm text-foreground/80">{promo.description}</p>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 text-xs text-muted-foreground font-medium">
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
