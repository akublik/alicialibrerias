
// src/app/(library_dashboard)/library-admin/books/new/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, BookPlus, FileUp, ImagePlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { MultiSelect } from "@/components/ui/multi-select";
import { bookCategories, bookTags } from "@/lib/options";
import { Switch } from "@/components/ui/switch";
import { generateAutomaticTags } from '@/ai/flows/generate-automatic-tags';
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

export default function NewBookPage() {
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      authors: "",
      isbn: "",
      price: undefined,
      stock: undefined,
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


  async function onManualSubmit(values: BookFormValues) {
    setIsSubmittingManual(true);
    
    if (!db) {
        toast({ title: "Error de configuración", description: "La base de datos no está disponible.", variant: "destructive" });
        setIsSubmittingManual(false);
        return;
    }

    try {
        const userDataString = localStorage.getItem("aliciaLibros_user");
        if (!userDataString) {
            toast({ title: "Error de autenticación", description: "No se pudo encontrar la información del usuario.", variant: "destructive" });
            setIsSubmittingManual(false);
            return;
        }
        const userData = JSON.parse(userDataString);
        const libraryId = userData.libraryId;
        if (!libraryId) {
            toast({ title: "Error de librería", description: "Tu cuenta no está asociada a una librería.", variant: "destructive" });
            setIsSubmittingManual(false);
            return;
        }
        
        const imageUrl = values.imageUrl || `https://placehold.co/300x450.png?text=${encodeURIComponent(values.title)}`;
        const dataAiHint = "book cover";

        const newBookData = {
            title: values.title,
            authors: values.authors.split(',').map(a => a.trim()),
            isbn: values.isbn || '',
            price: values.price,
            stock: values.stock,
            description: values.description || '',
            categories: values.categories || [],
            tags: values.tags || [],
            imageUrl,
            dataAiHint,
            libraryId,
            status: 'published' as const,
            isFeatured: values.isFeatured,
            pageCount: values.pageCount ? Number(values.pageCount) : null,
            coverType: values.coverType || null,
            publisher: values.publisher || null,
        };

        await addDoc(collection(db, "books"), newBookData);

        toast({
            title: "Libro Añadido con Éxito",
            description: `El libro "${values.title}" ha sido guardado en la base de datos.`,
        });

        router.push("/library-admin/books");

    } catch (error: any) {
        console.error("Error al guardar el libro:", error);
        toast({
            title: "Error al Guardar",
            description: `No se pudo guardar el libro. Error: ${error.message}`,
            variant: "destructive",
        });
    } finally {
        setIsSubmittingManual(false);
    }
}

  async function onFileImport() {
    if (!importFile) {
        toast({ title: "No hay archivo", description: "Por favor, selecciona un archivo para importar.", variant: "destructive" });
        return;
    }
    setIsSubmittingFile(true);
    toast({
      title: "Función no implementada",
      description: "La importación de archivos se implementará próximamente.",
      variant: "destructive"
    });
    console.log("Attempted to import file:", importFile.name);
    
    setIsSubmittingFile(false);
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/library-admin/books" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver a Mis Libros">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Añadir Nuevos Libros</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookPlus/> Añadir un Libro Manualmente</CardTitle>
            <CardDescription>Rellena los detalles de un libro específico.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onManualSubmit)} className="space-y-4">
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Una breve sinopsis del libro..." {...field} /></FormControl><FormMessage /></FormItem> )} />

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
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><ImagePlus className="mr-2 h-4 w-4"/>URL de la Portada</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
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

                <Button type="submit" disabled={isSubmittingManual || isSubmittingFile} className="w-full">
                  {isSubmittingManual ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmittingManual ? 'Guardando...' : 'Guardar Libro'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
           <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileUp/> Importar Libros desde Archivo</CardTitle>
            <CardDescription>Sube un archivo .CSV o .XLSX para añadir múltiples libros a la vez.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Asegúrate de que tu archivo tenga las columnas: `title`, `authors`, `isbn`, `price`, `stock`, `description`, `categories`, `tags`.
            </p>
            <div className="space-y-2">
                <Label htmlFor="file-upload">Seleccionar archivo</Label>
                <Input 
                    id="file-upload" 
                    type="file" 
                    onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                    disabled={isSubmittingFile || isSubmittingManual}
                />
                {importFile && <p className="text-sm text-muted-foreground mt-2">Archivo seleccionado: {importFile.name}</p>}
            </div>
            <Button onClick={onFileImport} disabled={!importFile || isSubmittingFile || isSubmittingManual} className="w-full">
                {isSubmittingFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                {isSubmittingFile ? 'Importando...' : 'Importar Archivo'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
