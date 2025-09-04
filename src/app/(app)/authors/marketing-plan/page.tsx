// src/app/(app)/authors/marketing-plan/page.tsx
"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateMarketingPlan, type GenerateMarketingPlanOutput } from '@/ai/flows/generate-marketing-plan';
import { Separator } from '@/components/ui/separator';

const marketingPlanFormSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  author: z.string().min(2, "El autor es requerido."),
  synopsis: z.string().min(20, "La sinopsis debe tener al menos 20 caracteres."),
  targetAudience: z.string().min(10, "Describe tu público objetivo."),
});

type MarketingPlanFormValues = z.infer<typeof marketingPlanFormSchema>;

export default function MarketingPlanPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [marketingPlan, setMarketingPlan] = useState<GenerateMarketingPlanOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<MarketingPlanFormValues>({
    resolver: zodResolver(marketingPlanFormSchema),
    defaultValues: { title: "", author: "", synopsis: "", targetAudience: "" },
  });

  const onSubmit = async (values: MarketingPlanFormValues) => {
    setIsLoading(true);
    setMarketingPlan(null);
    try {
      const result = await generateMarketingPlan(values);
      setMarketingPlan(result);
      toast({ title: "¡Plan de Marketing Generado!", description: "Tu plan personalizado está listo." });
    } catch (error: any) {
      toast({ title: "Error al generar el plan", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
           <Card className="sticky top-24 shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <Wand2 className="mr-2 h-6 w-6 text-primary" />
                Crea tu Plan de Marketing
              </CardTitle>
              <CardDescription>
                Ingresa los detalles de tu libro y la IA creará un plan de lanzamiento a tu medida.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título del Libro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor del Libro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="synopsis" render={({ field }) => ( <FormItem><FormLabel>Sinopsis</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="targetAudience" render={({ field }) => ( <FormItem><FormLabel>Público Objetivo</FormLabel><FormControl><Textarea {...field} placeholder="Ej: Jóvenes adultos, amantes de la fantasía, lectores de romance histórico..." rows={3} /></FormControl><FormMessage /></FormItem> )} />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Generando...' : 'Generar Plan'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
            {isLoading && (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md min-h-[50vh]">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="font-headline text-xl text-foreground">Creando tu plan...</p>
                    <p className="text-muted-foreground">La IA está analizando tu libro.</p>
                </div>
            )}

            {!isLoading && !marketingPlan && (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg shadow-md min-h-[50vh]">
                    <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="font-headline text-xl text-foreground">Tu plan de marketing aparecerá aquí</p>
                    <p className="text-muted-foreground">Completa el formulario para empezar.</p>
                </div>
            )}
            
            {marketingPlan && (
                <div className="space-y-6">
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">Slogan Sugerido</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <blockquote className="border-l-4 border-primary pl-4 text-lg italic text-foreground">
                                {marketingPlan.slogan}
                            </blockquote>
                        </CardContent>
                    </Card>
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">Análisis de Público Objetivo</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground whitespace-pre-line">
                           {marketingPlan.targetAudienceAnalysis}
                        </CardContent>
                    </Card>
                     <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">Estrategias de Lanzamiento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           {marketingPlan.launchStrategies.map((strategy, index) => (
                               <p key={index} className="text-muted-foreground">{index + 1}. {strategy}</p>
                           ))}
                        </CardContent>
                    </Card>
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">Ejemplos de Publicaciones para Redes Sociales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           {marketingPlan.socialMediaPosts.map((post, index) => (
                               <div key={index}>
                                   <p className="text-foreground bg-muted p-4 rounded-md whitespace-pre-line">{post}</p>
                                   {index < marketingPlan.socialMediaPosts.length - 1 && <Separator className="mt-6" />}
                               </div>
                           ))}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
