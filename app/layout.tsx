import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Platform",
  description: "Create and track dynamic QR codes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
