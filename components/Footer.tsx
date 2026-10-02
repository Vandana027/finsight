import Link from "next/link";
import Logo from "@/components/Logo";
import { TAGLINE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-stone-700 sm:px-6 md:grid-cols-[1fr_1.4fr_auto] lg:px-8">
        <div><Logo /><p className="mt-3 text-stone-600">{TAGLINE}</p></div>
        <p className="max-w-xl leading-6">FinSight calculators give estimates for education and planning. They depend on the assumptions entered, and actual investment, loan or tax outcomes may differ. Nothing here is financial, tax or legal advice, and returns are never guaranteed.</p>
        <nav aria-label="Footer" className="flex gap-5 font-semibold text-brand"><Link href="/" className="hover:underline">Home</Link><Link href="/calculators" className="hover:underline">All calculators</Link></nav>
      </div>
    </footer>
  );
}
