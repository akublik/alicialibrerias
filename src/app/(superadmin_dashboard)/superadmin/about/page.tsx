// src/app/(superadmin_dashboard)/superadmin/about/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Info, Save, PlusCircle, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { AboutUsContent } from "@/types";
import { Separator } from "@/components/ui/separator";

const teamMemberSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  role: z.string().min(2, "El rol es requerido."),
  imageUrl: z.string().url("URL de imagen no válida.").or(z.literal('')),
  dataAiHint: z.string().optional(),
});

const benefitSchema = z.object({
  title: z.string().min(3, "El título es requerido."),
  description: z.string().min(10, "La descripción es requerida."),
  icon: z.string().min(2, "El ícono es requerido."),
});

const featureListItemSchema = z.object({
  feature: z.string().min(5, "El texto de la funcionalidad es requerido."),
});

const aboutUsFormSchema = z.object({
  headerTitle: z.string().min(3, "El título es requerido."),
  headerSubtitle: z.string().min(10, "El subtítulo es requerido."),
  headerImageUrl: z.string().url("URL de imagen no válida.").or(z.literal('')),
  headerDataAiHint: z.string().optional(),
  missionTitle: z.string().min(3, "El título de misión es requerido."),
  missionParagraph1: z.string().min(10, "El primer párrafo es requerido."),
  missionParagraph2: z.string().min(10, "El segundo párrafo es requerido."),
  missionImageUrl: z.string().url("URL de imagen no válida.").or(z.literal('')),
  missionDataAiHint: z.string().optional(),
  featuresTitle: z.string().min(3, "El título de la sección de funcionalidades es requerido."),
  featuresForLibraries: z.array(featureListItemSchema).optional(),
  featuresForReaders: z.array(featureListItemSchema).optional(),
  team: z.array(teamMemberSchema).optional(),
  // whyUsTitle and benefits are kept for backwards compatibility but not shown in UI anymore
  whyUsTitle: z.string().optional(),
  benefits: z.array(benefitSchema).optional(),
});

type AboutUsFormValues = z.infer<typeof aboutUsFormSchema>;

const contentDocRef = doc(db, "site_content", "about_us_page");

