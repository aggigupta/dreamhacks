export interface Seller {
  id: string;
  name: string;
  specialty: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  bio: string;
  story: string;
  sustainabilityFocus: string;
  avatarIcon: string;
  bannerGradient: string;
}

export const sellers: Seller[] = [
  {
    id: "mayas-kitchen",
    name: "Maya's Kitchen",
    specialty: "Artisanal Coconut & Food Specialties",
    locationName: "Sunset Cove, North Ridge",
    coordinates: { lat: -17.532, lng: -149.568 },
    bio: "Maya grew up harvesting wild coconuts and solar-drying fruits using traditional island heat-retention methods.",
    story: "Founded in 2018, Maya's Kitchen turns native coconut groves into small-batch treats and cold-pressed oils. Every batch is harvested by hand, supporting 6 local farming families across the northern ridge.",
    sustainabilityFocus: "Compostable packaging & 100% zero-waste coconut processing.",
    avatarIcon: "🥥",
    bannerGradient: "from-amber-600 to-orange-700",
  },
  {
    id: "tomas-apiary",
    name: "Tomas Apiary",
    specialty: "Raw Wild Honey & Bee Products",
    locationName: "Highland Bloom Valley",
    coordinates: { lat: -17.545, lng: -149.552 },
    bio: "Tomas has been caring for island wild bees for over 20 years in the undisturbed high canopy forest.",
    story: "Deep in the highland bloom valley, Tomas maintains ethical hives that pollinate the island's native wildflowers. The honey is harvested sustainably without heat filtering, preserving pure medicinal enzymes.",
    sustainabilityFocus: "Reusability & protective native pollinator sanctuary management.",
    avatarIcon: "🍯",
    bannerGradient: "from-yellow-600 to-amber-700",
  },
  {
    id: "nalini-spice-house",
    name: "Nalini Spice House",
    specialty: "Volcanic Soil Spices & Organic Botanicals",
    locationName: "East Ridge Terraces",
    coordinates: { lat: -17.528, lng: -149.535 },
    bio: "Nalini blends ancestral botanical knowledge with solar-assisted spice drying techniques.",
    story: "Growing turmeric, ginger, and botanicals on rich volcanic soil, Nalini Spice House crafts small batches of potent spice mixes and essential soaps. Everything is sun-cured and ground fresh to order.",
    sustainabilityFocus: "Plastic-free paper packaging & organic rain-fed farming.",
    avatarIcon: "🌿",
    bannerGradient: "from-emerald-600 to-teal-700",
  },
  {
    id: "lani-weaves",
    name: "Lani Weaves",
    specialty: "Traditional Handwoven Palm Crafts",
    locationName: "Palms & Tide Lagoon",
    coordinates: { lat: -17.558, lng: -149.575 },
    bio: "Master artisan Lani weaves heritage palm fiber baskets using generations-old Polynesian techniques.",
    story: "Each piece from Lani Weaves takes days of hand preparation — harvesting fallen palm fronds, soaking in seawater, and weaving durable heirloom storage baskets built to last a lifetime.",
    sustainabilityFocus: "100% wild-harvested natural fibers & zero synthetic dyes.",
    avatarIcon: "🧺",
    bannerGradient: "from-purple-600 to-pink-700",
  },
  {
    id: "coral-coast-crafts",
    name: "Coral Coast Crafts",
    specialty: "Reclaimed Driftwood & Sea Glass Jewelry",
    locationName: "Southern Reef Point",
    coordinates: { lat: -17.569, lng: -149.542 },
    bio: "A collective of coastal artists transforming beach flotsam and storm debris into stunning wearable art.",
    story: "During monthly coastal cleanups, Coral Coast Crafts collects sea glass, discarded shells, and storm driftwood. Every piece is cleaned, shaped, and repurposed into one-of-a-kind art.",
    sustainabilityFocus: "Direct beach-cleanup restoration & 100% reclaimed materials.",
    avatarIcon: "🌊",
    bannerGradient: "from-cyan-600 to-blue-700",
  },
  {
    id: "greenroot-coop",
    name: "GreenRoot Co-op",
    specialty: "Sustainable Living Essentials & Reef Care",
    locationName: "Harbor Eco Community Hub",
    coordinates: { lat: -17.519, lng: -149.560 },
    bio: "An island community co-op dedicated to eliminating single-use plastics across the archipelago.",
    story: "GreenRoot Co-op brings together local eco-engineers and botanical experts to formulate reef-safe mineral sunscreens, bamboo travel sets, and plastic-free daily goods for islanders and travelers alike.",
    sustainabilityFocus: "Closed-loop circular economy & ocean habitat preservation.",
    avatarIcon: "🌱",
    bannerGradient: "from-teal-600 to-emerald-800",
  },
];
