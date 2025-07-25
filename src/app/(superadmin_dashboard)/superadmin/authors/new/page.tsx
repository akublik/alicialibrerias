// src/app/(superadmin_dashboard)/superadmin/authors/new/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { countryOptions } from "@/lib/options";
import { slugify } from "@/lib/utils";

const authorFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre es requerido." }),
  bio: z.string().min(10, { message: "La biografía debe tener al menos 10 caracteres." }),
  imageUrl: z.string().url("Debe ser una URL de imagen válida.").optional().or(z.literal('')),
  dataAiHint: z.string().optional(),
  countries: z.array(z.string()).min(1, "Debes seleccionar al menos un país."),
});

type AuthorFormValues = z.infer<typeof authorFormSchema>;

export default function NewAuthorPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      imageUrl: "",
      dataAiHint: "",
      countries: [],
    },
  });

  async function onSubmit(values: AuthorFormValues) {
    if (!db) {
      toast({ title: "Error de conexión", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "authors"), {
        ...values,
        slug: slugify(values.name),
        imageUrl: values.imageUrl || `https://placehold.co/200x200.png?text=${encodeURIComponent(values.name[0])}`,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Autor Creado", description: `El perfil de ${values.name} ha sido creado.` });
      router.push("/superadmin/authors");
    } catch (error: any) {
      toast({ title: "Error al crear autor", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/superadmin/authors" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Añadir Nuevo Autor</h1>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Información del Autor</CardTitle>
          <CardDescription>
            Rellena la información para crear un nuevo perfil de autor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Biografía</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>URL de la Foto</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="dataAiHint" render={({ field }) => ( <FormItem><FormLabel>Pista IA (1-2 palabras)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="countries" render={({ field }) => ( <FormItem><FormLabel>Visibilidad por País</FormLabel><FormControl><MultiSelect placeholder="Selecciona países..." options={countryOptions} value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )} />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Crear Autor
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
