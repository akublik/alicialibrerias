// src/app/(library_dashboard)/library-admin/books/new/page.tsx
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, BookPlus, ImagePlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { MultiSelect } from "@/components/ui/multi-select";
import { bookCategories, bookTags } from "@/lib/options";
import { Switch } from "@/components/ui/switch";
import { generateAutomaticTags } from '@/ai/flows/generate-automatic-tags';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";


const bookFormSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }),
  authors: z.string().min(3, { message: "Debe haber al menos un autor." }),
  isbn: z.string().optional(),
  price: z.coerce.number().positive({ message: "El precio debe ser un número positivo." }),
  stock: z.coerce.number().int().min(0, { message: "El stock no puede ser negativo." }),
  description: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
  pageCount: z.union([z.coerce.number().int().positive({ message: "Debe ser un número positivo." }), z.literal('')]).optional(),
  coverType: z.string().optional(),
  publisher: z.string().optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export default function NewBookPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");
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
      isFeatured: false,
      pageCount: '',
      coverType: '',
      publisher: '',
    },
  });

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setCoverFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setCoverPreview(reader.result as string);
        reader.readAsDataURL(file);
    } else if (file) {
        toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo de imagen.", variant: "destructive" });
        setCoverFile(null);
        setCoverPreview(null);
        if (event.target) event.target.value = "";
    }
  };

  const uploadFile = (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!storage) {
        reject(new Error("Firebase Storage no está configurado."));
        return;
      }
      const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => {
          console.error(`Error de subida en ${path}:`, error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

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
    if (!coverFile) {
        toast({ title: "Falta la portada", description: "Debes subir un archivo para la portada del libro.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    
    if (!db) {
        toast({ title: "Error de configuración", description: "La base de datos no está disponible.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
        const userDataString = localStorage.getItem("aliciaLibros_user");
        if (!userDataString) throw new Error("No se pudo encontrar la información del usuario.");
        const userData = JSON.parse(userDataString);
        const libraryId = userData.libraryId;
        if (!libraryId) throw new Error("Tu cuenta no está asociada a una librería.");
        
        const libraryDataString = localStorage.getItem("aliciaLibros_registeredLibrary");
        if (!libraryDataString) throw new Error("No se pudo encontrar la información de la librería registrada.");
        const libraryData = JSON.parse(libraryDataString);

        let finalImageUrl = '';
        let finalDataAiHint = 'book cover';

        if (coverFile) {
            setUploadStep("Subiendo portada...");
            finalImageUrl = await uploadFile(coverFile, 'covers');
        } else {
             finalImageUrl = `https://placehold.co/300x450.png?text=${encodeURIComponent(values.title)}`;
        }
        
        setUploadStep("Guardando información...");
        const newBookData = {
            title: values.title,
            authors: values.authors.split(',').map(a => a.trim()),
            isbn: values.isbn || '',
            price: values.price,
            stock: values.stock,
            description: values.description || '',
            categories: values.categories || [],
            tags: values.tags || [],
            imageUrl: finalImageUrl,
            dataAiHint: finalDataAiHint,
            libraryId,
            libraryName: libraryData.name,
            libraryLocation: libraryData.location,
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
        let errorMessage = `No se pudo guardar el libro. Error: ${error.message}`;
        if (error.code === 'storage/unauthorized') {
            errorMessage = "Error de Permisos en Firebase Storage. Revisa las reglas de seguridad de tu proyecto.";
        }
        toast({ title: "Error al Guardar", description: errorMessage, variant: "destructive", duration: 10000,});
    } finally {
        setIsSubmitting(false);
        setUploadStep("");
    }
}

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/library-admin/books" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver a Mis Libros">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Añadir Nuevo Libro</h1>
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
                  <FormField control={form.control} name="coverType" render={({ field }) => ( <FormItem> <FormLabel>Tipo de Tapa</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Tapa Blanda">Tapa Blanda</SelectItem><SelectItem value="Tapa Dura">Tapa Dura</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="publisher" render={({ field }) => ( <FormItem><FormLabel>Editorial</FormLabel><FormControl><Input placeholder="Ej: Planeta" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Una breve sinopsis del libro..." {...field} /></FormControl><FormMessage /></FormItem> )} />

              <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="categories" render={({ field }) => ( <FormItem> <FormLabel>Categorías</FormLabel> <FormControl><MultiSelect placeholder="Selecciona categorías..." options={bookCategories} value={field.value || []} onChange={field.onChange} /></FormControl> <FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="tags" render={({ field }) => ( <FormItem> <div className="flex items-center justify-between mb-1"><FormLabel>Etiquetas</FormLabel><Button type="button" variant="outline" size="sm" onClick={handleGenerateTags} disabled={isGeneratingTags}>{isGeneratingTags ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>} Sugerir con IA</Button></div><FormControl><MultiSelect placeholder="Selecciona etiquetas..." options={bookTags} value={field.value || []} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ImagePlus/>Imagen de Portada</CardTitle>
                    <CardDescription>Sube un archivo de imagen para la portada del libro.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {coverPreview && (
                        <div className="relative w-full max-w-xs aspect-[2/3] rounded-md overflow-hidden border mx-auto bg-muted">
                            <Image src={coverPreview} alt="Vista previa de portada" layout="fill" objectFit="cover" />
                        </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="cover-file">Archivo de Portada (Requerido)</Label>
                      <Input id="cover-file" type="file" accept="image/*" onChange={handleCoverFileChange} disabled={isSubmitting} required />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader><CardTitle>Opciones Adicionales</CardTitle></CardHeader>
                <CardContent>
                    <FormField control={form.control} name="isFeatured" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"> <div className="space-y-0.5"><FormLabel className="text-base">Destacar Libro</FormLabel><FormDescription>Si se activa, este libro aparecerá en un lugar destacado en la página de tu librería.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
                </CardContent>
            </Card>

            {isSubmitting && (
              <div className="space-y-2">
                <Label>{uploadStep} {Math.round(uploadProgress)}%</Label>
                <Progress value={uploadProgress} />
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookPlus className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Guardando...' : 'Guardar Libro'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}