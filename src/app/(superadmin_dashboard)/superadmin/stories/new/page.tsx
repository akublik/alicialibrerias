// src/app/(superadmin_dashboard)/superadmin/stories/new/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

const storyFormSchema = z.object({
  title: z.string().min(2, "El título es requerido."),
  author: z.string().min(2, "El autor es requerido."),
  category: z.string().optional(),
  country: z.string().optional(),
  years: z.string().optional(),
  content: z.string().min(50, "El contenido debe tener al menos 50 caracteres."),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

export default function NewStoryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      title: "",
      author: "",
      category: "",
      country: "",
      years: "",
      content: "",
    },
  });

  async function onSubmit(values: StoryFormValues) {
    if (!db) {
      toast({ title: "Error de conexión", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "stories"), {
        ...values,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Cuento Creado", description: `El cuento "${values.title}" ha sido añadido.` });
      router.push("/superadmin/stories");
    } catch (error: any) {
      toast({ title: "Error al crear el cuento", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/superadmin/stories" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Añadir Nuevo Cuento</h1>
      </div>

      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Información del Cuento</CardTitle>
          <CardDescription>Rellena la información para crear un nuevo cuento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Categoría</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="country" render={({ field }) => ( <FormItem><FormLabel>País</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="years" render={({ field }) => ( <FormItem><FormLabel>Años</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField control={form.control} name="content" render={({ field }) => ( <FormItem><FormLabel>Contenido del Cuento</FormLabel><FormControl><Textarea rows={15} {...field} /></FormControl><FormMessage /></FormItem> )} />

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Crear Cuento
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
