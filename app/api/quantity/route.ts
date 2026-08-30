/**
 * POST /api/quantity
 * ==================
 *
 * Body:  { input: PredictionInput, product: Product }
 * Reply: { suggestedQuantity, pricePerUnit, totalPrice, sustainabilityNote }
 *        (QuantityResponse)
 *
 * `suggestedQuantity` is DETERMINISTIC — householdSize x usageFrequency is the
 * base driver (see computeQuantity). The LLM is only asked for the one-line
 * `sustainabilityNote`, and only when sustainabilityPriority >= 3. If that call
 * fails we return the deterministic quantity with sustainabilityNote: null — the
 * demo can never break on the AI path.
 */
import { NextResponse } from "next/server";
import { aiLive, cleanSentence, MODEL, openai } from "@/lib/openai";
import { clampSustainability, computeQuantity } from "@/lib/prediction";
import type { QuantityResponse } from "@/lib/types";
import { parsePredictionInput, parseProduct } from "@/lib/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { input: rawInput, product: rawProduct, listing: rawListing } = (body ?? {}) as {
    input?: unknown;
    product?: unknown;
    listing?: { consumptionPerPersonPerWeek?: number; unitsPerPack?: number; price?: number } | null;
  };

  const input = parsePredictionInput(rawInput);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

  const product = parseProduct(rawProduct);
  if ("error" in product) return NextResponse.json({ error: product.error }, { status: 400 });

  // Deterministic quantity — the guaranteed answer. The selected seller's listing
  // can override pack size / weekly-consumption rate / unit price.
  const opts =
    rawListing && typeof rawListing === "object"
      ? {
          consumptionPerPersonPerWeek:
            typeof rawListing.consumptionPerPersonPerWeek === "number"
              ? rawListing.consumptionPerPersonPerWeek
              : undefined,
          unitsPerPack:
            typeof rawListing.unitsPerPack === "number" ? rawListing.unitsPerPack : undefined,
          pricePerUnit: typeof rawListing.price === "number" ? rawListing.price : undefined,
        }
      : undefined;
  const q = computeQuantity(input, product, opts);
  const base: QuantityResponse = {
    suggestedQuantity: q.suggestedQuantity,
    pricePerUnit: q.pricePerUnit,
    totalPrice: q.totalPrice,
    sustainabilityNote: null,
    weeksOfSupply: q.weeksOfSupply,
    basis: q.basis,
  };

  const s = clampSustainability(input.sustainabilityPriority);
  if (s < 3 || !aiLive() || !openai) {
    return NextResponse.json(base, { headers: { "x-shopsense-engine": "deterministic" } });
  }

  try {
    const system =
      "You are the voice of ShopSense AI. Write ONE plain-text sentence (max 30 words) " +
      "explaining why buying the suggested quantity now is the more sustainable choice: " +
      "it lets our shipping-bundling feature combine items into fewer deliveries, cutting " +
      "shipping trips and packaging. Tie it to the shopper's actual numbers. " +
      "No JSON, no quotes, no lists, no body/diet/price talk.";

    const user =
      `Shopper signals: ${JSON.stringify(input)}\n` +
      `Product: ${product.name} (sold per ${product.unit ?? "unit"}).\n` +
      `Suggested quantity: ${q.suggestedQuantity} (${q.basis}).\n` +
      `Their sustainability priority is ${s}/5. Write the nudge.`;

    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.8,
      max_tokens: 120,
    });

    const note = cleanSentence(resp.choices[0]?.message?.content);
    return NextResponse.json(
      { ...base, sustainabilityNote: note || null } satisfies QuantityResponse,
      { headers: { "x-shopsense-engine": note ? "llm" : "deterministic-fallback" } },
    );
  } catch (err) {
    console.error("[quantity] sustainability note failed, returning quantity only:", err);
    return NextResponse.json(base, {
      headers: { "x-shopsense-engine": "deterministic-fallback" },
    });
  }
}
