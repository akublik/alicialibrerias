
// src/app/(library_dashboard)/library-admin/books/edit/[id]/page.tsx
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
import { Loader2, ArrowLeft, Save, ImagePlus, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { Book } from "@/types";
import { MultiSelect } from "@/components/ui/multi-select";
import { bookCategories, bookTags } from "@/lib/options";
import { Switch } from "@/components/ui/switch";
import { generateAutomaticTags } from "@/ai/flows/generate-automatic-tags";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const bookFormSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }),
  authors: z.string().min(3, { message: "Debe haber al menos un autor." }),
  isbn: z.string().optional(),
  price: z.coerce.number().positive({ message: "El precio debe ser un número positivo." }),
  stock: z.coerce.number().int().min(0, { message: "El stock no puede ser negativo." }),
  description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  pageCount: z.union([z.coerce.number().int().positive({ message: "Debe ser un número positivo." }), z.literal('')]).optional(),
  coverType: z.string().optional(),
  publisher: z.string().optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export default function EditBookPage() {
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      authors: "",
      isbn: "",
      price: 0,
      stock: 0,
      description: "",
      categories: [],
      tags: [],
      imageUrl: "",
      isFeatured: false,
      pageCount: '',
      coverType: '',
      publisher: '',
    },
  });

  useEffect(() => {
    if (!bookId || !db) return;

    const fetchBook = async () => {
      setIsLoading(true);
      try {
        const bookRef = doc(db, "books", bookId);
        const docSnap = await getDoc(bookRef);

        if (docSnap.exists()) {
          const bookData = { id: docSnap.id, ...docSnap.data() } as Book;
          setBook(bookData);
          
          const formValues = {
            title: bookData.title,
            authors: bookData.authors.join(', '),
            isbn: bookData.isbn || '',
            price: bookData.price,
            stock: bookData.stock,
            description: bookData.description || '',
            categories: bookData.categories || [],
            tags: bookData.tags || [],
            imageUrl: bookData.imageUrl || '',
            isFeatured: bookData.isFeatured || false,
            pageCount: bookData.pageCount || '',
            coverType: bookData.coverType || '',
            publisher: bookData.publisher || '',
          };
          form.reset(formValues);

        } else {
          toast({ title: "Error", description: "Libro no encontrado.", variant: "destructive" });
          router.push("/library-admin/books");
        }
      } catch (error: any) {
        toast({ title: "Error al cargar el libro", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId, form, router, toast]);

  const handleGenerateTags = async () => {
    const description = form.getValues("description");
    if (!description || description.trim().length < 20) {
        toast({
            title: "Descripción muy corta",
            description: "Por favor, escribe una descripción de al menos 20 caracteres para generar etiquetas.",
            variant: "destructive",
        });
        return;
    }

    setIsGeneratingTags(true);
    try {
        const result = await generateAutomaticTags({ description });
        const currentTags = form.getValues("tags") || [];
        const newTags = new Set([...currentTags, ...result.tags]);
        form.setValue("tags", Array.from(newTags), { shouldValidate: true });
        toast({
            title: "Etiquetas Sugeridas",
            description: "Se han añadido nuevas etiquetas basadas en la descripción.",
        });
    } catch (error: any) {
        console.error("Error generating tags:", error);
        let toastDescription = "No se pudieron generar las etiquetas. Inténtalo de nuevo.";
        if (error instanceof Error && (error.message.includes('API key') || error.message.includes('GOOGLE_API_KEY'))) {
          console.error("DEVELOPER HINT: The AI feature failed because the GOOGLE_API_KEY is not set in your environment variables.");
          toastDescription = "La función de sugerencia por IA no está disponible en este momento. Disculpa las molestias."
        }
        toast({
            title: "Error de IA",
            description: toastDescription,
            variant: "destructive",
        });
    } finally {
        setIsGeneratingTags(false);
    }
  };


  async function onSubmit(values: BookFormValues) {
    if (!bookId || !book || !db) return;

    setIsSubmitting(true);
    
    try {
      const bookRef = doc(db, "books", bookId);
      const updatedData = {
          title: values.title,
          authors: values.authors.split(',').map(a => a.trim()),
          isbn: values.isbn || '',
          price: values.price,
          stock: values.stock,
          description: values.description || '',
          categories: values.categories || [],
          tags: values.tags || [],
          imageUrl: values.imageUrl || book.imageUrl,
          isFeatured: values.isFeatured,
          pageCount: values.pageCount ? Number(values.pageCount) : null,
          coverType: values.coverType || null,
          publisher: values.publisher || null,
      };

      await updateDoc(bookRef, updatedData);

      toast({
          title: "Libro Actualizado",
          description: `Los detalles de "${values.title}" se han guardado.`,
      });
      router.push("/library-admin/books");

    } catch (error: any) {
      console.error("Error al actualizar el libro:", error);
      toast({
          title: "Error al Guardar",
          description: `No se pudo actualizar el libro. Error: ${error.message}`,
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

  if (!book) {
    return <p>Libro no encontrado.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/library-admin/books" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver a Mis Libros">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
           <h1 className="font-headline text-3xl font-bold text-primary">Editar Libro</h1>
           <p className="text-muted-foreground">{book.title}</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle>Detalles del Libro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Cien Años de Soledad" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="authors" render={({ field }) => ( <FormItem><FormLabel>Autor(es) (separados por coma)</FormLabel><FormControl><Input placeholder="Gabriel García Márquez" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>

               <div className="grid sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="isbn" render={({ field }) => ( <FormItem><FormLabel>ISBN</FormLabel><FormControl><Input placeholder="978-3-16-148410-0" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Precio</FormLabel><FormControl><Input type="number" step="0.01" placeholder="15.99" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="stock" render={({ field }) => ( <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
               </div>
              
              <h4 className="font-headline text-lg text-foreground border-b pb-2 pt-4">Ficha Técnica (Opcional)</h4>
              <div className="grid sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="pageCount" render={({ field }) => ( <FormItem><FormLabel>Nº de Páginas</FormLabel><FormControl><Input type="number" placeholder="320" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField
                      control={form.control}
                      name="coverType"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Tipo de Tapa</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Selecciona un tipo" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      <SelectItem value="Tapa Blanda">Tapa Blanda</SelectItem>
                                      <SelectItem value="Tapa Dura">Tapa Dura</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField control={form.control} name="publisher" render={({ field }) => ( <FormItem><FormLabel>Editorial</FormLabel><FormControl><Input placeholder="Ej: Planeta" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Una breve sinopsis del libro..." {...field} rows={6} /></FormControl><FormMessage /></FormItem> )} />

              <div className="grid sm:grid-cols-2 gap-4">
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
                          <div className="flex items-center justify-between mb-1">
                            <FormLabel>Etiquetas</FormLabel>
                            <Button type="button" variant="outline" size="sm" onClick={handleGenerateTags} disabled={isGeneratingTags}>
                                {isGeneratingTags ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                Sugerir con IA
                            </Button>
                          </div>
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
              </div>
               <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Destacar Libro</FormLabel>
                        <FormDescription>
                          Si se activa, este libro aparecerá en un lugar destacado en la página de tu librería.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ImagePlus/>Imagen de Portada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden border">
                        <Image
                            src={form.watch('imageUrl') || book.imageUrl}
                            alt={`Portada actual de ${book.title}`}
                            layout="fill"
                            objectFit="cover"
                            key={form.watch('imageUrl') || book.imageUrl}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL de la nueva imagen</FormLabel>
                                <FormControl>
                                    <Input
                                        type="url"
                                        placeholder="https://ejemplo.com/portada.jpg"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
            </Card>

            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
