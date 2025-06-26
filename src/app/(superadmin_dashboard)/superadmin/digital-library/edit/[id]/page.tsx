// src/app/(superadmin_dashboard)/superadmin/digital-library/edit/[id]/page.tsx
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
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { DigitalBook } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { bookCategories, bookTags } from "@/lib/options";

const digitalBookFormSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  author: z.string().min(3, "El autor es requerido."),
  description: z.string().optional(),
  coverImageUrl: z.string().url("La URL de la portada es requerida y debe ser válida."),
  epubUrl: z.string().url("La URL del EPUB no es válida.").optional().or(z.literal('')),
  pdfUrl: z.string().url("La URL del PDF no es válida.").optional().or(z.literal('')),
  format: z.enum(['EPUB', 'PDF', 'EPUB & PDF'], { required_error: "Debes seleccionar un formato." }),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => data.epubUrl || data.pdfUrl, {
  message: "Debes proporcionar al menos una URL (EPUB o PDF).",
  path: ["epubUrl"],
});

type DigitalBookFormValues = z.infer<typeof digitalBookFormSchema>;

export default function EditDigitalBookPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const form = useForm<DigitalBookFormValues>({
    resolver: zodResolver(digitalBookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      description: "",
      coverImageUrl: "",
      epubUrl: "",
      pdfUrl: "",
      categories: [],
      tags: [],
    },
  });
  
  useEffect(() => {
      if (!bookId || !db) return;
      
      const fetchBook = async () => {
          setIsLoading(true);
          try {
              const bookRef = doc(db, "digital_books", bookId);
              const docSnap = await getDoc(bookRef);

              if (docSnap.exists()) {
                  const bookData = docSnap.data() as DigitalBook;
                  form.reset({
                      title: bookData.title,
                      author: bookData.author,
                      description: bookData.description || "",
                      coverImageUrl: bookData.coverImageUrl,
                      epubUrl: bookData.epubUrl || "",
                      pdfUrl: bookData.pdfUrl || "",
                      format: bookData.format,
                      categories: bookData.categories || [],
                      tags: bookData.tags || [],
                  });
              } else {
                  toast({ title: "Error", description: "Libro digital no encontrado.", variant: "destructive" });
                  router.push("/superadmin/digital-library");
              }
          } catch (error: any) {
              toast({ title: "Error al cargar el libro", description: error.message, variant: "destructive" });
          } finally {
              setIsLoading(false);
          }
      };

      fetchBook();
  }, [bookId, form, router, toast]);

  async function onSubmit(values: DigitalBookFormValues) {
    setIsSubmitting(true);
    if (!db || !bookId) {
      toast({ title: "Error de configuración", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    try {
      const bookRef = doc(db, "digital_books", bookId);
      await updateDoc(bookRef, values);
      toast({ title: "Libro digital actualizado", description: `"${values.title}" se ha guardado.` });
      router.push("/superadmin/digital-library");
    } catch (error: any) {
      toast({ title: "Error al actualizar el libro", description: error.message, variant: "destructive" });
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

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/superadmin/digital-library" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Editar Libro Digital</h1>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Detalles del Libro Digital</CardTitle>
          <CardDescription>Modifica la información del libro.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un formato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EPUB">EPUB</SelectItem>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="EPUB & PDF">EPUB & PDF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
              
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorías</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder="Selecciona categorías..."
                        options={bookCategories}
                        value={field.value || []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiquetas</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder="Selecciona etiquetas..."
                        options={bookTags}
                        value={field.value || []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="coverImageUrl" render={({ field }) => ( <FormItem><FormLabel>URL de la Portada</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />
              
              <FormField control={form.control} name="epubUrl" render={({ field }) => ( <FormItem><FormLabel>URL del Archivo EPUB (Opcional)</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="pdfUrl" render={({ field }) => ( <FormItem><FormLabel>URL del Archivo PDF (Opcional)</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
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
