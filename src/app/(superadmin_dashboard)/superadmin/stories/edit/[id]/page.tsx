// src/app/(superadmin_dashboard)/superadmin/stories/edit/[id]/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { Story } from "@/types";

const storyFormSchema = z.object({
  title: z.string().min(2, "El título es requerido."),
  author: z.string().min(2, "El autor es requerido."),
  category: z.string().optional(),
  country: z.string().optional(),
  years: z.string().optional(),
  content: z.string().min(50, "El contenido debe tener al menos 50 caracteres."),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

export default function EditStoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: { title: "", author: "", category: "", country: "", years: "", content: "" },
  });

  useEffect(() => {
    if (!storyId || !db) return;

    const fetchStory = async () => {
      setIsLoading(true);
      try {
        const storyRef = doc(db, "stories", storyId);
        const docSnap = await getDoc(storyRef);
        if (docSnap.exists()) {
          const storyData = docSnap.data() as Story;
          form.reset({
            title: storyData.title,
            author: storyData.author,
            category: storyData.category,
            country: storyData.country,
            years: storyData.years,
            content: storyData.content,
          });
        } else {
          toast({ title: "Error", description: "Cuento no encontrado.", variant: "destructive" });
          router.push("/superadmin/stories");
        }
      } catch (error: any) {
        toast({ title: "Error al cargar el cuento", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStory();
  }, [storyId, form, router, toast]);

  async function onSubmit(values: StoryFormValues) {
    if (!db) return;
    setIsSubmitting(true);
    try {
      const storyRef = doc(db, "stories", storyId);
      await updateDoc(storyRef, values);
      toast({ title: "Cuento Actualizado", description: `El cuento "${values.title}" ha sido actualizado.` });
      router.push("/superadmin/stories");
    } catch (error: any) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/superadmin/stories" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Editar Cuento</h1>
      </div>

      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Información del Cuento</CardTitle>
          <CardDescription>Actualiza la información del cuento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <div className="grid sm:grid-cols-2 gap-6">
                <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Categoría</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="country" render={({ field }) => ( <FormItem><FormLabel>País</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="years" render={({ field }) => ( <FormItem><FormLabel>Años</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField control={form.control} name="content" render={({ field }) => ( <FormItem><FormLabel>Contenido del Cuento</FormLabel><FormControl><Textarea rows={15} {...field} /></FormControl><FormMessage /></FormItem> )} />
              
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
