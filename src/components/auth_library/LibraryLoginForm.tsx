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
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import type { User, Library } from "@/types";
import { signInWithEmailAndPassword } from "firebase/auth";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

interface LibraryLoginFormProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  hideFooterLinks?: boolean;
  expectedRole: 'library' | 'superadmin';
}

export function LibraryLoginForm({ title, description, icon, hideFooterLinks, expectedRole }: LibraryLoginFormProps) {
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
    
    if (!auth || !db) {
        toast({ title: "Error de configuración", description: "La autenticación no está disponible.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await auth.signOut();
        toast({ title: "Error de Cuenta", description: "No se encontró un registro de datos para este usuario.", variant: "destructive" });
        setIsLoading(false);
        return;
      } 
      
      const userData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
      const userRole = userData.role || (userData as any).rol;

      if (userRole !== expectedRole) {
        await auth.signOut();
        toast({
          title: "Acceso Incorrecto",
          description: `Esta cuenta no tiene el rol de '${expectedRole}'. Por favor, usa el portal de acceso correcto.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (userData.isActive === false) {
         await auth.signOut();
         toast({ title: "Cuenta Desactivada", description: "La cuenta de este administrador ha sido desactivada.", variant: "destructive" });
         setIsLoading(false);
         return;
      }

      // Handle login based on the now-verified role
      if (userData.role === 'superadmin') {
         localStorage.setItem("isAuthenticated", "true");
         localStorage.setItem("aliciaLibros_user", JSON.stringify(userData));
         toast({ title: "Acceso de Superadmin", description: `Bienvenido, ${userData.name}.` });
         router.push("/superadmin/dashboard");
         return;
      }

      if (userData.role === 'library') {
          if (!userData.libraryId) {
             await auth.signOut();
             toast({ title: "Error de Cuenta", description: "Esta cuenta de librería no está asociada a ningún registro de librería.", variant: "destructive" });
             setIsLoading(false);
             return;
          }

          const libraryDocRef = doc(db, "libraries", userData.libraryId);
          const libraryDocSnap = await getDoc(libraryDocRef);

          if (!libraryDocSnap.exists()) {
             await auth.signOut();
             toast({ title: "Error de Datos", description: `No se pudo encontrar la librería asociada (ID: ${userData.libraryId}).`, variant: "destructive" });
             setIsLoading(false);
             return;
          }

          const libraryDataForStorage = { id: libraryDocSnap.id, ...libraryDocSnap.data() } as Library;

          if (libraryDataForStorage.isActive === false) {
            await auth.signOut();
            toast({ title: "Librería Desactivada", description: "Esta librería ha sido desactivada por un administrador.", variant: "destructive" });
            setIsLoading(false);
            return;
          }
          
          localStorage.setItem("isLibraryAdminAuthenticated", "true");
          localStorage.setItem("aliciaLibros_user", JSON.stringify(userData));
          localStorage.setItem("aliciaLibros_registeredLibrary", JSON.stringify(libraryDataForStorage));
          
          toast({ title: "Inicio de Sesión Exitoso", description: `Bienvenido al panel de ${libraryDataForStorage.name}.` });
          router.push("/library-admin/dashboard");
      }

    } catch (error: any) {
      let description = "Hubo un problema al intentar iniciar sesión.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Email o contraseña incorrectos.";
      }
      console.error("Firebase Auth Error:", error.code, error.message);
      toast({ title: "Error de Inicio de Sesión", description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl animate-fadeIn">
      <CardHeader className="text-center">
        {icon || <Store className="mx-auto h-12 w-12 text-primary mb-4" />}
        <CardTitle className="font-headline text-3xl text-primary">{title || "Acceso Librerías"}</CardTitle>
        <CardDescription>{description || "Ingresa a la plataforma para administrar tu librería."}</CardDescription>
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
      {!hideFooterLinks && (
        <CardFooter className="flex flex-col items-center space-y-2 text-sm">
          <Link href="/library-register" className="font-medium text-primary hover:underline">
            ¿No tienes una cuenta? Registra tu librería
          </Link>
          <Link href="/library-forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
