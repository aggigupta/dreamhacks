import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Shopyland | Island Artisan Storefront",
  description: "Handcrafted island goods sourced directly from remote artisan cooperatives, shipped worldwide via low-carbon consolidated maritime freight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="text-slate-800 antialiased min-h-screen flex flex-col selection:bg-[#55AEB1] selection:text-white relative">
        {/* Living turquoise-ocean backdrop, softened by a frosted-glass layer so
            every surface on top stays fully legible. */}
        <div className="ocean-bg" aria-hidden="true">
          <div className="ocean-bg__base" />
          <div className="ocean-bg__sheen" />
        </div>

        <Providers>
          <Navbar />
          <div className="flex-grow">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
