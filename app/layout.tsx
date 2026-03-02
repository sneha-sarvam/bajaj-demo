import type { Metadata } from 'next';
import { Nav } from './nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'STT + Translate All Languages',
  description: 'Real-time Speech-to-Text with instant translation to all Indian languages using Sarvam AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-svh">
        <Nav />
        {children}
      </body>
    </html>
  );
}
