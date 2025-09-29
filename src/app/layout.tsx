import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

// Componentes
import AuthCheck from '@/components/AuthCheck';
import ClientLayout from '@/components/ClientLayout';
import { AuthProvider } from '@/hooks/useAuth';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zip Food",
  description: "Aplicativo de delivery de comida",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" dir="ltr">
      <head>
        {/* Preload de recursos críticos */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <AuthProvider>
          <AuthCheck>
            <ClientLayout>
              {children}
            </ClientLayout>
          </AuthCheck>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1F2937',
              color: '#FFFFFF',
              border: '1px solid #00FF88',
            },
            success: {
              style: {
                background: '#00FF88',
                color: '#000000',
              },
            },
            error: {
              style: {
                background: '#EF4444',
                color: '#FFFFFF',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
