// src/app/(auth)/forgot-password/page.tsx
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
import { MailQuestion, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor ingresa un email válido." }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsLoading(true);
    // Simulate API call for password reset email
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Forgot password for email:", values.email);
    toast({
      title: "Instrucciones Enviadas",
      description: "Si existe una cuenta con ese email, recibirás instrucciones para restablecer tu contraseña.",
    });
    form.reset();
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
       <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <span className="font-headline text-2xl font-bold">Alicia Libros</span>
        </Link>
      </div>
      <Card className="w-full max-w-md shadow-2xl animate-fadeIn">
        <CardHeader className="text-center">
          <MailQuestion className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="font-headline text-3xl text-primary">¿Olvidaste tu Contraseña?</CardTitle>
          <CardDescription>No te preocupes. Ingresa tu email y te enviaremos un enlace para restablecerla.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Registrado</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@email.com" {...field} className="text-base md:text-sm"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-body text-base" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enviar Instrucciones
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <Link href="/login" className="font-medium text-primary hover:underline flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver a Ingresar
          </Link>
        </CardFooter>
      </Card>
       <footer className="absolute bottom-8 text-center text-sm text-muted-foreground">
         &copy; {new Date().getFullYear()} Alicia Libros. Todos los derechos reservados.
      </footer>
    </div>
  );
}

// Placeholder for Loader2
const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
