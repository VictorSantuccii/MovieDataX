import type { Metadata, Viewport } from "next";
import { Montserrat, Poppins } from "next/font/google";
import Footer from "@/components/footer";
import SidebarMenu from "@/components/sidebar-menu";
import ChatbotWidget from "@/components/chatbot-widget";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://moviedatax.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MovieDataX - Explore o Universo do Cinema",
  description:
    "Descubra filmes e séries com curadoria inteligente: rankings, premiações, tendências e detalhes completos para quem vive cinema de verdade.",
  openGraph: {
    title: "MovieDataX - O universo do cinema em um só lugar",
    description:
      "Para cinéfilos exigentes: encontre tendências, premiações, elenco, notas e descobertas personalizadas em segundos.",
    type: "website",
    locale: "pt_BR",
    siteName: "MovieDataX",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MovieDataX - Explore o universo do cinema",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieDataX - O universo do cinema em um só lugar",
    description:
      "Para cinéfilos exigentes: tendências, premiações, notas e descobertas personalizadas em um único hub.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icone.png",
    shortcut: "/icone.png",
    apple: "/icone.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <ChatbotWidget />
        {children}
        <Footer />
      </body>
    </html>
  );
}
