"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Sparkles, Compass, Store, Info, Home, PlusCircle, LogOut, Mail, RotateCcw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { CargoMeter } from "@/components/CargoMeter";

export function Navbar() {
  const pathname = usePathname();
  const { cartCount, resetDemoState } = useCart();
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/discover", label: "Quiz", icon: Compass },
    { href: "/recommendations", label: "AI Picks", icon: Sparkles },
    { href: "/browse", label: "Catalog", icon: Store },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Shopyland Logo"
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#082B5C] text-white shadow-sm"
                      : "text-slate-600 hover:text-[#082B5C] hover:bg-slate-200/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* If signed in as Shopkeeper, show portal & add product links */}
            {user?.role === "shopkeeper" && (
              <>
                <div className="w-px h-4 bg-slate-300 mx-1" />
                <Link
                  href="/shopkeeper"
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === "/shopkeeper"
                      ? "bg-[#082B5C] text-white"
                      : "text-[#082B5C] bg-[#55AEB1]/15 hover:bg-[#55AEB1]/25"
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-[#55AEB1]" />
                  <span className="hidden lg:inline">My Store</span>
                </Link>
                <Link
                  href="/shopkeeper/add-product"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">List</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Actions: Cargo, Reset Demo, Auth & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xl:block px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
              <CargoMeter variant="chip" />
            </div>
            {/* Reset Demo Button */}
            <button
              onClick={resetDemoState}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-rose-600 text-xs font-bold transition-all flex items-center gap-1"
              title="Reset state to pristine demo defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                  {user.avatar && /^(https?:|\/)/.test(user.avatar) ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-[#082B5C] text-white flex items-center justify-center text-[11px] font-bold">
                      {(user.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="text-left">
                    <span className="font-bold text-[#082B5C] block leading-tight line-clamp-1 max-w-[110px]">{user.name}</span>
                    <span className="text-[10px] text-[#55AEB1] capitalize font-semibold block">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn-navy px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Mail className="w-3.5 h-3.5 text-[#55AEB1]" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-[#082B5C] font-semibold text-xs transition-all group"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#082B5C] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="bg-[#55AEB1] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile nav bar */}
        <div className="md:hidden flex items-center justify-around py-2 px-3 border-t border-slate-200 bg-white">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold ${
                  isActive ? "text-[#082B5C] font-bold" : "text-slate-500"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
