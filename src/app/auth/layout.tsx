import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticação | Zip Food',
  description: 'Entre ou cadastre-se na plataforma Zip Food',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      {children}
    </div>
  );
}