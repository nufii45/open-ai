import type { Metadata } from 'next';
import '@fontsource-variable/stack-sans-text/wght.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'HealthBridge',
  description: 'Prepare, verify, and ask before your next care visit.',
  icons: {
    icon: [{ url: '/brand/healthbridge-mark.png?v=2', type: 'image/png' }],
    shortcut: '/brand/healthbridge-mark.png?v=2',
    apple: '/brand/healthbridge-mark.png?v=2',
  },
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
