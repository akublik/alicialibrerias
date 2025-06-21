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
import { Loader2, Store, Save, ImagePlus, AlertTriangle, ExternalLink, Share2 } from "lucide-react";
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
  instagram: z.string().url({ message: "URL de Instagram no válida." }).optional().or(z.literal('')),
  facebook: z.string().url({ message: "URL de Facebook no válida." }).optional().or(z.literal('')),
  tiktok: z.string().url({ message: "URL de TikTok no válida." }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        clearTimeout(timeoutId);
      });
  });
}

export default function LibraryProfilePage() {
  const [library, setLibrary] = useState<Library | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageTestResult, setStorageTestResult] = useState<string | null>(null);
  const [isTestingStorage, setIsTestingStorage] = useState(false);
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
      instagram: "",
      facebook: "",
      tiktok: "",
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
            instagram: libraryData.instagram || '',
            facebook: libraryData.facebook || '',
            tiktok: libraryData.tiktok || '',
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

  const testStorageConnection = async () => {
    if (!storage || !library) {
        toast({ title: "Error", description: "Storage o librería no disponibles para la prueba.", variant: "destructive"});
        return;
    }
    setIsTestingStorage(true);
    setStorageTestResult(null);

    const testRef = ref(storage, `test-uploads/${library.id}/test-connection.txt`);
    const testBlob = new Blob(["test"], { type: "text/plain" });

    try {
        await withTimeout(uploadBytes(testRef, testBlob), 10000, "La subida de prueba tardó demasiado. Esto puede ser un problema de CORS o de reglas de seguridad muy lentas.");
        const successMsg = "¡Conexión de Storage exitosa! Se pudo subir un archivo de prueba. Si las subidas aún fallan, verifica que el tamaño del archivo no exceda los límites y que la ruta `library-logos/` sea correcta en tus reglas.";
        setStorageTestResult(successMsg);
        toast({ title: "Prueba de Storage Exitosa", description: "La conexión con Firebase Storage funciona."});
    } catch (error: any) {
        let errorMessage = `Falló la subida de prueba a Storage. Error: ${error.message}.`;
        if (error.code === 'storage/unauthorized' || error.message.includes('permission-denied')) {
            errorMessage = "¡Permiso Denegado! Revisa tus reglas de seguridad de Firebase Storage. Deben permitir la escritura en la ruta `library-logos/` para el usuario autenticado. Error completo: " + error.message;
        } else if (error.code === 'storage/canceled' || error.message.includes('CORS')) {
            errorMessage = "¡Error de CORS! El servidor de Storage rechazó la solicitud. Debes configurar CORS en tu bucket de Google Cloud Storage para permitir solicitudes desde el dominio de tu aplicación. Error completo: " + error.message;
        }
        setStorageTestResult(errorMessage);
        toast({ title: "Error de Conexión a Storage", description: errorMessage, variant: "destructive", duration: 15000 });
    } finally {
        setIsTestingStorage(false);
    }
  };


  async function onSubmit(values: ProfileFormValues) {
    if (!library || !db || !storage) return;

    setIsSubmitting(true);
    
    try {
      let imageUrl = library.imageUrl; // Keep existing image URL by default
      const imageFile = values.logoImage?.[0];

      if (imageFile) {
        const imageRef = ref(storage, `library-logos/${library.id}/${uuidv4()}-${imageFile.name}`);
        const uploadPromise = uploadBytes(imageRef, imageFile);
        await withTimeout(uploadPromise, 15000, "La subida de la imagen tardó demasiado. Verifica tu conexión y las reglas de almacenamiento de Firebase.");
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
          instagram: values.instagram || '',
          facebook: values.facebook || '',
          tiktok: values.tiktok || '',
      };

      const updatePromise = updateDoc(libraryRef, updatedData);
      await withTimeout(updatePromise, 8000, "La actualización de la base de datos tardó demasiado. Verifica tus reglas de seguridad de Firestore.");
      
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
      // Force a re-render of the layout by navigating to the same page
      router.push('/library-admin/dashboard');
      setTimeout(() => router.push('/library-admin/profile'), 50);


    } catch (error: any) {
      console.error("Error al actualizar el perfil:", error);
      let description = `No se pudo actualizar el perfil. Error: ${error.message}`;
      if (error.code === 'permission-denied') {
        description = "Permiso denegado. Revisa tus reglas de seguridad de Firestore para permitir la actualización de la colección 'libraries'.";
      }
      toast({
          title: "Error al Guardar",
          description: description,
          variant: "destructive",
          duration: 10000,
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
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg">
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

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5"/>Redes Sociales</CardTitle>
                <CardDescription>Añade los enlaces a tus perfiles sociales para que los clientes puedan encontrarte.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="instagram" render={({ field }) => ( <FormItem><FormLabel>URL de Instagram</FormLabel><FormControl><Input placeholder="https://instagram.com/tulibreria" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="facebook" render={({ field }) => ( <FormItem><FormLabel>URL de Facebook</FormLabel><FormControl><Input placeholder="https://facebook.com/tulibreria" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="tiktok" render={({ field }) => ( <FormItem><FormLabel>URL de TikTok</FormLabel><FormControl><Input placeholder="https://tiktok.com/@tulibreria" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
              </CardContent>
            </Card>
            
            <Card className="shadow-lg bg-yellow-50 border-yellow-300">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <AlertTriangle className="w-10 h-10 text-yellow-600 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg font-headline text-yellow-800">Diagnóstico de Subida de Imagen</CardTitle>
                  <CardDescription className="text-yellow-700 text-xs">
                    Si el formulario se queda "Guardando..." al subir una imagen, el problema suele ser la configuración de Firebase Storage (Reglas o CORS). Usa este botón para diagnosticar.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                  <Button type="button" variant="outline" className="w-full bg-white" onClick={testStorageConnection} disabled={isTestingStorage}>
                      {isTestingStorage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Probar Subida a Firebase Storage
                  </Button>
                  {storageTestResult && (
                      <div className={`mt-4 text-sm p-3 rounded-md whitespace-pre-wrap ${storageTestResult.toLowerCase().includes('exitosa') ? 'bg-green-100 text-green-900 border border-green-200' : 'bg-red-100 text-red-900 border border-red-200'}`}>
                          <p className="font-bold">{storageTestResult.toLowerCase().includes('exitosa') ? 'Resultado: Éxito' : 'Resultado: Error'}</p>
                          <p>{storageTestResult}</p>
                          {!storageTestResult.toLowerCase().includes('exitosa') && (
                            <div className="mt-2 flex flex-col space-y-1">
                              <a href="https://firebase.google.com/docs/storage/web/secure-files?hl=es-419" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center font-semibold">
                                Ver docs de Reglas de Storage <ExternalLink className="ml-1 h-4 w-4"/>
                              </a>
                              <a href="https://firebase.google.com/docs/storage/web/cors?hl=es-419" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center font-semibold">
                                Ver docs de Configuración CORS <ExternalLink className="ml-1 h-4 w-4"/>
                              </a>
                            </div>
                          )}
                      </div>
                  )}
              </CardContent>
            </Card>
          </div>

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
