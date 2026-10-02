import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SITE_NAME, SITE_URL, TAGLINE } from "@/lib/site";

const description = "Plan, compare and understand your money with simple, transparent Indian financial calculators.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} – ${TAGLINE}`, template: "%s" },
  description,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, title: `${SITE_NAME} – ${TAGLINE}`, description, type: "website", locale: "en_IN" },
};
export const viewport: Viewport = { themeColor: "#0f3d2e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="flex min-h-screen flex-col antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-brand focus:shadow-lg">Skip to content</a>
        <Navbar />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
