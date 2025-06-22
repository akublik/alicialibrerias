// src/components/auth_library/LibraryLoginForm.tsx
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, LogIn, Store, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import type { User, Library } from "@/types";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export function LibraryLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      // 1. Query the 'users' collection
      const usersRef = collection(db, "users");
      const q = query(usersRef, 
        where("email", "==", values.email), 
        where("password", "==", values.password),
        where("role", "in", ["library", "superadmin"])
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Error de Inicio de Sesión",
          description: "Credenciales de administrador incorrectas o la cuenta no es de tipo librería.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      } 
      
      const userDoc = querySnapshot.docs[0];
      const userData = { id: userDoc.id, ...userDoc.data() } as User;

      if (userData.isActive === false) {
         toast({
          title: "Cuenta Desactivada",
          description: "La cuenta de este administrador ha sido desactivada.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (userData.role === 'superadmin') {
         localStorage.setItem("isAuthenticated", "true");
         localStorage.setItem("aliciaLibros_user", JSON.stringify(userData));
         toast({ title: "Acceso de Superadmin", description: `Bienvenido, ${userData.name}.` });
         router.push("/superadmin/dashboard");
         return;
      }

      if (!userData.libraryId) {
         toast({
          title: "Error de Cuenta",
          description: "Esta cuenta de librería no está asociada a ningún registro de librería.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // 2. Fetch the associated library document
      const libraryDocRef = doc(db, "libraries", userData.libraryId);
      const libraryDocSnap = await getDoc(libraryDocRef);

      if (!libraryDocSnap.exists()) {
         toast({
          title: "Error de Datos",
          description: `No se pudo encontrar la librería asociada (ID: ${userData.libraryId}).`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const libraryData = libraryDocSnap.data() as Library;

      if (libraryData.isActive === false) {
        toast({
          title: "Librería Desactivada",
          description: "Esta librería ha sido desactivada por un administrador.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // 3. Set localStorage and navigate
      localStorage.setItem("isLibraryAdminAuthenticated", "true");
      localStorage.setItem("aliciaLibros_user", JSON.stringify(userData));
      localStorage.setItem("aliciaLibros_registeredLibrary", JSON.stringify({ id: libraryDocSnap.id, name: libraryData.name, imageUrl: libraryData.imageUrl }));
      
      toast({
        title: "Inicio de Sesión Exitoso",
        description: `Bienvenido al panel de ${libraryData.name}.`,
      });
      router.push("/library-admin/dashboard");

    } catch (error) {
       console.error("Error al iniciar sesión de librería:", error);
       toast({
        title: "Error de Inicio de Sesión",
        description: "Hubo un problema al intentar iniciar sesión. Revisa la consola para más detalles.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl animate-fadeIn">
      <CardHeader className="text-center">
        <Store className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="font-headline text-3xl text-primary">Acceso Librerías</CardTitle>
        <CardDescription>Ingresa a la plataforma para administrar tu librería.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Administrador</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@tulibreria.com" {...field} className="text-base md:text-sm"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="********" 
                        {...field} 
                        className="text-base md:text-sm pr-10"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-body text-base" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Ingresar
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm">
        <Link href="/library-register" className="font-medium text-primary hover:underline">
          ¿No tienes una cuenta? Registra tu librería
        </Link>
        <Link href="/library-forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </CardFooter>
    </Card>
  );
}
