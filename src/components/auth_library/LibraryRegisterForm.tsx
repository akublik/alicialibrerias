
// src/components/auth_library/LibraryRegisterForm.tsx
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, UserPlus, Store, Loader2, Building, ImagePlus, Share2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

const libraryRegisterFormSchema = z.object({
  adminName: z.string().min(2, { message: "El nombre del administrador debe tener al menos 2 caracteres." }),
  adminEmail: z.string().email({ message: "Por favor ingresa un email válido para el administrador." }),
  adminPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La confirmación de contraseña debe tener al menos 6 caracteres." }),
  libraryName: z.string().min(2, { message: "El nombre de la librería debe tener al menos 2 caracteres." }),
  libraryAddress: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  libraryCity: z.string().min(2, { message: "La ciudad debe tener al menos 2 caracteres." }),
  libraryProvince: z.string().min(2, { message: "La provincia debe tener al menos 2 caracteres." }),
  libraryCountry: z.string().default("Ecuador"),
  libraryPostalCode: z.string().optional(),
  libraryPhone: z.string().optional(),
  libraryDescription: z.string().optional(),
  libraryImageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  instagram: z.string().url({ message: "URL de Instagram no válida." }).optional().or(z.literal('')),
  facebook: z.string().url({ message: "URL de Facebook no válida." }).optional().or(z.literal('')),
  tiktok: z.string().url({ message: "URL de TikTok no válida." }).optional().or(z.literal('')),
}).refine(data => data.adminPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type LibraryRegisterFormValues = z.infer<typeof libraryRegisterFormSchema>;

export function LibraryRegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LibraryRegisterFormValues>({
    resolver: zodResolver(libraryRegisterFormSchema),
    defaultValues: {
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      confirmPassword: "",
      libraryName: "",
      libraryAddress: "",
      libraryCity: "",
      libraryProvince: "",
      libraryCountry: "Ecuador",
      libraryPostalCode: "",
      libraryPhone: "",
      libraryDescription: "",
      libraryImageUrl: "",
      instagram: "",
      facebook: "",
      tiktok: "",
    },
  });

  async function onSubmit(values: LibraryRegisterFormValues) {
    setIsLoading(true);
    
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", values.adminEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({
          title: "Error de Registro",
          description: "Ya existe un usuario con este correo electrónico.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const imageUrl = values.libraryImageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(values.libraryName)}`;
      const dataAiHint = "library exterior";

      const newLibraryData = {
        name: values.libraryName,
        address: values.libraryAddress,
        location: `${values.libraryCity}, ${values.libraryProvince}`,
        imageUrl,
        dataAiHint,
        description: values.libraryDescription || "Una nueva y emocionante librería.",
        phone: values.libraryPhone || "",
        email: values.adminEmail,
        instagram: values.instagram || "",
        facebook: values.facebook || "",
        tiktok: values.tiktok || "",
        createdAt: serverTimestamp(),
      };
      const libraryDocRef = await addDoc(collection(db, "libraries"), newLibraryData);

      const newUserData = {
        name: values.adminName,
        email: values.adminEmail,
        password: values.adminPassword,
        role: "library" as const,
        libraryId: libraryDocRef.id,
        createdAt: serverTimestamp(),
      };
      const userDocRef = await addDoc(collection(db, "users"), newUserData);

      localStorage.setItem("isLibraryAdminAuthenticated", "true");
      localStorage.setItem("aliciaLibros_user", JSON.stringify({
          id: userDocRef.id,
          name: newUserData.name,
          email: newUserData.email,
          role: 'library',
          libraryId: newUserData.libraryId,
      }));
      localStorage.setItem("aliciaLibros_registeredLibrary", JSON.stringify({
          id: libraryDocRef.id,
          name: newLibraryData.name,
          imageUrl: newLibraryData.imageUrl,
          location: newLibraryData.location,
          address: newLibraryData.address,
          phone: newLibraryData.phone,
          email: newLibraryData.email,
          description: newLibraryData.description,
          dataAiHint: newLibraryData.dataAiHint,
      }));

      toast({
        title: "¡Registro Exitoso!",
        description: `Tu librería ${values.libraryName} ha sido registrada correctamente.`,
      });
      
      router.push("/library-admin/dashboard");

    } catch (error: any) {
      toast({
        title: "Error de Registro",
        description: `No se pudo completar el registro. Motivo: ${error.message}.`,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-2xl animate-fadeIn my-8">
      <CardHeader className="text-center">
        <Building className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="font-headline text-3xl text-primary">Registra tu Librería</CardTitle>
        <CardDescription>Únete a la red de Alicia Libros y llega a más lectores.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="font-headline text-lg text-foreground border-b pb-2 mb-4">Información del Administrador</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="adminName" render={({ field }) => ( <FormItem> <FormLabel>Nombre Completo del Admin.</FormLabel> <FormControl><Input placeholder="Ej: Ana Dueña" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="adminEmail" render={({ field }) => ( <FormItem> <FormLabel>Email del Admin.</FormLabel> <FormControl><Input type="email" placeholder="admin@tulibreria.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="adminPassword" render={({ field }) => ( <FormItem> <FormLabel>Contraseña</FormLabel> <FormControl><div className="relative"><Input type={showPassword ? "text" : "password"} placeholder="Crea una contraseña" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirmar Contraseña</FormLabel> <FormControl><div className="relative"><Input type={showConfirmPassword ? "text" : "password"} placeholder="Repite la contraseña" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff /> : <Eye />}</Button></div></FormControl> <FormMessage /> </FormItem> )} />
            </div>

            <h3 className="font-headline text-lg text-foreground border-b pb-2 pt-4 mb-4">Información de la Librería</h3>
            <FormField control={form.control} name="libraryName" render={({ field }) => ( <FormItem> <FormLabel>Nombre de la Librería</FormLabel> <FormControl><Input placeholder="Ej: El Gato Lector" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            
            <FormField
              control={form.control}
              name="libraryImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><ImagePlus className="mr-2 h-4 w-4 text-muted-foreground"/>Logo de la Librería (URL Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://ejemplo.com/logo.png"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField control={form.control} name="libraryAddress" render={({ field }) => ( <FormItem> <FormLabel>Dirección (Calle Principal, Número, Secundaria)</FormLabel> <FormControl><Input placeholder="Ej: Av. Amazonas N34-451 y Juan Pablo Sanz" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="libraryCity" render={({ field }) => ( <FormItem> <FormLabel>Ciudad</FormLabel> <FormControl><Input placeholder="Ej: Quito" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="libraryProvince" render={({ field }) => ( <FormItem> <FormLabel>Provincia</FormLabel> <FormControl><Input placeholder="Ej: Pichincha" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="libraryCountry" render={({ field }) => ( <FormItem> <FormLabel>País</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="libraryPostalCode" render={({ field }) => ( <FormItem> <FormLabel>Código Postal (Opcional)</FormLabel> <FormControl><Input placeholder="Ej: 170101" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </div>
            <FormField control={form.control} name="libraryPhone" render={({ field }) => ( <FormItem> <FormLabel>Teléfono de la Librería (Opcional)</FormLabel> <FormControl><Input type="tel" placeholder="Ej: 022555888" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="libraryDescription" render={({ field }) => ( <FormItem> <FormLabel>Descripción Breve (Opcional)</FormLabel> <FormControl><Textarea placeholder="Un rincón acogedor para los amantes de la lectura..." {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            
            <h3 className="font-headline text-lg text-foreground border-b pb-2 pt-4 mb-4 flex items-center gap-2"><Share2 className="h-5 w-5"/>Redes Sociales (Opcional)</h3>
            <FormField control={form.control} name="instagram" render={({ field }) => ( <FormItem> <FormLabel>URL de Instagram</FormLabel> <FormControl><Input placeholder="https://instagram.com/tulibreria" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="facebook" render={({ field }) => ( <FormItem> <FormLabel>URL de Facebook</FormLabel> <FormControl><Input placeholder="https://facebook.com/tulibreria" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="tiktok" render={({ field }) => ( <FormItem> <FormLabel>URL de TikTok</FormLabel> <FormControl><Input placeholder="https://tiktok.com/@tulibreria" {...field} /></FormControl> <FormMessage /> </FormItem> )} />

            <Button type="submit" className="w-full font-body text-base" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Registrar Librería
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p className="text-muted-foreground">
          ¿Ya tienes una cuenta para tu librería?{' '}
          <Link href="/library-login" className="font-medium text-primary hover:underline">
            Ingresa aquí
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
