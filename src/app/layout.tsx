import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/components/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'Best Computel Service & RMA Management',
  description: 'Aplikasi Web Fullstack Manajemen Servis, Garansi, Surat Jalan & WhatsApp Automation Best Computel',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <body className="h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            {/* Sidebar Navigation (Responsive Drawer on Mobile, Fixed on Desktop) */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
              <Topbar />
              <main className="flex-1 p-3 sm:p-6 lg:p-8 bg-slate-50/70 dark:bg-slate-950 min-w-0 transition-colors duration-200">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
