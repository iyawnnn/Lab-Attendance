import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

// Configure Outfit with the standard Latin character set
const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Laboratory Attendance System",
  description: "Secure ECC-based attendance tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Inject the Outfit font class into the body */}
      <body className={`${outfit.className} bg-gray-50 text-gray-900 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}