// src/app/(superadmin_dashboard)/superadmin/digital-library/new/page.tsx
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
  path: ["epubUrl"], // Show the error under one of the fields
});

type DigitalBookFormValues = z.infer<typeof digitalBookFormSchema>;

export default function NewDigitalBookPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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

  async function onSubmit(values: DigitalBookFormValues) {
    setIsSubmitting(true);
    if (!db) {
      toast({ title: "Error de base de datos", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    try {
      await addDoc(collection(db, "digital_books"), {
        ...values,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Libro digital añadido", description: `"${values.title}" ahora está en la biblioteca.` });
      router.push("/superadmin/digital-library");
    } catch (error: any) {
      toast({ title: "Error al añadir el libro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/superadmin/digital-library" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Añadir Nuevo Libro Digital</h1>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Detalles del Libro Digital</CardTitle>
          <CardDescription>Rellena la información del nuevo libro para la biblioteca digital.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="El Aleph" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor</FormLabel><FormControl><Input placeholder="Jorge Luis Borges" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Breve sinopsis del libro..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
              
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

              <FormField control={form.control} name="coverImageUrl" render={({ field }) => ( <FormItem><FormLabel>URL de la Portada</FormLabel><FormControl><Input type="url" placeholder="https://ejemplo.com/portada.jpg" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
              
              <FormField control={form.control} name="epubUrl" render={({ field }) => ( <FormItem><FormLabel>URL del Archivo EPUB (Opcional)</FormLabel><FormControl><Input type="url" placeholder="https://ejemplo.com/libro.epub" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="pdfUrl" render={({ field }) => ( <FormItem><FormLabel>URL del Archivo PDF (Opcional)</FormLabel><FormControl><Input type="url" placeholder="https://ejemplo.com/libro.pdf" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Añadir a la Biblioteca
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
