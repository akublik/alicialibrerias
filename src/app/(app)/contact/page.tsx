// src/app/(app)/contact/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
  subject: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres." }),
  message: z.string().min(10, { message: "El mensaje debe tener al menos 10 caracteres." }),
});

export default function ContactPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
    setIsLoading(true);
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "No se pudo enviar el mensaje.");
        }

        toast({
            title: "Mensaje Enviado",
            description: "Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos pronto.",
        });
        
        form.reset();

    } catch (error: any) {
        toast({
            title: "Error al Enviar",
            description: error.message,
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
}

  return (
    <div className="animate-fadeIn">
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <Mail className="mx-auto h-16 w-16 text-primary mb-6" />
          <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 text-primary">
            Contáctanos
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            ¿Tienes preguntas, sugerencias o quieres colaborar? Estamos aquí para escucharte.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-headline text-3xl font-semibold text-foreground mb-6">Envíanos un Mensaje</h2>
              <Card className="shadow-lg">
                <CardContent className="p-6 md:p-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Tu nombre" {...field} className="text-base md:text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="tu@email.com" {...field} className="text-base md:text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asunto</FormLabel>
                            <FormControl>
                              <Input placeholder="Asunto de tu mensaje" {...field} className="text-base md:text-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensaje</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Escribe tu mensaje aquí..." rows={5} {...field} className="text-base md:text-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" size="lg" className="w-full font-body text-base" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                        Enviar Mensaje
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h2 className="font-headline text-3xl font-semibold text-foreground mb-6">Información de Contacto</h2>
              <div className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                    <Phone className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="font-headline text-xl">Llámanos</CardTitle>
                      <CardDescription>Atención de Lunes a Viernes</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <a href="tel:+5930992650852" className="text-primary hover:underline text-lg block">+593 0992650852</a>
                    <p className="text-sm text-muted-foreground">9:00 AM - 5:00 PM (GMT-5)</p>
                  </CardContent>
                </Card>
                 <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                    <Mail className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="font-headline text-xl">Escríbenos</CardTitle>
                      <CardDescription>Para consultas generales</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <a href="mailto:info@alicialibros.com" className="text-primary hover:underline text-lg block">info@alicialibros.com</a>
                     <p className="text-sm text-muted-foreground">Respondemos en 24-48 horas hábiles.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
