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
    // Removed full-screen centering classes, AuthLayout handles this
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
    // Removed custom footer, AuthLayout handles this
  );
}

// Loader2 is already defined in LoginForm/RegisterForm, if this page is standalone and doesn't share it,
// it would need its own Loader2 definition or import from a shared utility.
// Assuming it might be co-located or shared, otherwise add:
// const Loader2 = ({ className }: { className?: string }) => ( /* ...SVG... */ );
