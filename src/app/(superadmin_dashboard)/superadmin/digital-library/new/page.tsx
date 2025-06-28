// src/app/(superadmin_dashboard)/superadmin/digital-library/new/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, PlusCircle, FileUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase"; 
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { bookCategories, bookTags } from "@/lib/options";
import { Progress } from "@/components/ui/progress";
import * as epubjs from "epubjs";

const digitalBookFormSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  author: z.string().min(3, "El autor es requerido."),
  description: z.string().optional(),
  coverImageUrl: z.string().url("La URL de la portada es requerida y debe ser válida."),
  format: z.enum(['EPUB', 'PDF', 'EPUB & PDF'], { required_error: "Debes seleccionar un formato." }),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});
type DigitalBookFormValues = z.infer<typeof digitalBookFormSchema>;

export default function NewDigitalBookPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<DigitalBookFormValues>({
    resolver: zodResolver(digitalBookFormSchema),
    defaultValues: {
      title: "", author: "", description: "", coverImageUrl: "", categories: [], tags: [],
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/epub+zip') {
      setEpubFile(file);
      const book = epubjs.default(file as any);
      book.loaded.metadata.then(async (metadata) => {
        form.setValue("title", metadata.title || "Título no encontrado");
        form.setValue("author", metadata.creator || "Autor desconocido");
        form.setValue("description", metadata.description || "");

        const coverUrl = await book.coverUrl();
        if (coverUrl) {
          // This will be a blob URL, we can use it for display if needed
          // but for now, we'll prompt user for a proper URL.
           toast({ title: "Portada encontrada", description: "Por favor, sube esta portada a un servicio de imágenes y pega la URL en el campo 'URL de la Portada'." });
        }
      });
    } else {
      toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo .epub", variant: "destructive" });
    }
  };

  async function onSubmit(values: DigitalBookFormValues) {
    if (!epubFile) {
      toast({ title: "Falta el archivo", description: "Por favor, selecciona un archivo EPUB para subir.", variant: "destructive" });
      return;
    }
    if (!db || !storage) {
      toast({ title: "Error de configuración", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `epubs/${Date.now()}-${epubFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, epubFile);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        toast({ title: "Error al subir archivo", description: error.message, variant: "destructive" });
        setIsSubmitting(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, "digital_books"), {
            ...values,
            epubFileUrl: downloadURL,
            createdAt: serverTimestamp(),
          });
          toast({ title: "¡Libro digital añadido!", description: `"${values.title}" ahora está en la biblioteca.` });
          router.push("/superadmin/digital-library");
        } catch (error: any) {
           console.error("Error al guardar en DB:", error);
           toast({ title: "Error al guardar datos", description: error.message, variant: "destructive" });
           setIsSubmitting(false);
        }
      }
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
        <h1 className="font-headline text-3xl font-bold text-primary">Añadir Nuevo Libro Digital</h1>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Detalles del Libro</CardTitle>
          <CardDescription>
            Selecciona un archivo `.epub` de tu computadora. El sistema intentará extraer los metadatos automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <div className="space-y-2">
                  <Label htmlFor="epub-file">Archivo EPUB</Label>
                  <Input id="epub-file" type="file" accept=".epub" onChange={handleFileChange} disabled={isSubmitting} />
                  {epubFile && <p className="text-sm text-muted-foreground">Archivo seleccionado: {epubFile.name}</p>}
               </div>

              <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
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
              <FormField control={form.control} name="coverImageUrl" render={({ field }) => ( <FormItem><FormLabel>URL de la Portada</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />
              
               {isSubmitting && (
                <div className="space-y-2">
                  <Label>{uploadProgress < 100 ? `Subiendo archivo... ${Math.round(uploadProgress)}%` : 'Guardando en base de datos...'}</Label>
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
