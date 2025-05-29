"use client";

import GradientLogo from "../common/shared/gradient-logo";
import { MainNav } from "./MainNav";

export default function Header() {
  return (
    <div className="flex items-center justify-between w-full px-4 py-2">
      <GradientLogo />
      <MainNav />
    </div>
  );
}
