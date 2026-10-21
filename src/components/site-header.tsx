'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, ArrowUpRight } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';
const subscribe = (callback: () => void) => {
  window.addEventListener('theme-change', callback);
  return () => window.removeEventListener('theme-change', callback);
};
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster position="bottom-right" closeButton />
    </MotionConfig>
  );
}
export function SiteHeader() {
  const path = usePathname();
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme === 'dark',
    () => false,
  );
  const toggle = () => {
    const current =
      document.documentElement.dataset.theme ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark';
    window.dispatchEvent(new Event('theme-change'));
  };
  return (
    <header className="site-header">
      <Link href="/story" className="brand" aria-label="Review Queue home">
        <span className="logo-mark" />
        Review Queue
        <span className="brand-divider" /> <span className="brand-product">Agent actions</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/review" className={path === '/review' ? 'active' : ''}>
          Review
        </Link>
        <Link href="/story" className={path === '/story' ? 'active' : ''}>
          The story
          <ArrowUpRight size={12} />
        </Link>
      </nav>
      <div className="header-right">
        <span className="demo-label">Interactive demo</span>
        <button className="icon-button" onClick={toggle} aria-label="Toggle color theme">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <span className="user-avatar" title="Alex Rivera">
          AR
        </span>
      </div>
    </header>
  );
}
