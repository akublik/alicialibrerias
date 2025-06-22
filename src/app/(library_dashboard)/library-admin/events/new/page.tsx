// src/app/(library_dashboard)/library-admin/events/new/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, PlusCircle, ImagePlus, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const eventFormSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  date: z.date({
    required_error: "La fecha del evento es requerida.",
  }),
  eventImage: z.any().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function NewEventPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
  });

  async function onSubmit(values: EventFormValues) {
    setIsSubmitting(true);
    
    if (!db || !storage) {
      toast({ title: "Error de configuración", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      const userDataString = localStorage.getItem("aliciaLibros_user");
      if (!userDataString) {
        toast({ title: "Error de autenticación", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const userData = JSON.parse(userDataString);
      const libraryId = userData.libraryId;

      let imageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(values.title)}`;
      let dataAiHint = "event placeholder";

      const imageFile = values.eventImage?.[0];
      if (imageFile) {
        const imageRef = ref(storage, `event-images/${libraryId}/${uuidv4()}-${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
        dataAiHint = "custom event image";
      }

      const newEventData = {
        libraryId,
        title: values.title,
        description: values.description,
        date: values.date, // Firestore will convert JS Date to Timestamp
        imageUrl,
        dataAiHint,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "events"), newEventData);

      toast({
        title: "Evento Creado",
        description: `El evento "${values.title}" ha sido creado.`,
      });
      router.push("/library-admin/events");

    } catch (error: any) {
      toast({
        title: "Error al crear el evento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/library-admin/events" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver a Eventos">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Crear Nuevo Evento</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Detalles del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título del Evento</FormLabel><FormControl><Input placeholder="Taller de escritura creativa" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha y Hora del Evento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Elige una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Describe de qué tratará el evento, quiénes son los ponentes, etc." {...field} rows={6} /></FormControl><FormMessage /></FormItem> )} />
              <FormField
                control={form.control}
                name="eventImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><ImagePlus className="mr-2 h-4 w-4"/>Imagen del Evento (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Creando Evento...' : 'Crear Evento'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
