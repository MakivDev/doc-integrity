import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { I18nProvider } from "@/app/providers/I18nProvider";
import { Web3Provider } from "@/app/providers/Web3Provider";
import Header from "@/app/components/layout/Header";
import Footer from "@/app/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocIntegrity — Блокчейн-верифікація документів",
  description: "Вебсистема контролю цілісності електронних документів на базі смарт-контрактів Ethereum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <I18nProvider>
            <Web3Provider>
              <div className="app-container">
                <Header />
                <main className="main-content">
                  {children}
                </main>
                <Footer />
              </div>
            </Web3Provider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
