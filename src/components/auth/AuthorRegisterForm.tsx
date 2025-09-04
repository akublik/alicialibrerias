// src/components/auth/AuthorRegisterForm.tsx
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
import { Eye, EyeOff, UserPlus, Loader2, PenSquare } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase"; 
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La confirmación de contraseña debe tener al menos 6 caracteres." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof formSchema>;

export function AuthorRegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const processUserRegistration = async (user: any, name: string) => {
    const newUser = {
      name: name,
      email: user.email,
      role: "author" as const,
      createdAt: serverTimestamp(),
      isActive: true,
      loyaltyPoints: 0,
      hasWrittenFirstReview: false,
    };
    await setDoc(doc(db, "users", user.uid), newUser);
    const userDataForStorage = { id: user.uid, ...newUser };
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("aliciaLibros_user", JSON.stringify(userDataForStorage));
    toast({ title: "¡Registro Exitoso!", description: `Bienvenido/a, ${name}.` });
    router.push('/dashboard');
    router.refresh();
  };

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    if (!auth || !db) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await processUserRegistration(userCredential.user, values.name);
    } catch (error: any) {
      let description = "No se pudo completar el registro.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Ya existe una cuenta con este correo electrónico.";
      }
      console.error("Firebase Registration Error:", error.code, error.message);
      toast({ title: "Error de Registro", description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await processUserRegistration(user, user.displayName || "Autor");
    } catch (error: any) {
        toast({ title: "Error de Registro con Google", description: error.message, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl animate-fadeIn">
      <CardHeader className="text-center">
        <PenSquare className="mx-auto h-12 w-12 text-primary mb-4" />
        <CardTitle className="font-headline text-3xl text-primary">Registro de Autor</CardTitle>
        <CardDescription>Crea tu cuenta para acceder a herramientas exclusivas para autores.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nombre (o Seudónimo)</FormLabel> <FormControl><Input placeholder="Ej: Jorge Luis Borges" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input type="email" placeholder="tu@email.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="password" render={({ field }) => ( <FormItem> <FormLabel>Contraseña</FormLabel> <FormControl><div className="relative"><Input type={showPassword ? "text" : "password"} placeholder="Crea una contraseña" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem> <FormLabel>Confirmar Contraseña</FormLabel> <FormControl><div className="relative"><Input type={showConfirmPassword ? "text" : "password"} placeholder="Repite la contraseña" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff /> : <Eye />}</Button></div></FormControl> <FormMessage /> </FormItem> )} />
            <Button type="submit" className="w-full font-body text-base" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Crear Cuenta
            </Button>
          </form>
        </Form>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">O</span></div>
        </div>
        <Button variant="outline" className="w-full font-body" onClick={handleGoogleSignIn} disabled={isLoading}>
            <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2-5.03 2-4.42 0-8.08-3.64-8.08-8.12s3.66-8.12 8.08-8.12c2.45 0 4.18.98 5.48 2.18l2.74-2.74C18.67 1.54 15.9 0 12.48 0 5.88 0 .04 5.84.04 13s5.84 13 12.44 13c3.53 0 6.42-1.18 8.54-3.32 2.2-2.22 2.86-5.4 2.86-7.82 0-.74-.06-1.47-.18-2.18h-11.2z"></path></svg>
            Registrarse con Google
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <Link href="/author-login" className="font-medium text-primary hover:underline">¿Ya eres autor? Ingresa aquí</Link>
      </CardFooter>
    </Card>
  );
}
