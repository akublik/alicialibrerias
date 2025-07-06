// src/app/(superadmin_dashboard)/superadmin/promotions/new/page.tsx
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
import { Card, CardContent, CardDescription as PageCardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';

const promotionFormSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  description: z.string().optional(),
  type: z.enum(['multiplier', 'bonus'], { required_error: "Debes seleccionar un tipo." }),
  value: z.coerce.number().positive("El valor debe ser un número positivo."),
  targetType: z.enum(['global', 'category', 'author', 'book'], { required_error: "Debes seleccionar un objetivo." }),
  targetValue: z.string().optional(),
  startDate: z.date({ required_error: "La fecha de inicio es requerida." }),
  endDate: z.date({ required_error: "La fecha de fin es requerida." }),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
}).refine(data => data.endDate >= data.startDate, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio.",
  path: ["endDate"],
}).refine(data => {
  if (data.targetType !== 'global' && (!data.targetValue || data.targetValue.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "El valor del objetivo es requerido para este tipo.",
  path: ["targetValue"],
});

type PromotionFormValues = z.infer<typeof promotionFormSchema>;

export default function NewPromotionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: undefined,
      value: undefined,
      targetType: undefined,
      targetValue: "",
      isActive: true,
      imageUrl: "",
    },
  });

  const targetType = form.watch("targetType");

  async function onSubmit(values: PromotionFormValues) {
    if (!db) {
      toast({ title: "Error de conexión", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    try {
      const imageUrl = values.imageUrl || `https://placehold.co/600x300.png?text=${encodeURIComponent(values.name)}`;
      const dataAiHint = "promotion marketing";
      
      await addDoc(collection(db, "promotions"), {
        ...values,
        imageUrl,
        dataAiHint,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Promoción Creada", description: `La promoción "${values.name}" ha sido creada.` });
      router.push("/superadmin/promotions");
    } catch (error: any) {
      toast({ title: "Error al crear", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/superadmin/promotions" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Crear Nueva Promoción</h1>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Detalles de la Promoción</CardTitle>
          <PageCardDescription>Rellena la información para crear una nueva promoción.</PageCardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Ej: Semana del Libro" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción (Opcional)</FormLabel><FormControl><Textarea {...field} placeholder="Breve descripción de la promoción." /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>URL de Imagen (Opcional)</FormLabel><FormControl><Input type="url" placeholder="https://ejemplo.com/promo.png" {...field} /></FormControl><FormMessage /></FormItem> )} />
              
              <div className="grid sm:grid-cols-2 gap-6">
                <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Tipo de Promoción</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="multiplier">Multiplicador (ej. 2x)</SelectItem><SelectItem value="bonus">Bono (ej. +50 pts)</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="value" render={({ field }) => ( <FormItem><FormLabel>Valor</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} placeholder="Ej: 2 o 50" /></FormControl><FormMessage /></FormItem> )} />
              </div>

              <FormField control={form.control} name="targetType" render={({ field }) => ( <FormItem><FormLabel>Objetivo de la Promoción</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un objetivo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="global">Global (Toda la tienda)</SelectItem><SelectItem value="category">Categoría específica</SelectItem><SelectItem value="author">Autor específico</SelectItem><SelectItem value="book">Libro específico</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />

              {targetType && targetType !== 'global' && (
                <FormField control={form.control} name="targetValue" render={({ field }) => ( <FormItem><FormLabel>Valor del Objetivo</FormLabel><FormControl><Input {...field} placeholder={targetType === 'book' ? 'ID del libro' : 'Nombre de categoría/autor'} /></FormControl><FormDescription>Debe ser el nombre exacto de la categoría o autor.</FormDescription><FormMessage /></FormItem> )} />
              )}
              
              <div className="grid sm:grid-cols-2 gap-6">
                 <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha de Inicio</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha de Fin</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              </div>

              <FormField control={form.control} name="isActive" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Activar Promoción</FormLabel><FormDescription>Si está inactiva, no se aplicará a ninguna compra.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/>

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Crear Promoción
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
