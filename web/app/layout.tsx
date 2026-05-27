import type { Metadata, Viewport } from "next";
import { Inter, DM_Mono, Schoolbell, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

const schoolbell = Schoolbell({
  weight: "400",
  variable: "--font-schoolbell",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Toasting — Clube de benefícios",
  description: "Acesso exclusivo aos restaurantes da casa.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f5f0e7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${dmMono.variable} ${dmSerif.variable} ${schoolbell.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="mx-auto max-w-[430px] min-h-screen bg-background relative overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
