// src/app/(auth)/layout.tsx
// Este layout devuelve null explícitamente para asegurar que no interfiere
// y para ayudar a diagnosticar el error de rutas paralelas.
export default function AuthLayoutNull({
  children,
}: {
  children: React.ReactNode;
}) {
  return null;
}
