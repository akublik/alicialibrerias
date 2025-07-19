// src/app/(superadmin_dashboard)/superadmin/digital-library/new/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, PlusCircle, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase"; 
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { bookCategories, bookTags } from "@/lib/options";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const digitalBookFormSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  author: z.string().min(3, "El autor es requerido."),
  isbn: z.string().min(10, "El ISBN es requerido y debe ser válido.").optional().or(z.literal('')),
  description: z.string().optional(),
  format: z.enum(['EPUB', 'PDF', 'EPUB & PDF'], { required_error: "Debes seleccionar un formato." }),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});
type DigitalBookFormValues = z.infer<typeof digitalBookFormSchema>;

export default function NewDigitalBookPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<DigitalBookFormValues>({
    resolver: zodResolver(digitalBookFormSchema),
    defaultValues: {
      title: "", author: "", isbn: "", description: "", categories: [], tags: [],
    },
  });

  const handleEpubFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/epub+zip') {
        toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo .epub", variant: "destructive" });
        setEpubFile(null);
        if (event.target) event.target.value = ""; // Reset file input
        return;
      }
      setEpubFile(file);
    }
  };

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setCoverFile(file);
        // Create a preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setCoverPreview(reader.result as string);
        };
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
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
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
    if (!coverFile || !epubFile) {
      toast({ title: "Faltan archivos", description: "Debes subir un archivo de portada y un archivo EPUB.", variant: "destructive" });
      return;
    }
    if (!db) {
      toast({ title: "Error de configuración", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let coverUploadUrl = "";
      // 1. Upload Cover Image if a file is provided
      if (coverFile) {
        setUploadStep("Subiendo portada...");
        coverUploadUrl = await uploadFile(coverFile, 'covers');
      }

      // 2. Upload EPUB file
      setUploadStep("Subiendo EPUB...");
      const epubUploadUrl = await uploadFile(epubFile!, 'epubs');

      // 3. Save metadata to Firestore
      setUploadStep("Guardando información...");
      await addDoc(collection(db, "digital_books"), {
        ...values,
        coverImageUrl: coverUploadUrl,
        epubFileUrl: epubUploadUrl,
        createdAt: serverTimestamp(),
      });

      toast({ title: "¡Libro digital añadido!", description: `"${values.title}" ahora está en la biblioteca.` });
      router.push("/superadmin/digital-library");

    } catch (error: any) {
      let errorMessage = "Ocurrió un error inesperado.";
      if (error.code === 'storage/unauthorized') {
          errorMessage = "Error de Permisos en Firebase Storage. Revisa las reglas de seguridad.";
      } else {
          errorMessage = `Error: ${error.message}`;
      }
      toast({ title: "Error en el Proceso", description: errorMessage, variant: "destructive", duration: 10000 });
    } finally {
      setIsSubmitting(false);
      setUploadStep("");
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
          <CardTitle>Detalles del Libro</CardTitle>
          <CardDescription>
            Rellena la información del libro y sube los archivos necesarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="isbn" render={({ field }) => ( <FormItem><FormLabel>ISBN (Requerido)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} placeholder="ISBN único del libro digital" /></FormControl><FormMessage /></FormItem> )} />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato Principal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un formato" /></SelectTrigger></FormControl>
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
              
               <div className="space-y-2">
                 <Label htmlFor="cover-file">Archivo de Portada (Requerido)</Label>
                 <Input id="cover-file" type="file" accept="image/*" onChange={handleCoverFileChange} disabled={isSubmitting} required />
                 {coverPreview && <Image src={coverPreview} alt="Vista previa de la portada" width={100} height={150} className="mt-2 rounded-md border object-cover aspect-[2/3]" />}
               </div>
               
               <div className="space-y-2">
                  <Label htmlFor="epub-file">Archivo EPUB (Requerido)</Label>
                  <Input id="epub-file" type="file" accept=".epub,application/epub+zip" onChange={handleEpubFileChange} disabled={isSubmitting} required />
                  {epubFile && <p className="text-sm text-muted-foreground">Archivo seleccionado: {epubFile.name}</p>}
               </div>
              
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorías</FormLabel>
                    <FormControl><MultiSelect placeholder="Selecciona categorías..." options={bookCategories} value={field.value || []} onChange={field.onChange} /></FormControl>
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
                    <FormControl><MultiSelect placeholder="Selecciona etiquetas..." options={bookTags} value={field.value || []} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isSubmitting && (
                <div className="space-y-2">
                  <Label>{uploadStep} {Math.round(uploadProgress)}%</Label>
                  <Progress value={uploadProgress} />
                </div>
              )}
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Añadir Libro
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
