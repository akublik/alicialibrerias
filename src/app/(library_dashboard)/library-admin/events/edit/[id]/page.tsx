// src/app/(library_dashboard)/library-admin/events/edit/[id]/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save, ImagePlus, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import type { LibraryEvent } from "@/types";
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

export default function EditEventPage() {
  const [event, setEvent] = useState<LibraryEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!eventId || !db) return;

    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        const eventRef = doc(db, "events", eventId);
        const docSnap = await getDoc(eventRef);

        if (docSnap.exists()) {
          const eventData = { id: docSnap.id, ...docSnap.data() } as LibraryEvent;
          // Convert Firestore Timestamp to JS Date
          if (eventData.date && (eventData.date as any).toDate) {
             eventData.date = (eventData.date as any).toDate();
          }
          setEvent(eventData);
          
          form.reset({
            title: eventData.title,
            description: eventData.description,
            date: new Date(eventData.date),
          });
        } else {
          toast({ title: "Error", description: "Evento no encontrado.", variant: "destructive" });
          router.push("/library-admin/events");
        }
      } catch (error: any) {
        toast({ title: "Error al cargar el evento", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, form, router, toast]);

  async function onSubmit(values: EventFormValues) {
    if (!eventId || !event || !db || !storage) return;

    setIsSubmitting(true);
    
    try {
      let imageUrl = event.imageUrl;
      const imageFile = values.eventImage?.[0];

      if (imageFile) {
        const imageRef = ref(storage, `event-images/${event.libraryId}/${uuidv4()}-${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        title: values.title,
        description: values.description,
        date: values.date,
        imageUrl,
      });

      toast({
        title: "Evento Actualizado",
        description: `Los detalles de "${values.title}" se han guardado.`,
      });
      router.push("/library-admin/events");

    } catch (error: any) {
      toast({
        title: "Error al Guardar",
        description: `No se pudo actualizar el evento. Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return <p>Evento no encontrado.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
       <div className="flex items-center mb-6">
        <Link href="/library-admin/events" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver a Eventos">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Editar Evento</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Detalles del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título del Evento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
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
                            className={cn("w-[240px] pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                          >
                            {field.value ? (format(field.value, "PPP", { locale: es })) : (<span>Elige una fecha</span>)}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} rows={6} /></FormControl><FormMessage /></FormItem> )} />
              
               <div className="space-y-2">
                 <Label>Imagen Actual</Label>
                 <div className="relative w-full max-w-sm aspect-video rounded-md overflow-hidden border">
                    <Image src={event.imageUrl} alt={`Imagen actual de ${event.title}`} layout="fill" objectFit="cover" />
                 </div>
               </div>

              <FormField
                control={form.control}
                name="eventImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><ImagePlus className="mr-2 h-4 w-4"/>Subir Nueva Imagen</FormLabel>
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
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
