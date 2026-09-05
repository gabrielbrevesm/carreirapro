import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MockDataProvider } from "@/lib/mock/store";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://modocarreirapro.com.br";
const SITE_TITLE = "CarreiraPRO — Sua carreira no EA FC vira manchete";
const SITE_DESCRIPTION =
  "Registre os resultados, contratações e decisões da sua carreira no EA FC e receba matérias, capas e análises geradas por IA — como se um grande veículo esportivo cobrisse a sua trajetória todos os dias.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "CarreiraPRO",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_TITLE }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <MockDataProvider>
            {children}
            <Toaster />
          </MockDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
