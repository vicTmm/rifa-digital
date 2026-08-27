import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rifa Digital - Plataforma de Rifas e Sorteios Online",
  description: "Participe de sorteios auditados com base na Loteria Federal e pagamento automático via PIX. Crie e gerencie suas próprias rifas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
