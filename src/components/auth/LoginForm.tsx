// src/components/auth/LoginForm.tsx
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
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { User } from "@/types";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    if (!db) {
        toast({ title: "Error de conexión", description: "No se pudo conectar a la base de datos.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", values.email), where("password", "==", values.password));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Error de Inicio de Sesión",
          description: "Email o contraseña incorrectos.",
          variant: "destructive",
        });
      } else {
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() } as User;

        if (userData.isActive === false) {
          toast({
            title: "Cuenta Desactivada",
            description: "Tu cuenta ha sido desactivada. Por favor, contacta con el soporte.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("aliciaLibros_user", JSON.stringify(userData));
        
        toast({
          title: "Inicio de Sesión Exitoso",
          description: `Bienvenido/a de nuevo, ${userData.name}.`,
        });

        if (userData.role === 'superadmin') {
          router.push('/superadmin/dashboard');
        } else {
          router.push(redirectUrl);
        }
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      toast({
        title: "Error de Inicio de Sesión",
        description: "Hubo un problema al intentar iniciar sesión. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl animate-fadeIn">
      <CardHeader className="text-center">
        <LogIn className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="font-headline text-3xl text-primary">Ingreso de Lector</CardTitle>
        <CardDescription>Accede a tu cuenta para continuar tu aventura literaria.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="tu@email.com" {...field} />
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
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
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
        <Link href={`/register?redirect=${redirectUrl}`} className="font-medium text-primary hover:underline">
          ¿No tienes una cuenta? Regístrate aquí
        </Link>
        <Link href="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </CardFooter>
    </Card>
  );
}
