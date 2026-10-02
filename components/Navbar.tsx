"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import Logo from "@/components/Logo";
const links = [{ href: "/", label: "Home" }, { href: "/calculators", label: "Calculators" }];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="FinSight home"><Logo /></Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => <Link key={l.href} href={l.href} className="rounded-lg px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-brand">{l.label}</Link>)}
          <Link href="/calculators#search" className="ml-2 inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-brand hover:text-brand"><Search size={16} aria-hidden="true" />Search calculators</Link>
        </div>
        <button className="rounded-xl p-2 text-stone-700 md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </nav>
      {open && (
        <div id="mobile-menu" className="flex flex-col gap-1 border-t border-stone-200 bg-white px-4 py-3 md:hidden">
          {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium hover:bg-stone-50">{l.label}</Link>)}
          <Link href="/calculators#search" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium hover:bg-stone-50">Search calculators</Link>
        </div>
      )}
    </header>
  );
}
