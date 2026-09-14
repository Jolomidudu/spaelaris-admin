import { Outfit } from 'next/font/google';
// @ts-expect-error -- the stylesheet is resolved by the Next.js bundler.
import './globals.css';
// flatpickr does not provide TypeScript declarations for its CSS side-effect import.
// @ts-expect-error -- the stylesheet is resolved by the Next.js bundler.
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
