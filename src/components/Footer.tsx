"use client";

import Image from 'next/image';

export function Footer() {
  return (
    <div className="w-full flex justify-center mt-4 mb-2">
      <div className="flex items-center">
        <Image
          src="/logo-conaes.png"
          alt="Logo Conaes"
          width={100}
          height={30}
          className="opacity-70 hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
} 