// src/app/(superadmin_dashboard)/superadmin/libraries/edit/[id]/page.tsx
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
import { Loader2, ArrowLeft, Save, ImagePlus, Share2, Cog, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { Library } from "@/types";
import { v4 as uuidv4 } from "uuid";

const isValidJson = (value: string | undefined): boolean => {
  if (!value) return true;
  try {
    JSON.parse(value);
  } catch (e) {
    return false;
  }
  return true;
};

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  city: z.string().min(2, { message: "La ciudad es requerida." }),
  province: z.string().min(2, { message: "La provincia es requerida." }),
  imageUrl: z.string().url({ message: "URL de Logo no válida." }).optional().or(z.literal('')),
  instagram: z.string().url({ message: "URL de Instagram no válida." }).optional().or(z.literal('')),
  facebook: z.string().url({ message: "URL de Facebook no válida." }).optional().or(z.literal('')),
  tiktok: z.string().url({ message: "URL de TikTok no válida." }).optional().or(z.literal('')),
  apiKey: z.string().optional(),
  importRules: z.string().optional().refine(isValidJson, { message: "El texto no es un JSON válido." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditLibraryProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const libraryId = params.id as string;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      description: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      imageUrl: "",
      instagram: "",
      facebook: "",
      tiktok: "",
      apiKey: "",
      importRules: "",
    },
  });

  useEffect(() => {
    if (!libraryId || !db) return;

    const fetchLibraryProfile = async () => {
      setIsLoading(true);
      try {
        const libraryRef = doc(db, "libraries", libraryId);
        const docSnap = await getDoc(libraryRef);

        if (docSnap.exists()) {
          const libraryData = { id: docSnap.id, ...docSnap.data() } as Library;
          const [city = '', province = ''] = (libraryData.location || '').split(', ').map(s => s.trim());
          
          form.reset({
            name: libraryData.name,
            description: libraryData.description || '',
            phone: libraryData.phone || '',
            address: libraryData.address || '',
            city,
            province,
            imageUrl: libraryData.imageUrl || '',
            instagram: libraryData.instagram || '',
            facebook: libraryData.facebook || '',
            tiktok: libraryData.tiktok || '',
            apiKey: libraryData.apiKey || '',
            importRules: libraryData.importRules ? JSON.stringify(JSON.parse(libraryData.importRules), null, 2) : '',
          });
        } else {
          toast({ title: "Error", description: "No se encontró el perfil de la librería.", variant: "destructive" });
        }
      } catch (error: any) {
        toast({ title: "Error al cargar el perfil", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibraryProfile();
  }, [libraryId, form, toast]);

  async function onSubmit(values: ProfileFormValues) {
    if (!db) return;
    setIsSubmitting(true);
    
    try {
      const libraryRef = doc(db, "libraries", libraryId);
      const updatedData = {
          name: values.name,
          description: values.description || '',
          phone: values.phone || '',
          address: values.address,
          location: `${values.city}, ${values.province}`,
          imageUrl: values.imageUrl,
          instagram: values.instagram || '',
          facebook: values.facebook || '',
          tiktok: values.tiktok || '',
          apiKey: values.apiKey || '',
          importRules: values.importRules || '',
      };

      await updateDoc(libraryRef, updatedData);
      
      toast({
          title: "Perfil Actualizado",
          description: "La información de tu librería ha sido guardada.",
      });
      router.push('/superadmin/libraries');

    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const generateNewApiKey = () => {
    form.setValue('apiKey', uuidv4());
    toast({ title: "Nueva Clave Generada", description: "No olvides guardar los cambios para aplicar la nueva clave." });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
       <div className="flex items-center mb-6">
        <Link href="/superadmin/libraries" className="mr-4">
          <Button variant="outline" size="icon" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="font-headline text-3xl font-bold text-primary">Editar Perfil de Librería</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre de la Librería</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Teléfono de Contacto</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )} />
                
                <h4 className="font-headline text-lg text-foreground border-b pb-2 pt-4">Ubicación</h4>
                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="province" render={({ field }) => ( <FormItem><FormLabel>Provincia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5"/>Redes Sociales y Logo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                 <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem><FormLabel>URL del Logo</FormLabel><FormControl><Input type="url" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="instagram" render={({ field }) => ( <FormItem><FormLabel>URL de Instagram</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="facebook" render={({ field }) => ( <FormItem><FormLabel>URL de Facebook</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="tiktok" render={({ field }) => ( <FormItem><FormLabel>URL de TikTok</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Cog className="h-5 w-5"/>Configuración Avanzada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Clave de API (API Key)</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input {...field} readOnly value={field.value ?? ''} />
                                    </FormControl>
                                    <Button type="button" variant="outline" onClick={generateNewApiKey}>
                                       <RefreshCw className="mr-2 h-4 w-4"/> Generar Nueva Clave
                                    </Button>
                                </div>
                                <FormDescription>Esta clave es secreta y se usa para la integración de puntos en tienda física.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="importRules"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reglas de Importación CSV (JSON)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        value={field.value ?? ''}
                                        rows={8}
                                        className="font-mono text-xs"
                                    />
                                </FormControl>
                                <FormDescription>Define reglas en formato JSON para filtrar los libros durante la importación masiva.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </form>
      </Form>
    </div>
  );
}
