import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UsedPartPicker",
  description: "Find used PC parts and analyze deals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav style={{ padding: 16, backgroundColor: "#f5f5f5", borderBottom: "1px solid #ddd", marginBottom: 30 }}>
          <Link href="/" style={{ marginRight: 20, fontWeight: 'bold' }}>Search</Link>
          <Link href="/my-builds" style={{ fontWeight: 'bold' }}>My Builds</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
