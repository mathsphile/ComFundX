import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";
import { themeInitScript } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-jbmono",
});

export const metadata: Metadata = {
  title: "CrowdFundX — Launch. Fund. Build. Powered by Stellar.",
  description:
    "Decentralized crowdfunding platform powered by Soroban smart contracts on Stellar. Securing funds with zero middleman and 100% automated refunds.",
  keywords: [
    "Stellar",
    "Soroban",
    "Crowdfunding",
    "Web3",
    "Crypto",
    "XLM",
    "Smart Contracts",
    "Kickstarter",
  ],
  openGraph: {
    title: "CrowdFundX — Decentralized Crowdfunding on Stellar",
    description: "Launch. Fund. Build. Secured by Soroban Smart Contracts.",
    url: "https://crowdfundx.stellar.org",
    siteName: "CrowdFundX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased min-h-screen flex flex-col">
        {/* Apply persisted theme before hydration to avoid a flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
