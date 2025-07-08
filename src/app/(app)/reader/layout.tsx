// src/app/(app)/reader/layout.tsx

// This new layout file takes precedence for the /reader route.
// It renders its children directly without the main Navbar and Footer,
// creating an immersive experience.
export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
