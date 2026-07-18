import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthBridge",
  description: "Find generic alternatives and see your potential savings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
