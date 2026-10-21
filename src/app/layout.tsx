import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './globals.css';
import { SiteHeader, Providers } from '@/components/site-header';
export const metadata: Metadata = {
  title: 'Agent Action Review Queue',
  description:
    'Give your agents room to work. Keep the decisions that matter. A risk-tiered review queue for AI agents in a CRM.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <SiteHeader />
          <div id="main-content">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
