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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, PlusCircle, FileUp } from "lucide-react";
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
import ePub from "epubjs";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const digitalBookFormSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  author: z.string().min(3, "El autor es requerido."),
  description: z.string().optional(),
  coverImageUrl: z.string().url("La URL de la portada es requerida y debe ser válida."),
  epubFilename: z.string().min(1, "El nombre del archivo EPUB es requerido."),
  pdfFilename: z.string().optional(),
  format: z.enum(['EPUB', 'PDF', 'EPUB & PDF'], { required_error: "Debes seleccionar un formato." }),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

type DigitalBookFormValues = z.infer<typeof digitalBookFormSchema>;

export default function NewDigitalBookPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [parsedCoverUrl, setParsedCoverUrl] = useState<string | null>(null);
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<DigitalBookFormValues>({
    resolver: zodResolver(digitalBookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      description: "",
      coverImageUrl: "",
      epubFilename: "",
      pdfFilename: "",
      categories: [],
      tags: [],
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/epub+zip") {
      toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo .epub", variant: "destructive" });
      return;
    }

    setIsParsing(true);
    setFormVisible(false);
    form.reset();
    setEpubFile(file);
    if (parsedCoverUrl) URL.revokeObjectURL(parsedCoverUrl);
    setParsedCoverUrl(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
        if (!e.target?.result) {
            setIsParsing(false);
            toast({ title: "Error de lectura", description: "No se pudo leer el archivo.", variant: "destructive" });
            return;
        }
        try {
            const book = ePub(e.target.result as ArrayBuffer);
            const metadata = await book.loaded.metadata;
            const coverUrl = await book.coverUrl();
            if (coverUrl) {
                const response = await fetch(coverUrl);
                const blob = await response.blob();
                setParsedCoverUrl(URL.createObjectURL(blob));
            }
             const getAuthor = (creator: any): string => {
                if (!creator) return "";
                if (typeof creator === 'string') return creator;
                if (Array.isArray(creator) && creator.length > 0) {
                    const firstAuthor = creator[0];
                    if (typeof firstAuthor === 'string') return firstAuthor;
                    if (typeof firstAuthor === 'object' && firstAuthor !== null && (firstAuthor['#text'] || firstAuthor.name)) return firstAuthor['#text'] || firstAuthor.name;
                }
                if (typeof creator === 'object' && creator !== null && (creator['#text'] || creator.name)) return creator['#text'] || creator.name;
                return "";
            };
            const getSimpleField = (field: any): string => {
                if (!field) return "";
                if (typeof field === 'string') return field;
                if (typeof field === 'number') return String(field);
                if (typeof field === 'object' && field !== null && field['#text']) return field['#text'];
                return "";
            };

            form.setValue("title", getSimpleField(metadata.title) || "Título no encontrado");
            form.setValue("author", getAuthor(metadata.creator) || "Autor desconocido");
            form.setValue("description", getSimpleField(metadata.description) || "");
            form.setValue("epubFilename", file.name);
            form.setValue("format", "EPUB");

            toast({ title: "¡Metadatos extraídos!", description: "Revisa la información y completa los campos restantes." });
            setFormVisible(true);
        } catch (error) {
            console.error("Error parsing EPUB:", error);
            toast({ title: "Error al procesar", description: "No se pudieron extraer los metadatos del archivo EPUB.", variant: "destructive" });
        } finally {
            setIsParsing(false);
        }
    };
    reader.readAsArrayBuffer(file);
  };

  async function onSubmit(values: DigitalBookFormValues) {
    if (!epubFile || !storage || !db) {
      toast({ title: "Error de configuración", description: "Falta el archivo o la conexión con la base de datos.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
        const storageRef = ref(storage, `epubs/${epubFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, epubFile);

        await new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload error:", error);
                    reject(error);
                },
                () => {
                    resolve();
                }
            );
        });

        await addDoc(collection(db, "digital_books"), {
            ...values,
            createdAt: serverTimestamp(),
        });

        toast({ title: "¡Libro digital añadido!", description: `"${values.title}" ahora está en la biblioteca.` });
        router.push("/superadmin/digital-library");

    } catch (error: any) {
        console.error("Error en el proceso de subida:", error);
        toast({ title: "Error en el proceso de subida", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
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
          <CardTitle>Asistente de Creación de Libros Digitales</CardTitle>
          <CardDescription>Sube un archivo EPUB para rellenar automáticamente los detalles del libro. La subida del archivo se hará al guardar.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="p-6 border-2 border-dashed rounded-lg text-center">
                <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">Analizar Archivo EPUB</h3>
                <p className="mt-1 text-sm text-muted-foreground">Selecciona un archivo desde tu computadora.</p>
                <div className="mt-4">
                    <Button asChild variant="outline" disabled={isParsing}>
                        <label htmlFor="epub-upload" className="cursor-pointer">
                            {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isParsing ? "Analizando..." : "Seleccionar Archivo (.epub)"}
                        </label>
                    </Button>
                    <Input id="epub-upload" type="file" className="sr-only" accept=".epub,application/epub+zip" onChange={handleFileChange} disabled={isParsing || isSubmitting} />
                </div>
            </div>

            {formVisible && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6 pt-6 border-t">
                  <h3 className="font-headline text-xl">Revisa los Datos Extraídos</h3>
                  
                   {parsedCoverUrl && (
                      <div className="space-y-2">
                          <Label>Vista Previa de la Portada</Label>
                          <div className="flex justify-center">
                              <div className="relative w-48 h-auto aspect-[2/3] rounded border shadow-md">
                                  <Image src={parsedCoverUrl} alt="Portada extraída" layout="fill" objectFit="cover" />
                              </div>
                          </div>
                      </div>
                  )}

                  <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="author" render={({ field }) => ( <FormItem><FormLabel>Autor</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Breve sinopsis del libro..." {...field} value={field.value || ''} rows={5} /></FormControl><FormMessage /></FormItem> )} />
                  
                  <Separator />
                  <h3 className="font-headline text-lg">Completa la Información Requerida</h3>

                  <FormField control={form.control} name="coverImageUrl" render={({ field }) => ( <FormItem><FormLabel>URL de la Portada (Permanente)</FormLabel><FormControl><Input type="url" placeholder="https://ejemplo.com/portada.jpg" {...field} value={field.value || ''} /></FormControl><FormDescription>Pega aquí la URL de la imagen de portada que has subido a tu hosting o a un servicio de imágenes.</FormDescription><FormMessage /></FormItem> )} />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="epubFilename" render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>Nombre Archivo EPUB</FormLabel>
                            <FormControl><Input placeholder="libro-ejemplo.epub" {...field} value={field.value || ''} readOnly /></FormControl>
                            <FormDescription>Se subirá al guardar.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField
                      control={form.control}
                      name="format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formato</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un formato" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="EPUB">EPUB</SelectItem><SelectItem value="PDF">PDF</SelectItem><SelectItem value="EPUB & PDF">EPUB & PDF</SelectItem></SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField control={form.control} name="pdfFilename" render={({ field }) => ( 
                      <FormItem>
                          <FormLabel>Nombre Archivo PDF (Opcional)</FormLabel>
                          <FormControl><Input placeholder="libro-ejemplo.pdf" value={field.value || ''}/></FormControl>
                          <FormDescription>Si aplica, también se subirá al guardar.</FormDescription>
                          <FormMessage />
                      </FormItem>
                  )} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="categories" render={({ field }) => ( <FormItem><FormLabel>Categorías</FormLabel><FormControl><MultiSelect placeholder="Selecciona categorías..." options={bookCategories} value={field.value || []} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="tags" render={({ field }) => ( <FormItem><FormLabel>Etiquetas</FormLabel><FormControl><MultiSelect placeholder="Selecciona etiquetas..." options={bookTags} value={field.value || []} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                  
                  {isSubmitting && (
                    <div className="space-y-2">
                        <Label>Subiendo archivo...</Label>
                        <Progress value={uploadProgress} />
                    </div>
                  )}

                  <Button type="submit" disabled={isSubmitting || isParsing} className="w-full">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Guardando...' : 'Guardar y Subir Archivo'}
                  </Button>
                </form>
              </Form>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
