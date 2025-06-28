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
import { Loader2, ArrowLeft, Save, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { DigitalBook } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { bookCategories, bookTags } from "@/lib/options";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const digitalBookFormSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  author: z.string().min(3, "El autor es requerido."),
  description: z.string().optional(),
  epubFileUrl: z.string().url("La URL del archivo EPUB es requerida.").optional().or(z.literal('')),
  format: z.enum(['EPUB', 'PDF', 'EPUB & PDF'], { required_error: "Debes seleccionar un formato." }),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});
type DigitalBookFormValues = z.infer<typeof digitalBookFormSchema>;

export default function EditDigitalBookPage() {
  const [bookData, setBookData] = useState<DigitalBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEpubFile, setNewEpubFile] = useState<File | null>(null);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");

  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const form = useForm<DigitalBookFormValues>({
    resolver: zodResolver(digitalBookFormSchema),
    defaultValues: { title: "", author: "", description: "", epubFileUrl: "", categories: [], tags: [] },
  });
  
  const currentCoverUrl = bookData?.coverImageUrl;

  useEffect(() => {
      if (!bookId || !db) return;
      
      const fetchBook = async () => {
          setIsLoading(true);
          try {
              const bookRef = doc(db, "digital_books", bookId);
              const docSnap = await getDoc(bookRef);

              if (docSnap.exists()) {
                  const book = docSnap.data() as DigitalBook;
                  setBookData(book);
                  form.reset({
                      title: book.title,
                      author: book.author,
                      description: book.description || "",
                      epubFileUrl: book.epubFileUrl || "",
                      format: book.format,
                      categories: book.categories || [],
                      tags: book.tags || [],
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

  const handleEpubFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/epub+zip') setNewEpubFile(file);
    else if (file) toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo .epub", variant: "destructive" });
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

  async function onSubmit(values: DigitalBookFormValues) {
    if (!db || !bookId || !bookData) return;
    
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let finalCoverUrl = bookData.coverImageUrl;
      if (newCoverFile) {
        setUploadStep("Subiendo nueva portada...");
        finalCoverUrl = await uploadFile(newCoverFile, 'covers');
      }

      let finalEpubUrl = values.epubFileUrl;
      if (newEpubFile) {
        setUploadStep("Subiendo nuevo EPUB...");
        finalEpubUrl = await uploadFile(newEpubFile, 'epubs');
      }
      
      setUploadStep("Actualizando información...");
      const bookRef = doc(db, "digital_books", bookId);
      const dataToUpdate = { ...values, coverImageUrl: finalCoverUrl, epubFileUrl: finalEpubUrl };
      await updateDoc(bookRef, dataToUpdate);
      
      toast({ title: "Libro digital actualizado", description: `"${values.title}" se ha guardado.` });
      router.push("/superadmin/digital-library");

    } catch (error: any) {
      let errorMessage = "Ocurrió un error inesperado.";
      if (error.code === 'storage/unauthorized') errorMessage = "Error de Permisos en Firebase Storage.";
      else errorMessage = `Error: ${error.message}`;
      toast({ title: "Error en el Proceso", description: errorMessage, variant: "destructive", duration: 10000 });
    } finally {
      setIsSubmitting(false);
      setUploadStep("");
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
          <CardDescription>Modifica la información y archivos del libro.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="format" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un formato" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="EPUB">EPUB</SelectItem><SelectItem value="PDF">PDF</SelectItem><SelectItem value="EPUB & PDF">EPUB & PDF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
              
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="text-sm font-medium leading-none">Portada del Libro</h4>
                <div className="flex gap-4 items-start">
                    {(coverPreview || currentCoverUrl) && (
                        <Image src={coverPreview || currentCoverUrl} alt="Vista previa de la portada" width={100} height={150} className="rounded-md border object-cover aspect-[2/3] bg-muted" />
                    )}
                    <div className="flex-grow space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cover-file">Reemplazar Portada</Label>
                            <Input id="cover-file" type="file" accept="image/*" onChange={handleCoverFileChange} disabled={isSubmitting} />
                        </div>
                    </div>
                </div>
              </div>
              
              <div className="space-y-2">
                  <Label htmlFor="epub-file">Reemplazar Archivo EPUB (Opcional)</Label>
                  <Input id="epub-file" type="file" accept=".epub,application/epub+zip" onChange={handleEpubFileChange} disabled={isSubmitting} />
                  {newEpubFile && <p className="text-sm text-muted-foreground">Nuevo archivo a subir: {newEpubFile.name}</p>}
                  {form.getValues('epubFileUrl') && !newEpubFile && <p className="text-sm text-muted-foreground">Hay un archivo EPUB asociado. Sube uno nuevo para reemplazarlo.</p>}
              </div>
              
              <FormField control={form.control} name="categories" render={({ field }) => (<FormItem><FormLabel>Categorías</FormLabel><FormControl><MultiSelect placeholder="Selecciona categorías..." options={bookCategories} value={field.value || []} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="tags" render={({ field }) => (<FormItem><FormLabel>Etiquetas</FormLabel><FormControl><MultiSelect placeholder="Selecciona etiquetas..." options={bookTags} value={field.value || []} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
              
              {isSubmitting && (
                <div className="space-y-2">
                  <Label>{uploadStep} {Math.round(uploadProgress)}%</Label>
                  <Progress value={uploadProgress} />
                </div>
              )}
              
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
