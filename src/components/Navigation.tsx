'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-900 py-3 px-6 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold text-emerald-500">
        Quiz Anatomia Sem Medo
      </Link>
      
      <div className="flex gap-4">
        <Link
          href="/"
          className={`px-3 py-1 rounded transition-colors ${
            pathname === '/' ? 'bg-emerald-700 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          Início
        </Link>
        
        <Link
          href="/teste-referral"
          className={`px-3 py-1 rounded transition-colors ${
            pathname === '/teste-referral' ? 'bg-emerald-700 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          Testar Referral
        </Link>
        
        <Link
          href="/ranking"
          className={`px-3 py-1 rounded transition-colors ${
            pathname === '/ranking' ? 'bg-emerald-700 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          Ranking
        </Link>
      </div>
    </nav>
  );
} 