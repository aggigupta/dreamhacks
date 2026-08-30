import Link from "next/link";
import { Leaf, ShieldCheck, Truck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-20 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Shopyland Logo" className="h-9 w-auto object-contain" />
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Connecting remote island micro-producers with conscious global buyers through fair-trade pricing and consolidated, low-carbon maritime shipping.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#082B5C] mb-3 text-xs tracking-wider uppercase">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/discover" className="hover:text-[#55AEB1] transition-colors">AI Discovery Quiz</Link></li>
              <li><Link href="/browse" className="hover:text-[#55AEB1] transition-colors">Island Catalog</Link></li>
              <li><Link href="/recommendations" className="hover:text-[#55AEB1] transition-colors">AI Recommendations</Link></li>
              <li><Link href="/about" className="hover:text-[#55AEB1] transition-colors">Our Island & Impact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#082B5C] mb-3 text-xs tracking-wider uppercase">Artisan Guilds</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/seller/mayas-kitchen" className="hover:text-[#55AEB1] transition-colors">Maya's Kitchen</Link></li>
              <li><Link href="/seller/tomas-apiary" className="hover:text-[#55AEB1] transition-colors">Tomas Apiary</Link></li>
              <li><Link href="/seller/nalini-spice-house" className="hover:text-[#55AEB1] transition-colors">Nalini Spice House</Link></li>
              <li><Link href="/seller/lani-weaves" className="hover:text-[#55AEB1] transition-colors">Lani Weaves</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-[#082B5C] text-xs tracking-wider uppercase">Sustainability Standard</h4>
            <div className="flex items-center gap-2 text-xs text-[#55AEB1] font-medium">
              <Leaf className="w-4 h-4 shrink-0" />
              <span>100% Ocean & Reef Safe Goods</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#082B5C] font-medium">
              <Truck className="w-4 h-4 shrink-0" />
              <span>Bundled Eco Shipping Logistics</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#55AEB1]" />
              <span>Fair Trade Island Artisan Income</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 text-xs">
          <p>© 2026 Shopyland Storefront. Built for DreamHacks with ShopSense AI.</p>
        </div>
      </div>
    </footer>
  );
}
