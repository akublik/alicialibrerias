// src/app/(auth_library)/library-login/page.tsx
import { LibraryLoginForm } from '@/components/auth_library/LibraryLoginForm';

export default function LibraryLoginPage() {
  return <LibraryLoginForm expectedRole="library" />;
}
