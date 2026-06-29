import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CalligraphyDoodles } from "@/components/CalligraphyDoodles";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FluentScribe | Calligraphy Speaking & Writing Coach",
  description: "FluentScribe is a premium calligraphy-styled speech and writing companion. Master English grammar, vocabulary, teleprompter pacing, and conversational simulator challenges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="relative min-h-screen">
        <CalligraphyDoodles />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
