// src/components/auth/RegisterForm.tsx
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
import { Eye, EyeOff, UserPlus, Loader2, Bot, Gift, Heart, Bookmark, MessageSquare } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase"; 
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

const registerFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La confirmación de contraseña debe tener al menos 6 caracteres." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  
  const benefits = [
    { icon: Bot, text: "Lee y conversa con tus libros usando nuestra IA." },
    { icon: Heart, text: "Guarda tus librerías y autores favoritos." },
    { icon: Bookmark, text: "Crea tu lista de deseos personalizada." },
    { icon: Gift, text: "Acumula puntos de lealtad con cada compra." },
    { icon: MessageSquare, text: "Participa en la comunidad y deja reseñas." }
  ];

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    
    if (!auth || !db) {
        toast({ title: "Error de configuración", description: "El registro no está disponible.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      const newUser = {
        name: values.name,
        email: values.email,
        role: "reader" as const,
        createdAt: serverTimestamp(),
        isActive: true,
        loyaltyPoints: 0,
        hasWrittenFirstReview: false,
      };

      await setDoc(doc(db, "users", firebaseUser.uid), newUser);
      
      const userDataForStorage = {
        id: firebaseUser.uid,
        name: values.name,
        email: values.email,
        role: 'reader'
      };
      
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("aliciaLibros_user", JSON.stringify(userDataForStorage));

      toast({
        title: "¡Registro Exitoso!",
        description: `Bienvenido/a, ${values.name}.`,
      });
      router.push(redirectUrl);

    } catch (error: any) {
      let description = "No se pudo completar el registro. Inténtalo de nuevo.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Ya existe una cuenta con este correo electrónico.";
      }
      console.error("Firebase Registration Error:", error.code, error.message);
      toast({
        title: "Error de Registro",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-4xl shadow-2xl animate-fadeIn">
      <CardHeader className="text-center">
        <UserPlus className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="font-headline text-3xl text-primary">Crea tu Cuenta de Lector</CardTitle>
        <CardDescription>Únete a nuestra comunidad para una experiencia de lectura completa.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 lg:gap-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nombre Completo</FormLabel> <FormControl><Input placeholder="Ej: Ana Lectora" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input type="email" placeholder="tu@email.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Contraseña</FormLabel> <FormControl><div className="relative"><Input type={showPassword ? "text" : "password"} placeholder="Crea una contraseña" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirmar Contraseña</FormLabel> <FormControl><div className="relative"><Input type={showConfirmPassword ? "text" : "password"} placeholder="Repite la contraseña" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff /> : <Eye />}</Button></div></FormControl> <FormMessage /> </FormItem> )} />
                <Button type="submit" className="w-full font-body text-base" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Registrarse
                </Button>
              </form>
            </Form>
             <div className="hidden lg:block p-6 border-l">
                <h3 className="font-headline text-xl text-foreground mb-4">Beneficios de ser Lector:</h3>
                <ul className="space-y-4">
                    {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <benefit.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{benefit.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center text-sm pt-4 border-t">
        <p className="text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <Link href={`/login?redirect=${redirectUrl}`} className="font-medium text-primary hover:underline">
            Ingresa aquí
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
