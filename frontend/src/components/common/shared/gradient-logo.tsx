// src/components/common/shared/gradient-logo.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function GradientLogo() {
  return (
    <Link href="/">
      <Image src="/logolujos.svg" alt="logolujosFercho" width={180} height={32} priority />
    </Link>
  );
}
