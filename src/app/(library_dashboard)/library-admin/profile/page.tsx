// src/app/(library_dashboard)/library-admin/profile/page.tsx
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
import { Loader2, Store, Save, ImagePlus } from "lucide-react";
import Image from 'next/image';
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import type { Library } from "@/types";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  city: z.string().min(2, { message: "La ciudad es requerida." }),
  province: z.string().min(2, { message: "La provincia es requerida." }),
  logoImage: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function LibraryProfilePage() {
  const [library, setLibrary] = useState<Library | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      description: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      logoImage: undefined,
    },
  });

  useEffect(() => {
    if (!db) return;

    const fetchLibraryProfile = async () => {
      setIsLoading(true);
      const userDataString = localStorage.getItem("aliciaLibros_user");
      if (!userDataString) {
        toast({ title: "Error", description: "No se encontró el usuario.", variant: "destructive" });
        router.push("/library-login");
        return;
      }
      const userData = JSON.parse(userDataString);
      const libraryId = userData.libraryId;

      if (!libraryId) {
        toast({ title: "Error", description: "Esta cuenta no está asociada a una librería.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      try {
        const libraryRef = doc(db, "libraries", libraryId);
        const docSnap = await getDoc(libraryRef);

        if (docSnap.exists()) {
          const libraryData = { id: docSnap.id, ...docSnap.data() } as Library;
          setLibrary(libraryData);
          const [city = '', province = ''] = (libraryData.location || '').split(', ').map(s => s.trim());
          
          form.reset({
            name: libraryData.name,
            description: libraryData.description || '',
            phone: libraryData.phone || '',
            address: libraryData.address || '',
            city,
            province,
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
  }, [form, router, toast]);

  async function onSubmit(values: ProfileFormValues) {
    if (!library || !db || !storage) return;

    setIsSubmitting(true);
    
    try {
      let imageUrl = library.imageUrl; // Keep existing image URL by default
      const imageFile = values.logoImage?.[0];

      if (imageFile) {
        const imageRef = ref(storage, `library-logos/${library.id}/${uuidv4()}-${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const libraryRef = doc(db, "libraries", library.id);
      const updatedData = {
          name: values.name,
          description: values.description || '',
          phone: values.phone || '',
          address: values.address,
          location: `${values.city}, ${values.province}`,
          imageUrl,
      };

      await updateDoc(libraryRef, updatedData);
      
      const oldLibraryData = JSON.parse(localStorage.getItem("aliciaLibros_registeredLibrary") || "{}");
      localStorage.setItem("aliciaLibros_registeredLibrary", JSON.stringify({
          ...oldLibraryData,
          id: library.id,
          name: values.name,
          imageUrl: imageUrl,
      }));

      toast({
          title: "Perfil Actualizado",
          description: "La información de tu librería ha sido guardada.",
      });
      // Optionally trigger a re-render or reload if the layout needs to update
      router.refresh(); 

    } catch (error: any) {
      console.error("Error al actualizar el perfil:", error);
      toast({
          title: "Error al Guardar",
          description: `No se pudo actualizar el perfil. Error: ${error.message}`,
          variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!library) {
     return <p>No se pudo cargar el perfil de la librería.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-8">
        <Store className="mr-3 h-8 w-8 text-primary"/>
        <div>
           <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">Perfil de la Librería</h1>
           <p className="text-lg text-foreground/80">Actualiza la información pública de tu librería.</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre de la Librería</FormLabel><FormControl><Input placeholder="El Gato Lector" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea placeholder="Una breve descripción de tu librería..." {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Teléfono de Contacto</FormLabel><FormControl><Input type="tel" placeholder="02-255-5888" {...field} /></FormControl><FormMessage /></FormItem> )} />
              
              <h4 className="font-headline text-lg text-foreground border-b pb-2 pt-4">Ubicación</h4>
              <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Dirección (Calle Principal, Número, Secundaria)</FormLabel><FormControl><Input placeholder="Av. Amazonas N34-451 y Juan Pablo Sanz" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input placeholder="Quito" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="province" render={({ field }) => ( <FormItem><FormLabel>Provincia</FormLabel><FormControl><Input placeholder="Pichincha" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ImagePlus/>Logo de la Librería</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                        <Image
                            src={library.imageUrl || 'https://placehold.co/400x400.png'}
                            alt={`Logo actual de ${library.name}`}
                            layout="fill"
                            objectFit="cover"
                        />
                    </div>
                    <FormField
                      control={form.control}
                      name="logoImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subir nuevo logo</FormLabel>
                          <FormControl>
                            <Input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => field.onChange(e.target.files)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
            </Card>

            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
