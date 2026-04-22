import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swiss Solar System — Monitor Hub",
  description:
    "Un seul point d'accès pour tous vos bâtiments et systèmes solaires.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="antialiased">
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
