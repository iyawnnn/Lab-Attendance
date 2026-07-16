import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.ttf",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: {
    default: "UA LabSign | Laboratory Attendance System",
    template: "%s | UA LabSign",
  },
  description:
    "Official University of Assumption computer laboratory attendance portal featuring ECDSA P-256 digital signatures, dynamic room PINs, and precise geofence boundary check-ins.",
  keywords: [
    "UA LabSign",
    "UA LabSign System",
    "University of Assumption",
    "University of Assumption Laboratory System",
    "Laboratory Attendance System",
    "Geofenced Attendance",
    "ECDSA Verification",
    "Computer Laboratory Portal",
  ],
  authors: [{ name: "University of Assumption" }],
  creator: "University of Assumption",
  publisher: "University of Assumption",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: baseUrl.toString(),
    title: "UA LabSign | Laboratory Attendance System",
    description:
      "Hardware-bound, zero-trust cryptographic attendance tracking system for computer laboratories at University of Assumption.",
    siteName: "UA LabSign",
    images: [
      {
        url: "/ua-logo.png",
        width: 512,
        height: 512,
        alt: "University of Assumption Official Seal - UA LabSign",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UA LabSign | Laboratory Attendance System",
    description:
      "Hardware-bound, zero-trust cryptographic attendance tracking system for computer laboratories at University of Assumption.",
    images: ["/ua-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={satoshi.variable}>
      <body className="font-sans bg-gray-50 text-gray-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}