import { NextResponse } from "next/server";
import { aiLive, extractJson, MODEL, openai } from "@/lib/openai";
import {
  fallbackRecommendations,
  fallbackSummary,
  reasonFromSignals,
  scoreProducts,
} from "@/lib/prediction";
import type { RecommendResponse } from "@/lib/types";
import { parsePredictionInput, parseProducts } from "@/lib/validation";
import { db } from "@/lib/db";

const MAX_RECOMMENDATIONS = 3;
const SHORTLIST_SIZE = 6;

export async function POST(request: Request) {
  const startMs = Date.now();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { input: rawInput, products: rawProducts, cartHubs: rawCartHubs } = (body ?? {}) as {
    input?: unknown;
    products?: unknown;
    cartHubs?: unknown;
  };

  const input = parsePredictionInput(rawInput);
  if ("error" in input) return NextResponse.json({ error: input.error }, { status: 400 });

  // Use products from request body or fallback to DB catalog
  const parsed = rawProducts ? parseProducts(rawProducts) : null;
  let products: import("@/lib/types").Product[] =
    parsed && !("error" in parsed) ? parsed : await db.getAllProducts();

  // Same-hub bundling: if the cart already has items from certain artisan hubs,
  // prefer products from those hubs so the whole order ships in one ferry crate.
  const cartHubs = Array.isArray(rawCartHubs)
    ? rawCartHubs.filter((h): h is string => typeof h === "string")
    : [];
  const sameHub = cartHubs.length
    ? products.filter((p) => p.atollHub && cartHubs.includes(p.atollHub))
    : [];
  if (sameHub.length >= 3) {
    products = sameHub;
  }

  // 1. Deterministic ranking
  const scored = scoreProducts(input, products);
  const shortlist = scored.slice(0, SHORTLIST_SIZE);

  let finalEngine = "deterministic";
  let finalModel = "deterministic-scorer-v2";

  const deterministicRecs = fallbackRecommendations(scored, 3);
  const deterministicSummaryText = fallbackSummary(input, scored);

  // 2. LLM re-rank if API key live
  if (!aiLive() || !openai) {
    const latencyMs = Date.now() - startMs;
    const recommendedIds = deterministicRecs.map((r) => r.productId);

    void db.logRecommendation({
      signals: input,
      recommendedIds,
      engine: finalEngine,
      modelUsed: finalModel,
      latencyMs,
    });

    return NextResponse.json({
      recommendations: deterministicRecs,
      summary: deterministicSummaryText,
      engine: finalEngine,
      latencyMs,
      modelUsed: finalModel,
    });
  }

  try {
    const catalogForModel = shortlist.map((sp) => ({
      productId: sp.product.id,
      name: sp.product.name,
      category: sp.product.category,
      fitScore: sp.score,
      matchedSignals: sp.signals,
    }));

    const system =
      "You are the ranking brain of ShopSense AI, an e-commerce recommender. " +
      "A deterministic engine has already scored each product against the shopper's " +
      "structured signals and listed the signals that matched. Your job: order the " +
      "products best-first and write each `reason`. RULES: " +
      "(1) Use only productIds from the list. " +
      "(2) Every `reason` MUST reference at least one of that product's matchedSignals " +
      "in plain language (e.g. \"matches your household of 4 and regular usage\"). " +
      "(3) Never use generic AI phrasing like \"we think you'll love this\". " +
      "(4) If sustainabilityPriority >= 3, prefer bulk-friendly / low-packaging products. " +
      'Reply with ONLY JSON: {"recommendations":[{"productId","reason"}],"summary"}.';

    const userPrompt =
      `Shopper signals: ${JSON.stringify(input)}\n\n` +
      `Scored shortlist (best deterministic fit first):\n${JSON.stringify(catalogForModel, null, 2)}\n\n` +
      `Return exactly ${Math.min(3, shortlist.length)} recommendations — the strongest fits only, ` +
      `plus a one-sentence \`summary\` that names the signals that drove the ranking.`;

    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const parsed = extractJson(resp.choices[0]?.message?.content);
    const validIds = new Map(shortlist.map((sp) => [sp.product.id, sp]));
    const rawRecs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

    const recommendations = rawRecs
      .map((r) => {
        const rec = (r ?? {}) as { productId?: unknown; reason?: unknown };
        const sp = typeof rec.productId === "string" ? validIds.get(rec.productId) : undefined;
        if (!sp) return null;
        const reason =
          typeof rec.reason === "string" && rec.reason.trim().length > 0
            ? rec.reason.trim()
            : reasonFromSignals(sp.signals);
        return { productId: sp.product.id, reason };
      })
      .filter((r): r is { productId: string; reason: string } => r !== null)
      .slice(0, MAX_RECOMMENDATIONS);

    if (recommendations.length > 0) {
      finalEngine = "llm-gpt4o-mini";
      finalModel = MODEL;
      const summary =
        typeof parsed.summary === "string" && parsed.summary.trim().length > 0
          ? parsed.summary.trim()
          : deterministicSummaryText;

      const latencyMs = Date.now() - startMs;
      const recommendedIds = recommendations.map((r) => r.productId);

      void db.logRecommendation({
        signals: input,
        recommendedIds,
        engine: finalEngine,
        modelUsed: finalModel,
        latencyMs,
      });

      return NextResponse.json({
        recommendations,
        summary,
        engine: finalEngine,
        latencyMs,
        modelUsed: finalModel,
      });
    }
  } catch (err) {
    console.error("[recommend] LLM re-rank failed, using deterministic result:", err);
  }

  // Fallback
  finalEngine = "deterministic-fallback";
  const latencyMs = Date.now() - startMs;
  const recommendedIds = deterministicRecs.map((r) => r.productId);

  void db.logRecommendation({
    signals: input,
    recommendedIds,
    engine: finalEngine,
    modelUsed: finalModel,
    latencyMs,
  });

  return NextResponse.json({
    recommendations: deterministicRecs,
    summary: deterministicSummaryText,
    engine: finalEngine,
    latencyMs,
    modelUsed: finalModel,
  });
}
