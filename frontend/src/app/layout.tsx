import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "LMS - Learning Management System",
  description: "A platform for learning and teaching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>
          <header className="navbar">
            <div className="logo">LMS</div>
            <nav>
              <a href="/">Home</a>
            </nav>
          </header>
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
