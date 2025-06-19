// src/app/(app)/terms/page.tsx
import { ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="animate-fadeIn">
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <ShieldCheck className="mx-auto h-16 w-16 text-primary mb-6" />
          <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 text-primary">
            Términos y Condiciones
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            Por favor, lee atentamente nuestros términos y condiciones antes de usar la plataforma Alicia Libros.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-lg lg:prose-xl prose-headings:font-headline prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline">
            <p className="text-sm text-muted-foreground">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <h2>1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar la plataforma Alicia Libros (en adelante, "la Plataforma"), operada por [Nombre Legal de la Empresa/Organización] (en adelante, "Nosotros"), aceptas cumplir y estar sujeto a los siguientes términos y condiciones de uso. Si no estás de acuerdo con alguno de estos términos, no debes utilizar la Plataforma.
            </p>

            <h2>2. Uso de la Plataforma</h2>
            <p>
              Alicia Libros es un marketplace que conecta a librerías independientes con lectores. Te comprometes a utilizar la Plataforma de manera legal, ética y de acuerdo con estos términos. No podrás utilizar la Plataforma para fines ilícitos o que infrinjan los derechos de terceros.
            </p>
            <h3>2.1. Cuentas de Usuario</h3>
            <p>
              Para acceder a ciertas funcionalidades, deberás registrarte y crear una cuenta. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta. Debes notificarnos inmediatamente cualquier uso no autorizado de tu cuenta.
            </p>

            <h2>3. Propiedad Intelectual</h2>
            <p>
              Todo el contenido presente en la Plataforma, incluyendo textos, gráficos, logos, iconos, imágenes, y software, es propiedad de Alicia Libros o de sus licenciantes y está protegido por las leyes de propiedad intelectual. No puedes reproducir, distribuir, modificar o crear obras derivadas de dicho contenido sin nuestro consentimiento previo por escrito.
            </p>

            <h2>4. Compras y Pagos</h2>
            <p>
              Alicia Libros facilita la compra de libros de librerías independientes. Los términos específicos de cada compra, incluyendo precios, envío y devoluciones, serán establecidos por cada librería. Nosotros no somos responsables directos de estas transacciones, aunque proveemos la plataforma para ellas. Se aplicarán las políticas de pago de los procesadores de pago integrados.
            </p>

            <h2>5. Contenido Generado por el Usuario</h2>
            <p>
              Si publicas contenido en la Plataforma (ej. reseñas, comentarios), nos concedes una licencia no exclusiva, mundial, libre de regalías para usar, reproducir, modificar y distribuir dicho contenido en relación con la Plataforma. Garantizas que tienes los derechos necesarios sobre el contenido que publicas.
            </p>

            <h2>6. Limitación de Responsabilidad</h2>
            <p>
              La Plataforma se proporciona "tal cual" y "según disponibilidad". No garantizamos que la Plataforma sea ininterrumpida, libre de errores o segura. En la máxima medida permitida por la ley, Alicia Libros no será responsable por daños directos, indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso de la Plataforma.
            </p>

            <h2>7. Modificaciones a los Términos</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Te notificaremos los cambios importantes. El uso continuado de la Plataforma después de dichas modificaciones constituirá tu aceptación de los nuevos términos.
            </p>

            <h2>8. Ley Aplicable y Jurisdicción</h2>
            <p>
              Estos términos y condiciones se regirán e interpretarán de acuerdo con las leyes de Ecuador. Cualquier disputa que surja en relación con estos términos será sometida a la jurisdicción exclusiva de los tribunales de Quito, Ecuador.
            </p>

            <h2>9. Contacto</h2>
            <p>
              Si tienes alguna pregunta sobre estos Términos y Condiciones, por favor contáctanos a través de <a href="mailto:legal@alicialibros.com">legal@alicialibros.com</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
