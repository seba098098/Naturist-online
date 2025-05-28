// src/components/layout/MobileHeader.tsx
"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";

export default function MobileHeader() {
  return (
    <div className="flex items-center justify-between w-full px-4">
      <Link href="/">
        <span className="text-lg font-bold">Jazila</span>
      </Link>
      <button aria-label="Menu">
        <MenuIcon className="w-6 h-6" />
      </button>
    </div>
  );
}