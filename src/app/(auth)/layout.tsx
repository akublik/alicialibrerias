// Simplificado al máximo para depuración

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <main className="w-full max-w-md">{children}</main>
    </div>
  );
}
