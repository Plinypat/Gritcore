import type { Metadata } from 'next';
import { Rajdhani, JetBrains_Mono, DM_Sans } from 'next/font/google';
import '../styles/globals.css';

const rajdhani = Rajdhani({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const dmSans = DM_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GritCore — AI Construction Drawing Intelligence',
  description: 'AI-powered construction drawing review for concrete, structural, and civil projects.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${jetbrainsMono.variable} ${dmSans.variable}`}
      style={{ background: '#07080a' }}
    >
      <body style={{ background: '#07080a', color: '#dce4f0', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
