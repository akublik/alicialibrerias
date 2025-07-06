// src/app/(superadmin_dashboard)/superadmin/redemption-store/new/page.tsx
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
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const itemFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  description: z.string().min(10, "La descripción es requerida."),
  pointsRequired: z.coerce.number().int().positive("Los puntos deben ser un número positivo."),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo."),
  type: z.enum(['Libro', 'Gift Card', 'Servicio', 'Otro'], { required_error: "Debes seleccionar un tipo." }),
  imageUrl: z.string().url("URL de imagen no válida.").optional().or(z.literal('')),
  dataAiHint: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

export default function NewRedemptionItemPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: { name: "", description: "", pointsRequired: undefined, stock: undefined, type: undefined, imageUrl: "", dataAiHint: "", isActive: true },
  });

  async function onSubmit(values: ItemFormValues) {
    if (!db) {
      toast({ title: "Error de conexión", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    try {
      const imageUrl = values.imageUrl || `https://placehold.co/400x400.png?text=${encodeURIComponent(values.name)}`;
      const dataAiHint = values.dataAiHint || 'product image';

      await addDoc(collection(db, "redemptionItems"), {
        ...values,
        imageUrl,
        dataAiHint,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Artículo Creado", description: `El artículo "${values.name}" ha sido añadido a la tienda.` });
      router.push("/superadmin/redemption-store");
    } catch (error: any) {
      toast({ title: "Error al crear", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/superadmin/redemption-store" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Añadir Artículo de Canje</h1>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Información del Artículo</CardTitle>
          <CardDescription>Rellena la información para crear un nuevo artículo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre del Artículo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem> )} />
              <div className="grid sm:grid-cols-2 gap-6">
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Libro">Libro</SelectItem><SelectItem value="Gift Card">Gift Card</SelectItem><SelectItem value="Servicio">Servicio</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="pointsRequired" render={({ field }) => ( <FormItem><FormLabel>Puntos Requeridos</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              </div>
               <div className="grid sm:grid-cols-2 gap-6">
                <FormField control={form.control} name="stock" render={({ field }) => ( <FormItem><FormLabel>Stock Disponible</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>URL de Imagen</FormLabel><FormControl><Input type="url" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField control={form.control} name="dataAiHint" render={({ field }) => ( <FormItem><FormLabel>Pista IA (1-2 palabras)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="isActive" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Artículo Activo</FormLabel><FormDescription>Permite que este artículo sea visible en la tienda.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Crear Artículo
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
