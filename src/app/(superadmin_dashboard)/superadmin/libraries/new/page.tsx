// src/app/(superadmin_dashboard)/superadmin/libraries/new/page.tsx
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
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const libraryFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre de la librería es requerido." }),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  location: z.string().min(3, { message: "La ubicación (ciudad, provincia) es requerida." }),
  email: z.string().email("Debe ser un email válido."),
});

type LibraryFormValues = z.infer<typeof libraryFormSchema>;

export default function NewLibraryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LibraryFormValues>({
    resolver: zodResolver(libraryFormSchema),
    defaultValues: { name: "", address: "", location: "", email: "" },
  });

  async function onSubmit(values: LibraryFormValues) {
    if (!db) return;
    setIsSubmitting(true);
    try {
      const newLibraryData = {
        ...values,
        apiKey: uuidv4(), // Generate a unique API key on creation
        isActive: true, // New libraries are active by default
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "libraries"), newLibraryData);
      toast({ title: "Librería Creada", description: `La librería ${values.name} ha sido añadida.` });
      router.push("/superadmin/libraries");
    } catch (error: any) {
      toast({ title: "Error al crear", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
       <div className="flex items-center mb-6">
        <Link href="/superadmin/libraries" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Añadir Nueva Librería</h1>
      </div>
      
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Detalles de la Librería</CardTitle>
          <CardDescription>Rellena la información para registrar una nueva librería en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Ubicación (Ej: Quito, Pichincha)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email de Contacto</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
              
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Añadir Librería
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
