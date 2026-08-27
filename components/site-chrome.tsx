import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

/**
 * Global application chrome. The Navbar and Footer render on every
 * route so navigation is always available, including the landing page.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
