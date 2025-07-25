// src/app/(library_dashboard)/library-admin/books/edit/[id]/page.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save, Sparkles, Share2, MessageSquarePlus, Star, Wand2, Upload } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { Book } from "@/types";
import { MultiSelect } from "@/components/ui/multi-select";
import { bookCategories, bookTags } from "@/lib/options";
import { Switch } from "@/components/ui/switch";
import { generateAutomaticTags } from "@/ai/flows/generate-automatic-tags";
import { generateBookDescription } from "@/ai/flows/generate-book-description";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { generateSocialPost } from "@/ai/flows/generate-social-post";
import { generateBookReview, type GenerateBookReviewOutput } from "@/ai/flows/generate-book-review";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";


const bookFormSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }),
  authors: z.string().min(3, { message: "Debe haber al menos un autor." }),
  format: z.enum(['Físico', 'Digital'], { required_error: "Debes seleccionar un formato." }),
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
  condition: z.string().optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export default function EditBookPage() {
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [generatedReview, setGeneratedReview] = useState<GenerateBookReviewOutput | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newEpubFile, setNewEpubFile] = useState<File | null>(null);
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");

  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
  });

  const currentCoverUrl = book?.imageUrl;
  const bookFormat = form.watch('format');

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
          
          form.reset({
            title: bookData.title,
            authors: bookData.authors.join(', '),
            format: bookData.format || 'Físico',
            isbn: bookData.isbn || '',
            price: bookData.price,
            stock: bookData.stock,
            description: bookData.description || '',
            categories: bookData.categories || [],
            tags: bookData.tags || [],
            isFeatured: bookData.isFeatured || false,
            pageCount: bookData.pageCount || '',
            coverType: bookData.coverType || '',
            publisher: bookData.publisher || '',
            condition: bookData.condition || 'Nuevo',
          });

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
        toast({ title: "Descripción muy corta", description: "Escribe al menos 20 caracteres para generar etiquetas.", variant: "destructive" });
        return;
    }
    setIsGeneratingTags(true);
    try {
        const result = await generateAutomaticTags({ description });
        const currentTags = form.getValues("tags") || [];
        const newTags = new Set([...currentTags, ...result.tags]);
        form.setValue("tags", Array.from(newTags), { shouldValidate: true });
        toast({ title: "Etiquetas Sugeridas", description: "Se han añadido nuevas etiquetas." });
    } catch (error: any) {
        let toastDescription = "No se pudieron generar las etiquetas. Inténtalo de nuevo.";
        if (error instanceof Error && (error.message.includes('API key') || error.message.includes('GOOGLE_API_KEY'))) {
          toastDescription = "La función de IA no está disponible en este momento."
        }
        toast({ title: "Error de IA", description: toastDescription, variant: "destructive" });
    } finally {
        setIsGeneratingTags(false);
    }
  };

  const handleGenerateDescription = async () => {
      const title = form.getValues("title");
      const authors = form.getValues("authors");
      if (!title || !authors) {
          toast({ title: "Faltan datos", description: "El título y el autor son necesarios para generar una descripción.", variant: "destructive" });
          return;
      }
      setIsGeneratingDescription(true);
      try {
          const result = await generateBookDescription({ title, author: authors });
          form.setValue("description", result.description);
          toast({ title: "Descripción Generada", description: "La sinopsis ha sido creada por la IA." });
      } catch (error: any) {
          toast({ title: "Error de IA", description: "No se pudo generar la descripción.", variant: "destructive" });
      } finally {
          setIsGeneratingDescription(false);
      }
  };


  const handleGeneratePost = async () => {
    if (!book) return;
    setIsGeneratingPost(true);
    try {
        const result = await generateSocialPost({
            title: book.title,
            author: book.authors.join(', '),
            description: book.description,
            price: book.price,
            libraryName: book.libraryName || "nuestra librería",
        });
        setGeneratedPost(result.postText);
        setIsPostDialogOpen(true);
    } catch (error: any) {
        toast({ title: "Error de IA", description: "No se pudo generar la publicación.", variant: "destructive" });
    } finally {
        setIsGeneratingPost(false);
    }
  };

  const handleGenerateReview = async () => {
    if (!book) return;
    setIsGeneratingReview(true);
    try {
        const result = await generateBookReview({
            title: book.title,
            author: book.authors.join(', '),
            description: book.description,
        });
        setGeneratedReview(result);
        setIsReviewDialogOpen(true);
    } catch (error: any) {
        toast({ title: "Error de IA", description: "No se pudo generar la reseña.", variant: "destructive" });
    } finally {
        setIsGeneratingReview(false);
    }
  };
  
  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setNewCoverFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setCoverPreview(reader.result as string);
        reader.readAsDataURL(file);
    } else if (file) {
        toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo de imagen.", variant: "destructive" });
        setNewCoverFile(null);
        setCoverPreview(null);
        if (event.target) event.target.value = "";
    }
  };

  const handleEpubFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) setNewEpubFile(e.target.files[0]);
  };
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) setNewPdfFile(e.target.files[0]);
  };

  const uploadFile = (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!storage) { reject(new Error("Firebase Storage no está configurado.")); return; }
      const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed',
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => { console.error(`Error de subida en ${path}:`, error); reject(error); },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) { reject(error); }
        }
      );
    });
  };

  async function onSubmit(values: BookFormValues) {
    if (!bookId || !book || !db) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      let finalImageUrl = book.imageUrl;
      let finalEpubUrl = book.epubFileUrl || '';
      let finalPdfUrl = book.pdfFileUrl || '';

      if (newCoverFile) {
        setUploadStep("Subiendo nueva portada...");
        finalImageUrl = await uploadFile(newCoverFile, 'covers');
      }
      if (newEpubFile) {
        setUploadStep("Subiendo EPUB...");
        finalEpubUrl = await uploadFile(newEpubFile, 'epubs');
      }
      if (newPdfFile) {
        setUploadStep("Subiendo PDF...");
        finalPdfUrl = await uploadFile(newPdfFile, 'pdfs');
      }


      setUploadStep("Actualizando información...");
      const libraryDataString = localStorage.getItem("aliciaLibros_registeredLibrary");
      if (!libraryDataString) throw new Error("No se pudo encontrar la información de la librería registrada.");
      const libraryData = JSON.parse(libraryDataString);

      const updatedData = {
          title: values.title,
          slug: slugify(values.title),
          authors: values.authors.split(',').map(a => a.trim()),
          format: values.format,
          isbn: values.isbn || '',
          price: values.price,
          stock: values.stock,
          description: values.description || '',
          categories: values.categories || [],
          tags: values.tags || [],
          imageUrl: finalImageUrl,
          epubFileUrl: finalEpubUrl,
          pdfFileUrl: finalPdfUrl,
          isFeatured: values.isFeatured,
          pageCount: values.pageCount ? Number(values.pageCount) : null,
          coverType: values.coverType || null,
          publisher: values.publisher || null,
          condition: values.condition || 'Nuevo',
          libraryId: book.libraryId,
          libraryName: libraryData.name,
          libraryLocation: libraryData.location,
          updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "books", bookId), updatedData);
      toast({ title: "Libro Actualizado", description: `"${values.title}" se ha guardado.` });
      router.push("/library-admin/books");

    } catch (error: any) {
        let errorMessage = `No se pudo actualizar el libro. Error: ${error.message}`;
        if (error.code === 'storage/unauthorized') {
            errorMessage = "Error de Permisos en Firebase Storage. Revisa las reglas de seguridad de tu proyecto.";
        }
        toast({ title: "Error al Guardar", description: errorMessage, variant: "destructive", duration: 10000 });
    } finally {
      setIsSubmitting(false);
      setUploadStep("");
    }
  }

  if (isLoading) {
    return ( <div className="flex justify-center items-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div> );
  }

  if (!book) {
    return <p>Libro no encontrado.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/library-admin/books" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver a Mis Libros"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
           <h1 className="font-headline text-3xl font-bold text-primary">Editar Libro</h1>
           <p className="text-muted-foreground">{book.title}</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader><CardTitle>Detalles del Libro</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Cien Años de Soledad" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="authors" render={({ field }) => ( <FormItem><FormLabel>Autor(es) (separados por coma)</FormLabel><FormControl><Input placeholder="Gabriel García Márquez" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              
              <FormField control={form.control} name="format" render={({ field }) => ( <FormItem><FormLabel>Formato del Libro</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un formato" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Físico">Físico</SelectItem><SelectItem value="Digital">Digital</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />

              {bookFormat === 'Digital' && (
                  <Card className="bg-muted/50">
                      <CardHeader><CardTitle className="text-lg">Archivos Digitales (Opcional)</CardTitle><CardDescription>Sube los archivos para el libro digital si deseas que sea descargable. Puedes reemplazar los existentes.</CardDescription></CardHeader>
                      <CardContent className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="epub-file">Reemplazar Archivo EPUB</Label>
                              <Input id="epub-file" type="file" accept=".epub" onChange={handleEpubFileChange} disabled={isSubmitting} />
                              {book.epubFileUrl && !newEpubFile && <p className="text-xs text-muted-foreground">Archivo actual: <Link href={book.epubFileUrl} target="_blank" className="underline">Ver EPUB</Link></p>}
                          </div>
                           <div className="space-y-2">
                              <Label htmlFor="pdf-file">Reemplazar Archivo PDF</Label>
                              <Input id="pdf-file" type="file" accept=".pdf" onChange={handlePdfFileChange} disabled={isSubmitting} />
                              {book.pdfFileUrl && !newPdfFile && <p className="text-xs text-muted-foreground">Archivo actual: <Link href={book.pdfFileUrl} target="_blank" className="underline">Ver PDF</Link></p>}
                          </div>
                      </CardContent>
                  </Card>
              )}


               <div className="grid sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="isbn" render={({ field }) => ( <FormItem><FormLabel>ISBN</FormLabel><FormControl><Input placeholder="978-3-16-148410-0" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Precio</FormLabel><FormControl><Input type="number" step="0.01" placeholder="15.99" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="stock" render={({ field }) => ( <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" placeholder="10" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
               </div>
              
              <h4 className="font-headline text-lg text-foreground border-b pb-2 pt-4">Ficha Técnica (Opcional)</h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="pageCount" render={({ field }) => ( <FormItem><FormLabel>Nº de Páginas</FormLabel><FormControl><Input type="number" placeholder="320" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="coverType" render={({ field }) => ( <FormItem><FormLabel>Tipo de Tapa</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Tapa Blanda">Tapa Blanda</SelectItem><SelectItem value="Tapa Dura">Tapa Dura</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="publisher" render={({ field }) => ( <FormItem><FormLabel>Editorial</FormLabel><FormControl><Input placeholder="Ej: Planeta" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="condition" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condición</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Nuevo">Nuevo</SelectItem>
                          <SelectItem value="Usado">Usado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-1">
                    <FormLabel>Descripción</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGeneratingDescription}>
                      {isGeneratingDescription ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                      Generar con IA
                    </Button>
                  </div>
                  <FormControl><Textarea placeholder="Una breve sinopsis del libro..." {...field} rows={6} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="categories" render={({ field }) => ( <FormItem><FormLabel>Categorías</FormLabel><FormControl><MultiSelect placeholder="Selecciona categorías..." options={bookCategories} value={field.value || []} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="tags" render={({ field }) => ( <FormItem><div className="flex items-center justify-between mb-1"><FormLabel>Etiquetas</FormLabel><Button type="button" variant="outline" size="sm" onClick={handleGenerateTags} disabled={isGeneratingTags}>{isGeneratingTags ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}Sugerir con IA</Button></div><FormControl><MultiSelect placeholder="Selecciona etiquetas..." options={bookTags} value={field.value || []} onChange={field.onChange}/></FormControl><FormMessage /></FormItem> )} />
              </div>
               <FormField control={form.control} name="isFeatured" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4"><div className="space-y-0.5"><FormLabel className="text-base">Destacar Libro</FormLabel><FormDescription>Si se activa, este libro aparecerá en un lugar destacado en la página de tu librería.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-2">Imagen de Portada</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden border bg-muted">
                        <Image src={coverPreview || currentCoverUrl || 'https://placehold.co/300x450.png'} alt="Vista previa de portada" layout="fill" objectFit="cover" key={coverPreview || currentCoverUrl} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cover-file">Reemplazar Portada</Label>
                        <Input id="cover-file" type="file" accept="image/*" onChange={handleCoverFileChange} disabled={isSubmitting} />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">Herramientas de Marketing</CardTitle>
                    <CardDescription>Usa la IA para generar contenido y promocionar este libro.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <Button type="button" className="w-full" onClick={handleGeneratePost} disabled={isGeneratingPost}>
                        {isGeneratingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Share2 className="mr-2 h-4 w-4"/>}
                        Post para Redes Sociales
                    </Button>
                     <Button type="button" className="w-full" variant="outline" onClick={handleGenerateReview} disabled={isGeneratingReview}>
                        {isGeneratingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MessageSquarePlus className="mr-2 h-4 w-4"/>}
                        Reseña de Ejemplo
                    </Button>
                </CardContent>
            </Card>

            {isSubmitting && (
              <div className="space-y-2">
                <Label>{uploadStep} {Math.round(uploadProgress)}%</Label>
                <Progress value={uploadProgress} />
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Form>

       <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Publicación Sugerida</DialogTitle><DialogDescription>Copia este texto y pégalo en tus redes sociales. Puedes editarlo como quieras.</DialogDescription></DialogHeader>
            <div className="my-4"><Textarea readOnly value={generatedPost} rows={10} className="bg-muted"/></div>
            <DialogFooter>
                <Button onClick={() => { navigator.clipboard.writeText(generatedPost); toast({ title: "¡Copiado!", description: "El texto se ha copiado a tu portapapeles." }); }}>Copiar Texto</Button>
                <Button variant="secondary" onClick={() => setIsPostDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Reseña Generada por IA</DialogTitle>
              <DialogDescription>
                Copia esta reseña para usarla en tu material de marketing o como ejemplo en la página del libro.
              </DialogDescription>
            </DialogHeader>
            {generatedReview && (
                <div className="my-4 space-y-4">
                    <div className="flex items-center gap-4 rounded-lg border bg-muted p-4">
                        <div className="text-2xl font-bold">{generatedReview.rating}</div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                             <Star key={i} className={`h-6 w-6 ${i < generatedReview.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`}/>
                          ))}
                        </div>
                        <div className="ml-auto text-sm text-muted-foreground">
                          por <strong>{generatedReview.userName}</strong>
                        </div>
                    </div>
                    <Textarea readOnly value={generatedReview.reviewText} rows={6}/>
                </div>
            )}
            <DialogFooter>
                <Button onClick={() => { if (generatedReview) { navigator.clipboard.writeText(generatedReview.reviewText); toast({ title: "¡Copiado!", description: "La reseña se ha copiado a tu portapapeles." }); } }}>Copiar Reseña</Button>
                <Button variant="secondary" onClick={() => setIsReviewDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
