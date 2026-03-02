'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Live Demo' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-gray-900 hover:text-[#4c6ef5] transition-colors">
          STT + Translate
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#f0f4ff] text-[#4263eb]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
