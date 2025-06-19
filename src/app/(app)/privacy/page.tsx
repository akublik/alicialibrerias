// src/app/(app)/privacy/page.tsx
import { LockKeyhole } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="animate-fadeIn">
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <LockKeyhole className="mx-auto h-16 w-16 text-primary mb-6" />
          <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 text-primary">
            Política de Privacidad
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            Tu privacidad es importante para nosotros. Esta política explica cómo recopilamos, usamos y protegemos tu información personal en Alicia Libros.
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-lg lg:prose-xl prose-headings:font-headline prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline">
            <p className="text-sm text-muted-foreground">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <h2>1. Introducción</h2>
            <p>
              En Alicia Libros (en adelante, "Nosotros" o "la Plataforma"), respetamos tu privacidad y estamos comprometidos a proteger tu información personal. Esta Política de Privacidad describe cómo recopilamos, utilizamos, divulgamos y protegemos la información que obtenemos de los usuarios de nuestra plataforma.
            </p>

            <h2>2. Información que Recopilamos</h2>
            <p>Podemos recopilar los siguientes tipos de información:</p>
            <ul>
              <li><strong>Información de Registro:</strong> Cuando creas una cuenta, recopilamos tu nombre, dirección de correo electrónico y contraseña.</li>
              <li><strong>Información de Perfil:</strong> Puedes optar por proporcionar información adicional como tus géneros literarios preferidos, autores favoritos, etc.</li>
              <li><strong>Información de Transacciones:</strong> Si realizas compras a través de la Plataforma, recopilamos información relacionada con tus pedidos (libros comprados, historial de compras). No almacenamos información de tarjetas de crédito; esta es manejada por nuestros procesadores de pago seguros.</li>
              <li><strong>Información de Uso:</strong> Recopilamos información sobre cómo utilizas la Plataforma, como las páginas que visitas, los libros que buscas, y tus interacciones con las funcionalidades.</li>
              <li><strong>Contenido Generado por el Usuario:</strong> Información que proporcionas al escribir reseñas, participar en foros o clubes de lectura.</li>
              <li><strong>Información Técnica:</strong> Dirección IP, tipo de navegador, sistema operativo, información del dispositivo, y cookies.</li>
            </ul>

            <h2>3. Cómo Usamos Tu Información</h2>
            <p>Utilizamos tu información para los siguientes propósitos:</p>
            <ul>
              <li>Proveer y mejorar la Plataforma y nuestros servicios.</li>
              <li>Personalizar tu experiencia, incluyendo recomendaciones de libros.</li>
              <li>Procesar tus transacciones y gestionar tus pedidos.</li>
              <li>Comunicarnos contigo sobre tu cuenta, servicios y promociones (con tu consentimiento).</li>
              <li>Analizar el uso de la Plataforma para mejorarla.</li>
              <li>Cumplir con obligaciones legales y proteger nuestros derechos.</li>
            </ul>

            <h2>4. Cómo Compartimos Tu Información</h2>
            <p>No vendemos tu información personal a terceros. Podemos compartir tu información en las siguientes circunstancias:</p>
            <ul>
              <li><strong>Con Librerías:</strong> Cuando realizas una compra, compartimos la información necesaria con la librería correspondiente para procesar tu pedido.</li>
              <li><strong>Proveedores de Servicios:</strong> Compartimos información con terceros que nos ayudan a operar la Plataforma (ej. procesadores de pago, servicios de hosting, herramientas de análisis, proveedores de IA para recomendaciones). Estos proveedores están obligados a proteger tu información.</li>
              <li><strong>Requisitos Legales:</strong> Si es requerido por ley o para proteger nuestros derechos o los de otros.</li>
              <li><strong>Transferencias Comerciales:</strong> En caso de fusión, adquisición o venta de activos, tu información podría ser transferida.</li>
            </ul>
             <p>Las recomendaciones de IA pueden implicar el envío de datos anónimos o seudónimos (como historial de lectura y preferencias, sin tu nombre o email directo) a servicios de IA de terceros como OpenAI para generar sugerencias. Estos datos se utilizan únicamente con el fin de proporcionar recomendaciones.</p>

            <h2>5. Tus Derechos y Opciones</h2>
            <p>Tienes derecho a acceder, corregir o eliminar tu información personal. También puedes oponerte al procesamiento de tus datos o solicitar la limitación de su uso. Puedes gestionar tus preferencias de comunicación y, en muchos casos, actualizar tu información directamente en tu perfil de usuario.</p>

            <h2>6. Seguridad de la Información</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas razonables para proteger tu información personal contra el acceso no autorizado, la alteración, la divulgación o la destrucción. Sin embargo, ningún sistema es completamente seguro, y no podemos garantizar la seguridad absoluta de tu información.
            </p>

            <h2>7. Cookies y Tecnologías Similares</h2>
            <p>
              Utilizamos cookies y tecnologías similares para mejorar tu experiencia en la Plataforma, recordar tus preferencias y recopilar datos de uso. Puedes gestionar tus preferencias de cookies a través de la configuración de tu navegador.
            </p>
            
            <h2>8. Privacidad de Menores</h2>
            <p>
              La Plataforma no está dirigida a menores de 13 años (o la edad mínima aplicable en tu jurisdicción). No recopilamos intencionadamente información personal de menores sin el consentimiento parental.
            </p>

            <h2>9. Cambios a esta Política de Privacidad</h2>
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos cualquier cambio material publicando la nueva política en la Plataforma y actualizando la fecha de "Última actualización".
            </p>

            <h2>10. Contacto</h2>
            <p>
              Si tienes preguntas o inquietudes sobre esta Política de Privacidad o nuestras prácticas de datos, por favor contáctanos en <a href="mailto:privacidad@alicialibros.com">privacidad@alicialibros.com</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
