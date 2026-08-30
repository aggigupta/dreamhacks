"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Leaf, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterShopkeeperPage() {
  const router = useRouter();
  const { user, signInDemo, updateUserProfile } = useAuth();

  const [storeName, setStoreName] = useState(user?.storeName || "Maya's Kitchen");
  const [specialty, setSpecialty] = useState("Artisanal Coconut & Food Specialties");
  const [locationName, setLocationName] = useState("Sunset Cove, North Ridge");
  const [bio, setBio] = useState("Small-batch island harvested goods processed with solar drying.");
  const [story, setStory] = useState("Founded in 2018, we turn native coconut groves into treats and cold-pressed oils.");
  const [sustainabilityFocus, setSustainabilityFocus] = useState("Compostable packaging & 100% zero-waste coconut processing.");
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number }>({
    lat: -17.532,
    lng: -149.568,
  });
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState<string | null>(null);

  function handleDetectGps() {
    setDetectingGps(true);
    setGpsSuccessMsg(null);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setDetectingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
        };
        setGpsLocation(coords);
        setGpsSuccessMsg(`GPS coordinates detected: ${coords.lat}, ${coords.lng}`);
        setDetectingGps(false);
      },
      (err) => {
        console.warn("GPS detection failed, using island default coordinates:", err);
        setGpsSuccessMsg("Could not fetch device GPS. Default island GPS retained.");
        setDetectingGps(false);
      },
      { timeout: 8000 }
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sellerId = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const updatedDetails = {
      role: "shopkeeper" as const,
      storeName,
      sellerId,
      gpsLocation,
    };

    if (user) {
      updateUserProfile(updatedDetails);
    } else {
      signInDemo("shopkeeper");
      updateUserProfile(updatedDetails);
    }

    router.push("/shopkeeper");
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#082B5C] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Storefront</span>
      </Link>

      <div className="text-center space-y-2">
        <img src="/logo.png" alt="Shopyland Logo" className="h-12 w-auto object-contain mx-auto" />
        <h1 className="text-3xl font-extrabold text-[#082B5C]">Register Your Artisan Store</h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Register your micro-producer business, set your store's GPS coordinates, and start listing products on Shopyland.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-[14px] border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#082B5C] border-b border-slate-200 pb-2">
            1. Store Details & Specialty
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store / Guild Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Craft Specialty</label>
              <input
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Short Bio</label>
            <input
              type="text"
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Artisan Story</label>
            <textarea
              rows={3}
              required
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
            />
          </div>
        </div>

        {/* GPS Location Section */}
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-bold text-[#082B5C] border-b border-slate-200 pb-2 flex items-center justify-between">
            <span>2. Store GPS & Location</span>
            <span className="text-xs font-normal text-[#55AEB1] font-mono">
              GPS: {gpsLocation.lat}, {gpsLocation.lng}
            </span>
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Island District / Address</label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#082B5C]">
                <MapPin className="w-4 h-4 text-[#55AEB1]" />
                <span>Geographical GPS Verification</span>
              </div>
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="px-3 py-1.5 rounded-lg bg-[#55AEB1] text-white text-xs font-bold hover:bg-[#44979A] transition-all flex items-center gap-1 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${detectingGps ? "animate-spin" : ""}`} />
                <span>Detect My Current GPS</span>
              </button>
            </div>

            {gpsSuccessMsg && (
              <p className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                {gpsSuccessMsg}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={gpsLocation.lat}
                  onChange={(e) => setGpsLocation({ ...gpsLocation, lat: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={gpsLocation.lng}
                  onChange={(e) => setGpsLocation({ ...gpsLocation, lng: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sustainability Standard */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Sustainability Commitment</label>
          <input
            type="text"
            required
            value={sustainabilityFocus}
            onChange={(e) => setSustainabilityFocus(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#082B5C]"
          />
        </div>

        <button
          type="submit"
          className="btn-navy w-full py-4 rounded-xl font-bold text-base shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-5 h-5 text-[#55AEB1]" />
          <span>Save Store & Access Shopkeeper Dashboard</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </main>
  );
}
