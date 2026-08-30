"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle, ArrowLeft, Leaf, Store, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";

export default function AddProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addProduct } = useCart();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<"food" | "wellness" | "craft" | "sustainable-goods">("food");
  const [price, setPrice] = useState<number>(12);
  const [unit, setUnit] = useState("bag");
  const [imageUrl, setImageUrl] = useState("");
  const [materialIndex, setMaterialIndex] = useState("Renewable Coconut Husk");
  const [replantingImpact, setReplantingImpact] = useState("2 coastal mangrove saplings");
  const [ecoTag, setEcoTag] = useState("compostable packaging");
  const [description, setDescription] = useState("");
  const [bulkFriendly, setBulkFriendly] = useState(true);
  const [perishable, setPerishable] = useState(false);
  const [toastMsg, setToastMsg] = useState(false);

  const sellerName = user?.storeName || user?.name || "Maya's Kitchen";
  const sellerId = user?.sellerId || sellerName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // On-brand category placeholder when the seller doesn't supply an image URL,
  // so a new listing never shows an unrelated stock photo.
  const defaultImage = `/products/new-${category}.svg`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const newProdId = `p-custom-${Date.now().toString().slice(-6)}`;
    const newProduct: Product = {
      id: newProdId,
      name: name.trim(),
      category,
      price: Number(price),
      basePrice: Number(price),
      unit: unit.trim() || "unit",
      image: imageUrl.trim() || defaultImage,
      ecoTag: ecoTag.trim() || "100% sustainable",
      materialIndex: materialIndex.trim() || "Renewable Harvest",
      replantingImpact: replantingImpact.trim() || "1 coastal mangrove sapling",
      courierMilesPerItem: 4.0,
      description: description.trim() || `${name} handcrafted by ${sellerName}.`,
      bulkFriendly,
      bulkAvailable: bulkFriendly,
      perishable,
      consumable: perishable,
      seller: sellerName,
      sellerId: sellerId,
      sellerAvatar: user?.avatar || "/products/seller-default.svg",
      atollHub: "North Atoll Co-op Hub",
      packaging: "minimal",
      sizeTier: "medium",
      tierPricing: [
        { minQty: 1, pricePerUnit: Number(price), discountPct: 0 },
        { minQty: 3, pricePerUnit: Number((Number(price) * 0.85).toFixed(2)), discountPct: 15 },
        { minQty: 5, pricePerUnit: Number((Number(price) * 0.7).toFixed(2)), discountPct: 30 },
      ],
    };

    addProduct(newProduct);
    setToastMsg(true);

    setTimeout(() => {
      router.push("/browse");
    }, 1200);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link
        href="/shopkeeper"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#082B5C] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Shopkeeper Dashboard</span>
      </Link>

      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
          ✨
        </div>
        <h1 className="text-3xl font-extrabold text-[#082B5C]">List a New Island Product</h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Add your handcrafted goods to the Shopyland catalog with high-resolution photography and provenance metrics.
        </p>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold text-center flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Product listed successfully! Redirecting to catalog...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-[14px] border border-slate-200 shadow-sm space-y-6">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-[#082B5C]">
            <Store className="w-4 h-4 text-[#55AEB1]" />
            <span>Artisan Seller: {sellerName}</span>
          </div>
          <span className="text-slate-500 text-[11px]">Seller ID: {sellerId}</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Organic Vanilla Extract, 100ml"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
              >
                <option value="food">Food & Pantry</option>
                <option value="wellness">Wellness & Care</option>
                <option value="craft">Handcrafted Art</option>
                <option value="sustainable-goods">Sustainable Goods</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price ($ USD)</label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Type</label>
              <input
                type="text"
                required
                placeholder="e.g. bag, jar, bottle, piece"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
              />
            </div>
          </div>

          {/* Product Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#55AEB1]" />
              <span>Product Image Photo URL (Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... (Leave blank for automatic HD photography)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Material Transparency Index</label>
              <input
                type="text"
                required
                placeholder="e.g. Renewable Coconut Husk"
                value={materialIndex}
                onChange={(e) => setMaterialIndex(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Direct Replanting Impact</label>
              <input
                type="text"
                required
                placeholder="e.g. 2 coastal mangrove saplings"
                value={replantingImpact}
                onChange={(e) => setReplantingImpact(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-[#55AEB1]" />
              <span>Eco Tag</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. compostable packaging, reef-safe formula"
              value={ecoTag}
              onChange={(e) => setEcoTag(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Product Description</label>
            <textarea
              rows={3}
              required
              placeholder="Describe your harvest method, ingredients, or artisan technique..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={bulkFriendly}
                onChange={(e) => setBulkFriendly(e.target.checked)}
                className="accent-[#082B5C] w-4 h-4"
              />
              <span>📦 Bulk Friendly Item</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={perishable}
                onChange={(e) => setPerishable(e.target.checked)}
                className="accent-[#082B5C] w-4 h-4"
              />
              <span>🌾 Consumable / Perishable Item</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="btn-navy w-full py-4 rounded-xl font-bold text-base shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5 text-[#55AEB1]" />
          <span>Publish & List Product Live</span>
        </button>
      </form>
    </main>
  );
}
