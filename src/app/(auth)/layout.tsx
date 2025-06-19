// src/app/(auth)/layout.tsx
import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout now renders nothing, effectively disabling it.
  return null;
}
