import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/page-transition";

/**
 * Global application chrome. The Navbar and Footer render on every
 * route so navigation is always available, including the landing page.
 * Page content is wrapped in PageTransition for consistent route motion.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
