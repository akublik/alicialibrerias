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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, BookPlus, FileUp, ImagePlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const bookFormSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }),
  authors: z.string().min(3, { message: "Debe haber al menos un autor." }),
  isbn: z.string().optional(),
  price: z.coerce.number().positive({ message: "El precio debe ser un número positivo." }),
  stock: z.coerce.number().int().min(0, { message: "El stock no puede ser negativo." }),
  description: z.string().optional(),
  categories: z.string().optional(),
  tags: z.string().optional(),
  coverImage: z.any().optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export default function NewBookPage() {
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
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
      categories: "",
      tags: "",
      coverImage: undefined,
    },
  });

  async function onManualSubmit(values: BookFormValues) {
    setIsSubmittingManual(true);
    console.log("Manual Book Submission:", values);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Libro Añadido",
      description: `El libro "${values.title}" ha sido añadido a tu inventario.`,
    });
    
    router.push("/library-admin/books");
    setIsSubmittingManual(false);
  }

  async function onFileImport() {
    if (!importFile) {
        toast({ title: "No hay archivo", description: "Por favor, selecciona un archivo para importar.", variant: "destructive" });
        return;
    }
    setIsSubmittingFile(true);
    console.log("Importing file:", importFile.name);

    await new Promise(resolve => setTimeout(resolve, 2500));

    toast({
      title: "Importación Iniciada",
      description: `El archivo "${importFile.name}" se está procesando.`,
    });
    
    router.push("/library-admin/books");
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
                    <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Precio</FormLabel><FormControl><Input type="number" step="0.01" placeholder="15.99" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="stock" render={({ field }) => ( <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 </div>

                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Una breve sinopsis del libro..." {...field} /></FormControl><FormMessage /></FormItem> )} />

                <div className="grid sm:grid-cols-2 gap-4">
                   <FormField control={form.control} name="categories" render={({ field }) => ( <FormItem><FormLabel>Categorías (separadas por coma)</FormLabel><FormControl><Input placeholder="Realismo Mágico, Novela" {...field} /></FormControl><FormMessage /></FormItem> )} />
                   <FormField control={form.control} name="tags" render={({ field }) => ( <FormItem><FormLabel>Etiquetas (separadas por coma)</FormLabel><FormControl><Input placeholder="Clásico, Colombia, Saga" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                
                 <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><ImagePlus className="mr-2 h-4 w-4"/>Imagen de Portada</FormLabel>
                      <FormControl>
                        <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                        />
                      </FormControl>
                      <FormMessage />
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
            <FormItem>
                <FormLabel>Seleccionar archivo</FormLabel>
                <FormControl>
                    <Input 
                        id="file-upload" 
                        type="file" 
                        onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                        disabled={isSubmittingFile || isSubmittingManual}
                    />
                </FormControl>
                {importFile && <p className="text-sm text-muted-foreground mt-2">Archivo seleccionado: {importFile.name}</p>}
            </FormItem>
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
