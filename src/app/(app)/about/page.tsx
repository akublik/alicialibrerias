// src/app/(app)/about/page.tsx
import { BookHeart, Users, MapPinned, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  const teamMembers = [
    { name: 'Elena Rodriguez', role: 'Fundadora y CEO', imageUrl: 'https://placehold.co/200x200.png?text=Elena', dataAiHint: 'woman professional' },
    { name: 'Carlos Vega', role: 'Director de Tecnología', imageUrl: 'https://placehold.co/200x200.png?text=Carlos', dataAiHint: 'man tech' },
    { name: 'Sofía Torres', role: 'Encargada de Comunidad', imageUrl: 'https://placehold.co/200x200.png?text=Sofia', dataAiHint: 'woman community' },
  ];

  return (
    <div className="animate-fadeIn">
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url('https://placehold.co/1920x1080.png?text=Book+Pattern')", backgroundSize: 'cover', backgroundPosition: 'center' }} data-ai-hint="subtle pattern"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 text-primary">
            Sobre Alicia Lee
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            Nuestra pasión es conectar a lectores con la magia de las librerías independientes, fomentando la cultura y el amor por la lectura en cada rincón de Latinoamérica.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-headline text-3xl font-semibold text-foreground mb-6">Nuestra Misión</h2>
              <p className="text-lg text-foreground/70 mb-4 leading-relaxed">
                En Alicia Lee, creemos que cada librería independiente es un tesoro cultural, un espacio único que ofrece mucho más que libros: ofrece comunidad, descubrimiento y pasión por las historias. Nuestra misión es ser el puente que une estos valiosos espacios con lectores ávidos de nuevas aventuras literarias.
              </p>
              <p className="text-lg text-foreground/70 leading-relaxed">
                Buscamos fortalecer el ecosistema del libro en Ecuador y Latinoamérica, proporcionando herramientas tecnológicas a las librerías para que puedan prosperar y llegar a más personas, mientras ofrecemos a los lectores una plataforma intuitiva y enriquecedora para explorar, conectar y comprar.
              </p>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
                <Image src="https://placehold.co/600x400.png" alt="Equipo de Alicia Lee trabajando" layout="fill" objectFit="cover" data-ai-hint="diverse team discussion" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-12 text-foreground">¿Por Qué Alicia Lee?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Amor por los Libros", description: "Compartimos una profunda pasión por la lectura y el valor de las historias.", icon: BookHeart },
              { title: "Apoyo a lo Local", description: "Impulsamos a las librerías independientes, corazón de nuestras comunidades.", icon: Users },
              { title: "Descubrimiento Continuo", description: "Te ayudamos a encontrar joyas literarias y autores que te sorprenderán.", icon: Sparkles },
              { title: "Conexión Cultural", description: "Facilitamos el acceso a la diversidad literaria de Latinoamérica.", icon: MapPinned },
            ].map(benefit => (
              <div key={benefit.title} className="text-center p-6 bg-card rounded-lg shadow-sm hover:shadow-lg transition-shadow">
                <benefit.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-headline text-xl font-semibold mb-2 text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-semibold text-center mb-12 text-foreground">Nuestro Equipo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.name} className="text-center overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="relative w-full h-56 bg-gray-200">
                     <Image src={member.imageUrl} alt={member.name} layout="fill" objectFit="cover" data-ai-hint={member.dataAiHint}/>
                </div>
                <div className="p-6">
                  <h3 className="font-headline text-xl font-medium text-foreground">{member.name}</h3>
                  <p className="text-sm text-primary font-semibold">{member.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
