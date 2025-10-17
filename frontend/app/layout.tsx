import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinSage - Trading Dashboard',
  description: 'Autonomous, cautious, data-driven trading & portfolio monitoring agent',
  keywords: ['trading', 'portfolio', 'AI', 'fintech', 'investment'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent automatic scrolling on page load
              (function() {
                const savedScrollPosition = sessionStorage.getItem('scrollPosition');
                if (savedScrollPosition) {
                  window.scrollTo(0, parseInt(savedScrollPosition));
                }
                
                // Save scroll position before unload
                window.addEventListener('beforeunload', function() {
                  sessionStorage.setItem('scrollPosition', window.scrollY.toString());
                });
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
