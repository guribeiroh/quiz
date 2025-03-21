import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QuizProvider } from "../context/QuizContext";
// import Navigation from "../components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quiz Anatomia Sem Medo",
  description: "Aprenda anatomia de forma divertida e eficaz",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white`}>
        <QuizProvider>
          {/* Navegação desabilitada */}
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </QuizProvider>
      </body>
    </html>
  );
}