export default function ManageAboutPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<AboutUsFormValues>({
    resolver: zodResolver(aboutUsFormSchema),
    defaultValues: {
      headerTitle: "",
      headerSubtitle: "",
      headerImageUrl: "",
      headerDataAiHint: "",
      missionTitle: "",
      missionParagraph1: "Conectar a lectores de todo el mundo con la riqueza y diversidad de las librerías independientes de Latinoamérica, fortaleciendo la cultura local y el amor por la lectura.",
      missionParagraph2: "A través de una plataforma tecnológica intuitiva, ofrecemos a las librerías las herramientas para prosperar en el mundo digital y a los lectores una puerta de entrada para descubrir, comprar y vivir nuevas historias.",
      missionImageUrl: "",
      missionDataAiHint: "",
      featuresTitle: "Beneficios y Funcionalidades de la Plataforma",
      featuresForLibraries: [],
      featuresForReaders: [],
      team: [],
    },
  });

  const { fields: teamFields, append: appendTeamMember, remove: removeTeamMember } = useFieldArray({
    control: form.control,
    name: "team",
  });
  
  const { fields: libraryFeatureFields, append: appendLibraryFeature, remove: removeLibraryFeature } = useFieldArray({
    control: form.control,
    name: "featuresForLibraries",
  });
  
  const { fields: readerFeatureFields, append: appendReaderFeature, remove: removeReaderFeature } = useFieldArray({
    control: form.control,
    name: "featuresForReaders",
  });


  useEffect(() => {
    const fetchContent = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      try {
        const docSnap = await getDoc(contentDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<AboutUsFormValues>;
          const formValues: AboutUsFormValues = {
            headerTitle: data.headerTitle || "",
            headerSubtitle: data.headerSubtitle || "",
            headerImageUrl: data.headerImageUrl || "",
            headerDataAiHint: data.headerDataAiHint || "",
            missionTitle: data.missionTitle || "",
            missionParagraph1: data.missionParagraph1 || "Conectar a lectores de todo el mundo con la riqueza y diversidad de las librerías independientes de Latinoamérica, fortaleciendo la cultura local y el amor por la lectura.",
            missionParagraph2: data.missionParagraph2 || "A través de una plataforma tecnológica intuitiva, ofrecemos a las librerías las herramientas para prosperar en el mundo digital y a los lectores una puerta de entrada para descubrir, comprar y vivir nuevas historias.",
            missionImageUrl: data.missionImageUrl || "",
            missionDataAiHint: data.missionDataAiHint || "",
            featuresTitle: data.featuresTitle || "Beneficios y Funcionalidades de la Plataforma",
            featuresForLibraries: data.featuresForLibraries || [],
            featuresForReaders: data.featuresForReaders || [],
            team: data.team || [],
            whyUsTitle: data.whyUsTitle || "",
            benefits: data.benefits || [],
          };
          form.reset(formValues);
        }
      } catch (error: any) {
        toast({ title: "Error al cargar contenido", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [form, toast]);

  const onSubmit = async (values: AboutUsFormValues) => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(contentDocRef, values, { merge: true });
      toast({ title: "Contenido guardado", description: "La página 'Sobre Nosotros' ha sido actualizada." });
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary flex items-center mb-8">
        <Info className="mr-3 h-8 w-8" />
        Gestionar Página "Sobre Nosotros"
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Sección de Encabezado</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="headerTitle" render={({ field }) => ( <FormItem><FormLabel>Título Principal</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="headerSubtitle" render={({ field }) => ( <FormItem><FormLabel>Subtítulo</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="headerImageUrl" render={({ field }) => ( <FormItem><FormLabel>URL Imagen de Fondo (Patrón)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="headerDataAiHint" render={({ field }) => ( <FormItem><FormLabel>Pista IA (Encabezado)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sección de Misión</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="missionTitle" render={({ field }) => ( <FormItem><FormLabel>Título de la Misión</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="missionParagraph1" render={({ field }) => ( <FormItem><FormLabel>Párrafo 1</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="missionParagraph2" render={({ field }) => ( <FormItem><FormLabel>Párrafo 2</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} rows={4} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="missionImageUrl" render={({ field }) => ( <FormItem><FormLabel>URL Imagen de la Misión</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="missionDataAiHint" render={({ field }) => ( <FormItem><FormLabel>Pista IA (Misión)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sección de Beneficios y Funcionalidades</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="featuresTitle" render={({ field }) => ( <FormItem><FormLabel>Título de la Sección</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                <Separator/>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Para Librerías</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendLibraryFeature({ feature: '' })}><PlusCircle className="mr-2 h-4 w-4"/> Añadir</Button>
                  </div>
                  <div className="space-y-3">
                    {libraryFeatureFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField control={form.control} name={`featuresForLibraries.${index}.feature`} render={({ field }) => ( <FormItem className="flex-grow"><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLibraryFeature(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator/>
                 <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Para Lectores</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendReaderFeature({ feature: '' })}><PlusCircle className="mr-2 h-4 w-4"/> Añadir</Button>
                  </div>
                  <div className="space-y-3">
                    {readerFeatureFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField control={form.control} name={`featuresForReaders.${index}.feature`} render={({ field }) => ( <FormItem className="flex-grow"><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeReaderFeature(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </div>
                    ))}
                  </div>
                </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sección de Equipo</CardTitle>
                <Button type="button" variant="outline" onClick={() => appendTeamMember({ name: '', role: '', imageUrl: '', dataAiHint: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Miembro</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-3 relative">
                  <h4 className="font-medium">Miembro {index + 1}</h4>
                  <FormField control={form.control} name={`team.${index}.name`} render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name={`team.${index}.role`} render={({ field }) => ( <FormItem><FormLabel>Rol</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name={`team.${index}.imageUrl`} render={({ field }) => ( <FormItem><FormLabel>URL de Imagen</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name={`team.${index}.dataAiHint`} render={({ field }) => ( <FormItem><FormLabel>Pista para IA (1-2 palabras)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem> )} />
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeTeamMember(index)} className="absolute top-4 right-4"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </form>
      </Form>
    </div>
  );
}
