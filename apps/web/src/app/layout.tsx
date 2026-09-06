import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bethel — Gestão do lar",
  description: "Sistema de gestão do lar para a família",
  applicationName: "Bethel",
  appleWebApp: {
    capable: true,
    title: "Bethel",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon/favicon.svg",
    apple: "/favicon/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${bricolage.variable}`}
        style={{
          fontFamily: "var(--font-jakarta), sans-serif",
          WebkitFontSmoothing: "antialiased",
          background: "var(--ds-bg)",
          color: "var(--ds-text)",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
