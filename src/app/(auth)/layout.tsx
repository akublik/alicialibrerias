// src/app/(auth)/layout.tsx
// This layout returns null explicitly to ensure it does not interfere
// and to help diagnose the parallel routes error.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Returning null directly to ensure this layout contributes nothing.
  return null;
}
