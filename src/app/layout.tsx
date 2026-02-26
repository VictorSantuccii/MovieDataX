import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import Footer from "@/components/footer";
import SidebarMenu from "@/components/sidebar-menu";
import ThemeToggle from "@/components/theme-toggle";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MovieDataX - Explore o Universo do Cinema",
  description:
    "Sua central rápida e inteligente para explorar filmes, detalhes, avaliações e tudo que importa no universo do cinema.",
  icons: {
    icon: "/icone.png",
    shortcut: "/icone.png",
    apple: "/icone.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body className={`${montserrat.variable} ${poppins.variable} antialiased`}>
        <SidebarMenu />
        <ThemeToggle />
        {children}
        <Footer />
      </body>
    </html>
  );
}
